import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment config
const stagingConfigPath = path.resolve(__dirname, '..', 'cypress.config.staging.js');
const stagingConfigUrl = `file://${stagingConfigPath.replace(/\\/g, '/')}`;
const stagingConfig = (await import(stagingConfigUrl)).default.env;

const COVERAGE_THRESHOLDS = {
  GOOD: 80,
  MODERATE: 50,
};

// Map service names to their Swagger URL config keys and base URLs
const SERVICE_CONFIGS = {
  CP_Agg: {
    urlKey: 'cpapi_swagger',
    baseUrl: 'cpapi',
    jsonPath: '/swagger/clientportal-bff-api/swagger.json',
  },
  BO_Agg: {
    urlKey: 'boapi_swagger',
    baseUrl: 'boapi',
    jsonPath: '/swagger/backoffice-api/swagger.json',
  },
  BO_Bff: {
    urlKey: 'bo_bff_api_swagger',
    baseUrl: 'bo_bff_api',
    jsonPath: '/swagger/backoffice-bff-api/swagger.json',
  },
  BO_Scos: {
    urlKey: 'scos_boapi_swagger',
    baseUrl: 'scos_bo',
    jsonPath: '/swagger/v1/swagger.json',
  },
  PartnerAPI: {
    urlKey: 'partnerapi_swagger',
    baseUrl: 'partnerapi',
    jsonPath: '/swagger/partner-api/swagger.json',
  },
  IntegrationAPI: {
    urlKey: 'integrationapi_swagger',
    baseUrl: 'integrationapi',
    jsonPath: '/swagger/v1/swagger.json',
  },
};

async function getSwaggerUrl(service) {
  const config = SERVICE_CONFIGS[service];
  if (!config) {
    throw new Error(`No configuration found for service: ${service}`);
  }

  // Get the base URL for the service
  const baseUrl = stagingConfig[config.baseUrl];
  if (!baseUrl) {
    throw new Error(`No base URL found for ${service} (key: ${config.baseUrl})`);
  }

  // Construct the full Swagger JSON URL
  const swaggerUrl = new URL(config.jsonPath, baseUrl).toString();
  console.log(`Swagger URL for ${service}: ${swaggerUrl}`);

  return swaggerUrl;
}

async function fetchSwaggerEndpoints(service, swaggerUrl) {
  try {
    console.log(`Fetching Swagger JSON from: ${swaggerUrl}`);

    const headers = {
      Accept: 'application/json',
    };

    if (service === 'CP_Agg' && stagingConfig.cp_apikey) {
      headers['X-API-Key'] = stagingConfig.cp_apikey;
    }

    const response = await axios.get(swaggerUrl, {
      headers,
      validateStatus: null,
    });

    if (response.status !== 200) {
      console.error(`Failed to fetch Swagger (Status ${response.status}):`, response.data);
      return { endpoints: [], deprecatedEndpoints: [] };
    }

    const swagger = response.data;
    if (!swagger || !swagger.paths) {
      console.error('Invalid Swagger JSON format:', swagger);
      return { endpoints: [], deprecatedEndpoints: [] };
    }

    const endpoints = [];
    const deprecatedEndpoints = [];

    for (const [path, methods] of Object.entries(swagger.paths)) {
      // Skip endpoints that start with "test/"
      if (path.startsWith('/test/')) {
        continue;
      }

      for (const [method, details] of Object.entries(methods)) {
        // Normalize path to match test pattern
        const normalizedPath = path.replace(/^\/+|\/+$/g, '').split('?')[0];
        const endpoint = {
          path: normalizedPath,
          method: method.toUpperCase(),
          description: details.summary || details.description,
        };

        if (details.deprecated) {
          deprecatedEndpoints.push(endpoint);
        } else {
          endpoints.push(endpoint);
        }
      }
    }

    console.log(
      `Found ${endpoints.length} active endpoints and ${deprecatedEndpoints.length} deprecated endpoints in Swagger for ${service}`
    );
    return { endpoints, deprecatedEndpoints };
  } catch (error) {
    console.error(`Error fetching Swagger from ${swaggerUrl}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { endpoints: [], deprecatedEndpoints: [] };
  }
}

async function scanCypressTests(service) {
  // Use a Map to track unique endpoints with their sources
  const endpointMap = new Map();

  // Helper function to normalize path and add endpoint
  const addEndpoint = (method, path, source) => {
    // Normalize path: remove leading/trailing slashes, query params, and normalize parameter format
    const normalizedPath = path
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .split('?')[0] // Remove query parameters //.replace(/\{(\w+)\}/g, '{id}') // Normalize path parameters to {id}
      .replace(/[?&][\w\-.]+=.*?(?=&|$)/g, '') // Remove any remaining query parameters
      .replace(/\/$/, ''); // Remove trailing slash if any

    const key = `${method.toUpperCase()} ${normalizedPath}`;
    if (!endpointMap.has(key)) {
      endpointMap.set(key, {
        method: method.toUpperCase(),
        path: normalizedPath,
        sources: new Set(),
      });
    }
    endpointMap.get(key).sources.add(source);
  };

  // Helper function to normalize endpoint from fixture
  const normalizeFixtureEndpoint = (endpoint) => {
    if (endpoint && endpoint.requestApiMethod && endpoint.requestApiUrl) {
      const normalizedPath = endpoint.requestApiUrl
        .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
        .split('?')[0] // Remove query parameters
        .replace(/[?&][\w\-.]+=.*?(?=&|$)/g, '') // Remove any remaining query parameters
        .replace(/\/$/, ''); // Remove trailing slash if any

      return {
        method: endpoint.requestApiMethod,
        path: normalizedPath,
      };
    }
    return null;
  };

  // Scan test files
  const testFiles = await glob(`cypress/e2e/${service}/**/*.cy.js`);
  console.log(`\nScanning ${testFiles.length} test files for ${service}...`);

  for (const file of testFiles) {
    const content = await fs.readFile(file, 'utf8');
    console.log(`\nScanning test file: ${file}`);

    // Match patterns in test titles and normalize them
    const testMatches = content.matchAll(/it\(['"].*?\[([A-Z]+)\]\s+\/([^'"]+)/g);
    for (const match of Array.from(testMatches)) {
      const [_, method, path] = match;
      addEndpoint(method, path, `test:${file}`);
      console.log(`Found test endpoint: ${method} ${path.split('?')[0]}`);
    }
  }

  // Scan fixture files
  const fixtureFiles = await glob(`cypress/fixtures/${service}/**/*.json`);
  console.log(`\nScanning ${fixtureFiles.length} fixture files for ${service}...`);

  for (const file of fixtureFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const fixture = JSON.parse(content);
      console.log(`\nScanning fixture file: ${file}`);

      // Helper function to process an entry recursively
      const processEntry = (entry) => {
        if (entry && typeof entry === 'object') {
          if (entry.requestApiMethod && entry.requestApiUrl) {
            const normalized = normalizeFixtureEndpoint(entry);
            if (normalized) {
              addEndpoint(normalized.method, normalized.path, `fixture:${file}`);
              console.log(`Found fixture endpoint: ${normalized.method} ${normalized.path}`);
            }
          }

          // Process nested objects and arrays
          if (Array.isArray(entry)) {
            entry.forEach(processEntry);
          } else {
            Object.values(entry).forEach(processEntry);
          }
        }
      };

      // Start processing from root
      processEntry(fixture);
    } catch (error) {
      console.warn(`Error reading fixture file ${file}:`, error.message);
    }
  }

  // Convert Map to array of unique endpoints
  const uniqueEndpoints = Array.from(endpointMap.values()).map(({ method, path }) => ({
    method,
    path,
  }));

  console.log(`\nTotal unique endpoints found for ${service}: ${uniqueEndpoints.length}`);
  return uniqueEndpoints;
}

async function getIgnoredEndpoints(service) {
  try {
    const content = await fs.readFile(`cypress/fixtures/${service}/ignored-endpoints.json`, 'utf8');
    const { ignoredEndpoints } = JSON.parse(content);
    return ignoredEndpoints.map((endpoint) => ({
      method: endpoint.requestApiMethod,
      path: endpoint.requestApiUrl.replace(/^\/+|\/+$/g, ''),
    }));
  } catch (error) {
    console.warn(`No ignored endpoints file found for ${service}`);
    return [];
  }
}

function calculateCoverage(allEndpoints, testedEndpoints, ignoredEndpoints, deprecatedEndpoints) {
  // Build a Set of deprecated endpoint keys
  const deprecatedSet = new Set(deprecatedEndpoints.map((e) => `${e.method} ${e.path}`));

  // Only consider non-deprecated endpoints for coverage
  const nonDeprecatedEndpoints = allEndpoints.filter((e) => !deprecatedSet.has(`${e.method} ${e.path}`));
  const total = allEndpoints.length;
  const deprecated = deprecatedEndpoints.length;
  const activeTotal = total - deprecated;

  // Build Sets for tested and ignored endpoints (non-deprecated only)
  const testedSet = new Set(
    testedEndpoints.filter((e) => !deprecatedSet.has(`${e.method} ${e.path}`)).map((e) => `${e.method} ${e.path}`)
  );
  const ignoredSet = new Set(
    ignoredEndpoints.filter((e) => !deprecatedSet.has(`${e.method} ${e.path}`)).map((e) => `${e.method} ${e.path}`)
  );

  // Only count endpoints as tested if they are not ignored
  const testedOnlySet = new Set([...testedSet].filter((x) => !ignoredSet.has(x)));
  const tested = testedOnlySet.size;
  const ignored = ignoredSet.size;

  // Handle edge cases
  if (activeTotal === 0) {
    console.warn('No active endpoints found in Swagger (all endpoints are deprecated)');
    return {
      total,
      tested,
      ignored,
      deprecated,
      coverage: 100, // If all endpoints are deprecated, coverage is technically 100%
      status: '🟢',
    };
  }

  // Calculate coverage
  const coverage = Math.min(((tested + ignored) / activeTotal) * 100, 100);

  let status = '🔴';
  if (coverage >= COVERAGE_THRESHOLDS.GOOD) {
    status = '🟢';
  } else if (coverage >= COVERAGE_THRESHOLDS.MODERATE) {
    status = '🟠';
  }

  return {
    total,
    tested,
    ignored,
    deprecated,
    coverage: coverage.toFixed(2),
    status,
  };
}

async function generateMarkdownReport(
  service,
  coverageData,
  allEndpoints,
  testedEndpoints,
  ignoredEndpoints,
  deprecatedEndpoints
) {
  const uncoveredEndpoints = allEndpoints.filter((endpoint) => {
    const endpointStr = `${endpoint.method} ${endpoint.path}`;
    const isTested = testedEndpoints.some((e) => `${e.method} ${e.path}` === endpointStr);
    const isIgnored = ignoredEndpoints.some((e) => `${e.method} ${e.path}` === endpointStr);
    // Exclude test endpoints
    const isTestEndpoint = endpoint.path.toLowerCase().includes('test');
    return !isTested && !isIgnored && !isTestEndpoint;
  });

  // Find tested endpoints that are deprecated
  const obsoleteTestedEndpoints = testedEndpoints.filter((testedEndpoint) => {
    const endpointStr = `${testedEndpoint.method} ${testedEndpoint.path}`;
    return deprecatedEndpoints.some((e) => `${e.method} ${e.path}` === endpointStr);
  });

  // Get Swagger URL for the service
  const swaggerUrl = await getSwaggerUrl(service);

  // Format date in HKT
  const now = new Date();
  const hktDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
  const formattedDate = hktDate.toLocaleString('en-US', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const markdown = `# API Coverage Report - ${service}

[${service} Swagger Documentation](${swaggerUrl})

## Summary ${coverageData.status}

- Total Endpoints in Swagger: ${allEndpoints.length}
- Total Tested Endpoints: ${coverageData.tested}
- Total Ignored Endpoints: ${coverageData.ignored}
- Total Deprecated Endpoints: ${deprecatedEndpoints.length}
- Coverage: ${coverageData.coverage}%

## Endpoints Breakdown

- Total Endpoints in Swagger: ${allEndpoints.length}
- Tested Endpoints: ${testedEndpoints.length}
- Ignored Endpoints: ${ignoredEndpoints.length}
- Uncovered Endpoints: ${uncoveredEndpoints.length}
- Deprecated Endpoints: ${deprecatedEndpoints.length}

## Obsolete Tests (Testing Deprecated Endpoints)
${
  obsoleteTestedEndpoints.length > 0
    ? '\nThe following endpoints are being tested but are marked as deprecated in Swagger. Consider removing these tests:\n\n' +
      obsoleteTestedEndpoints.map((endpoint) => `- ${endpoint.method} ${endpoint.path}`).join('\n')
    : '\nNo tests found for deprecated endpoints. 👍'
}

## Uncovered Endpoints

${uncoveredEndpoints.map((endpoint) => `- ${endpoint.method} ${endpoint.path}`).join('\n')}

## Tested Endpoints

${testedEndpoints.map((endpoint) => `- ${endpoint.method} ${endpoint.path}`).join('\n')}

## Ignored Endpoints

${ignoredEndpoints.map((endpoint) => `- ${endpoint.method} ${endpoint.path}`).join('\n')}

## Generated on ${formattedDate} (HKT)
`;

  const reportDir = 'cypress/reports/api-coverage';
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(path.join(reportDir, `api_coverage_${service}.md`), markdown);
}

function getStatusEmoji(coverage) {
  if (coverage >= 90) return '🟢';
  if (coverage >= 60) return '🟠';
  return '🔴';
}

function getHealthStatus(coverage) {
  if (coverage >= 90) return '✨ Excellent';
  if (coverage >= 60) return '📈 Satisfactory';
  return '⚠️ Needs Attention';
}

function generateSummaryReport(services) {
  const totalEndpoints = services.reduce((sum, s) => sum + s.allEndpoints.length, 0);
  const totalTested = services.reduce((sum, s) => sum + (s.coverageData.tested || 0), 0);
  const totalIgnored = services.reduce((sum, s) => sum + (s.coverageData.ignored || 0), 0);
  const totalDeprecated = services.reduce((sum, s) => sum + s.deprecatedEndpoints.length, 0);
  const overallCoverage =
    totalEndpoints - totalDeprecated > 0
      ? (((totalTested + totalIgnored) / (totalEndpoints - totalDeprecated)) * 100).toFixed(2)
      : 0;

  // Format date in HKT
  const now = new Date();
  const hktDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
  const formattedDate = hktDate.toLocaleString('en-US', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  let report = `# API Coverage Summary Report\n\n`;

  // Overall Statistics Table with fixed widths
  report += `## Overall Statistics\n\n`;
  report += `| Metric             | Value                             |\n`;
  report += `|:-------------------|:----------------------------------|\n`;
  report += `| Total Endpoints    | ${totalEndpoints.toString().padEnd(30)} |\n`;
  report += `| Tested Endpoints   | ${totalTested.toString().padEnd(30)} |\n`;
  report += `| Ignored Endpoints  | ${totalIgnored.toString().padEnd(30)} |\n`;
  report += `| Total Deprecated   | ${totalDeprecated.toString().padEnd(30)} |\n`;
  report += `| Overall Coverage   | ${Math.round(overallCoverage)}% ${getStatusEmoji(overallCoverage)} |\n\n`;

  // Coverage by Service Table with fixed widths
  report += `## Coverage by Service\n\n`;
  report += `| Service      | Total      | Tested     | Ignored    | Deprecated | Coverage   | Status     | Health                |\n`;
  report += `|:-------------|:-----------|:-----------|:-----------|:-----------|:-----------|:-----------|:----------------------|\n`;

  services.forEach((service) => {
    const coverage = parseFloat(service.coverageData.coverage);
    const status = getStatusEmoji(coverage);
    const health = getHealthStatus(coverage);
    // Use deduplicated, mutually exclusive tested/ignored counts from coverageData
    report += `| ${service.service.padEnd(10)} | ${service.allEndpoints.length.toString().padEnd(9)} | ${service.coverageData.tested.toString().padEnd(9)} | ${service.coverageData.ignored.toString().padEnd(9)} | ${service.deprecatedEndpoints.length.toString().padEnd(9)} | ${coverage.toFixed(2).toString().padEnd(9)}% | ${status.padEnd(9)} | ${health.padEnd(16)} |\n`;
  });

  report += `\n## Detailed Analysis\n\n`;

  services.forEach((service) => {
    const coverage = parseFloat(service.coverageData.coverage);
    const status = getStatusEmoji(coverage);
    const health = getHealthStatus(coverage);
    report += `### ${service.service} ${status}\n\n`;
    report += `| Metric               | Count      | Details                                  |\n`;
    report += `|:---------------------|:-----------|:-----------------------------------------|\n`;
    report += `| Total Endpoints      | ${service.allEndpoints.length.toString().padEnd(9)} | All endpoints from Swagger                |\n`;
    report += `| Tested Endpoints     | ${service.coverageData.tested.toString().padEnd(9)} | Covered by tests                          |\n`;
    report += `| Ignored Endpoints    | ${service.coverageData.ignored.toString().padEnd(9)} | Deliberately excluded                     |\n`;
    report += `| Deprecated Endpoints | ${service.deprecatedEndpoints.length.toString().padEnd(9)} | Marked as deprecated                      |\n`;
    report += `| Coverage             | ${coverage.toFixed(2).toString().padEnd(9)}% | ${health.padEnd(35)} |\n\n`;

    if (service.uncoveredEndpoints && service.uncoveredEndpoints.length > 0) {
      // report += `#### Top Uncovered Endpoints (${service.uncoveredEndpoints.length} total)\n\n`;
      // report += `| Method     | Endpoint                                 |\n`;
      // report += `|:-----------|:-----------------------------------------|\n`;
      // service.uncoveredEndpoints.slice(0, 5).forEach((endpoint) => {
      //   report += `| ${endpoint.method.padEnd(9)} | ${endpoint.path.padEnd(40)} |\n`;
      // });
    } else {
      report += `#### All endpoints are covered! \n\n`;
    }
  });

  // Service Health Summary Table with fixed widths
  report += `## Service Health Summary\n\n`;
  report += `| Service      | Status     | Recommendation                                    |\n`;
  report += `|:-------------|:-----------|:--------------------------------------------------|\n`;
  services.forEach((service) => {
    const coverage = parseFloat(service.coverageData.coverage);
    const status = getStatusEmoji(coverage);
    let recommendation = '';
    if (coverage >= 90) {
      recommendation = 'Good coverage - Maintain current level';
    } else if (coverage >= 60) {
      recommendation = 'Could be improved - Add more test coverage';
    } else {
      recommendation = 'Needs significant improvement - Focus on adding tests';
    }
    report += `| ${service.service.padEnd(10)} | ${status.padEnd(9)} | ${recommendation.padEnd(48)} |\n`;
  });

  report += `\n## Generated on ${formattedDate} (HKT)\n`;
  return report;
}

// Main execution
async function main() {
  // Get service from command line argument
  const requestedService = process.argv[2];
  console.log('Starting coverage analysis for staging environment...');

  // Define available services
  const availableServices = ['CP_Agg', 'BO_Agg', 'BO_Bff', 'PartnerAPI', 'BO_Scos', 'IntegrationAPI']; //'BO_Scos'

  // If a service is specified, validate and use it, otherwise use all services
  let services = availableServices;
  if (requestedService) {
    if (!availableServices.includes(requestedService)) {
      console.error(
        `Error: Invalid service "${requestedService}". Available services: ${availableServices.join(', ')}`
      );
      process.exit(1);
    }
    services = [requestedService];
  }

  const serviceResults = [];

  // Verify all Swagger URLs for staging
  console.log('\nVerifying staging Swagger URLs:');
  for (const service of services) {
    try {
      const swaggerUrl = await getSwaggerUrl(service);
      console.log(`✓ ${service}: ${swaggerUrl}`);
    } catch (error) {
      console.error(`✗ ${service}: ${error.message}`);
    }
  }

  console.log('\nAnalyzing API coverage for staging environment...');

  for (const service of services) {
    try {
      const swaggerUrl = await getSwaggerUrl(service);
      const { endpoints, deprecatedEndpoints } = await fetchSwaggerEndpoints(service, swaggerUrl);
      console.log(
        `Found ${endpoints.length} active endpoints and ${deprecatedEndpoints.length} deprecated endpoints in Swagger`
      );

      const testedEndpoints = await scanCypressTests(service);
      console.log(`Found ${testedEndpoints.length} tested endpoints`);

      const ignoredEndpoints = await getIgnoredEndpoints(service);
      console.log(`Found ${ignoredEndpoints.length} ignored endpoints`);

      const coverageData = calculateCoverage(endpoints, testedEndpoints, ignoredEndpoints, deprecatedEndpoints);

      // Get uncovered endpoints, excluding test endpoints
      const uncoveredEndpoints = endpoints.filter((endpoint) => {
        const endpointStr = `${endpoint.method} ${endpoint.path}`;
        const isTested = testedEndpoints.some((e) => `${e.method} ${e.path}` === endpointStr);
        const isIgnored = ignoredEndpoints.some((e) => `${e.method} ${e.path}` === endpointStr);
        const isTestEndpoint = endpoint.path.toLowerCase().includes('test');
        return !isTested && !isIgnored && !isTestEndpoint;
      });

      await generateMarkdownReport(
        service,
        coverageData,
        endpoints,
        testedEndpoints,
        ignoredEndpoints,
        deprecatedEndpoints
      );

      serviceResults.push({
        service,
        coverageData,
        uncoveredEndpoints,
        allEndpoints: endpoints,
        testedEndpoints,
        ignoredEndpoints,
        deprecatedEndpoints,
      });

      console.log(`Coverage report generated for ${service}: ${coverageData.coverage}% ${coverageData.status}`);
    } catch (error) {
      console.error(`Failed to analyze coverage for ${service}:`, error.message);
      serviceResults.push({
        service,
        coverageData: { total: 0, tested: 0, ignored: 0, coverage: 0, status: '🔴' },
        uncoveredEndpoints: [],
        allEndpoints: [],
        testedEndpoints: [],
        ignoredEndpoints: [],
        deprecatedEndpoints: [],
      });
    }
  }

  // Generate summary report
  const summaryReport = generateSummaryReport(serviceResults);
  const summaryReportPath = 'cypress/reports/api-coverage/api_coverage_summary.md';

  // Ensure the directory exists
  await fs.mkdir('cypress/reports/api-coverage', { recursive: true });

  // Write the summary report
  await fs.writeFile(summaryReportPath, summaryReport, 'utf8');

  console.log(
    '\nStaging environment summary report generated at: cypress/reports/api-coverage/api_coverage_summary.md'
  );
}

main().catch(console.error);
