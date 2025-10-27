import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory name using a more robust method
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define supported environments
const ENVIRONMENTS = ['staging', 'uat'];

// Function to get base URL from Cypress config
function getBaseUrlFromConfig(env) {
  const configPath = path.join(__dirname, `../cypress.config.${env}.js`);
  const configContent = fs.readFileSync(configPath, 'utf8');

  // Extract the cpapi URL from the config
  const cpapiMatch = configContent.match(/cpapi:\s*['"]([^'"]+)['"]/);
  if (!cpapiMatch) {
    throw new Error(`Could not find cpapi URL in ${configPath}`);
  }

  // Remove trailing slash if present
  return cpapiMatch[1].replace(/\/$/, '');
}

// Environment-specific configuration
const ENV_CONFIG = {
  staging: {
    serviceEntityId: 889,
    cryptoAsset: 'ETH_SEP',
    baseUrl: getBaseUrlFromConfig('staging'),
  },
  uat: {
    serviceEntityId: 1680,
    cryptoAsset: 'ETH 01',
    baseUrl: getBaseUrlFromConfig('uat'),
  },
};

// Function to get environment from config file name
function getEnvironmentFromConfig() {
  // Handle both -C=file.js and -C file.js formats
  const configArg = process.argv.find((arg) => arg.startsWith('-C'));
  const configPath = configArg?.includes('=')
    ? configArg.split('=')[1]
    : process.argv[process.argv.indexOf('-C') + 1] || 'cypress.config.staging.js';

  // Extract environment from config file name (e.g., 'staging' from 'cypress.config.staging.js')
  const env = configPath.split('.')[2];

  // Validate environment
  if (!ENVIRONMENTS.includes(env)) {
    throw new Error(`Unsupported environment: ${env}. Supported environments are: ${ENVIRONMENTS.join(', ')}`);
  }

  return env;
}

// Function to load environment variables based on environment
function loadEnvironmentVariables(env) {
  const envFile = `.env.${env}`;
  const envPath = path.join(__dirname, '..', envFile);

  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file ${envFile} not found`);
  }

  dotenv.config({ path: envPath });

  const apiKey = process.env.CP_APIKEY;
  const userId = process.env.CP_USERID;

  if (!apiKey || !userId) {
    throw new Error(`Missing required environment variables in ${envFile}`);
  }

  return { apiKey, userId };
}

// Function to get environment configuration
function getEnvironmentConfig(env) {
  const config = ENV_CONFIG[env];
  if (!config) {
    throw new Error(`No configuration found for environment: ${env}`);
  }
  return config;
}

// Function to make API request with error handling
function makeApiRequest(url, serviceEntityId, env) {
  try {
    const { apiKey, userId } = loadEnvironmentVariables(env);

    const headers = {
      'Service-Entity-Id': serviceEntityId,
      'X-Api-Key': apiKey,
      'Test-User-Id': userId,
      'Content-Type': 'application/json',
    };

    const headerString = Object.entries(headers)
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(' ');

    const response = execSync(`curl -s -X GET "${url}" ${headerString}`).toString();
    const parsedResponse = JSON.parse(response);
    return parsedResponse;
  } catch (error) {
    console.error('API Request Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Function to fetch asset IDs
async function fetchAssetIds(ENV_CONTEXT) {
  const envDataPath = path.join(__dirname, '../cypress/fixtures/CP_Agg/cp-environment-data.json');
  const envData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));

  // Get environment configuration
  const config = getEnvironmentConfig(ENV_CONTEXT);

  // Make API requests to fetch the IDs
  const getAssetAccountIds = {
    requestHeader: {},
    requestApiUrl: `${config.baseUrl}/asset-holding/assets?_sort=marketValue.amount%20desc&_page=1&_pageSize=30`,
    requestApiMethod: 'GET',
  };

  const getAssetMasterIds = {
    requestHeader: {},
    requestApiUrl: `${config.baseUrl}/common/assets`,
    requestApiMethod: 'GET',
  };

  // Execute API requests and process responses
  const assetAccountResponse = makeApiRequest(getAssetAccountIds.requestApiUrl, config.serviceEntityId, ENV_CONTEXT);
  const assetMasterResponse = makeApiRequest(getAssetMasterIds.requestApiUrl, config.serviceEntityId, ENV_CONTEXT);

  // Get Asset Account IDs
  const getAssetId = (symbol) => {
    const assets = assetAccountResponse?.data || [];
    const asset = assets.find((a) => a.assetSymbol === symbol);
    if (!asset) throw new Error(`No asset found with assetSymbol: "${symbol}"`);
    return { id: asset.id, assetAccountNumber: asset.assetAccountNumber };
  };

  // Get Asset Master IDs
  const getMasterId = (symbol) => {
    const assets = Array.isArray(assetMasterResponse) ? assetMasterResponse : [];
    if (symbol) {
      const asset = assets.find((a) => a.assetSymbol === symbol);
      if (!asset) throw new Error(`No asset found with assetSymbol: "${symbol}"`);
      return asset.id;
    }

    // No symbol provided – return a random asset ID
    if (assets.length === 0) throw new Error('Asset list is empty.');
    const randomIndex = Math.floor(Math.random() * assets.length);
    return assets[randomIndex].id;

    /*     const asset = assets.find((a) => a.assetSymbol === symbol);
    if (!asset) throw new Error(`No asset found with assetSymbol: "${symbol}"`);
    return asset.id; */
  };

  const fiat = getAssetId('USD');
  const crypto = getAssetId(config.cryptoAsset);

  return {
    fiatAssetAccountId: fiat.id,
    assetAccountNumber: fiat.assetAccountNumber,
    cryptoAssetAccountId: crypto.id,
    fiatAssetMasterId: getMasterId('USD'),
    cryptoAssetMasterId: getMasterId(config.cryptoAsset),
    otcAssetMasterId: getMasterId(),
  };
}

// Function to fetch service entity IDs
async function fetchServiceEntityId(ENV_CONTEXT) {
  const envDataPath = path.join(__dirname, '../cypress/fixtures/CP_Agg/cp-environment-data.json');
  const envData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));
  const config = getEnvironmentConfig(ENV_CONTEXT);

  // Make API request to fetch service entity IDs
  const response = makeApiRequest(`${config.baseUrl}/clients-accessor`, config.serviceEntityId, ENV_CONTEXT);

  // Helper function to get active clients of a specific type
  const getActiveClients = (type) =>
    response.filter((client) => client.type === type && client.status === 'active' && !client.isOnlineAccessReadOnly);

  // Helper function to get active service entities from clients
  const getActiveEntities = (clients) =>
    clients.flatMap((client) => client.serviceEntities.filter((entity) => entity.isActive));

  // Helper function to get a random active service entity ID of a specific type
  const getRandomServiceEntityId = (type) => {
    const activeClients = getActiveClients(type);
    if (activeClients.length === 0) return null;

    const activeEntities = getActiveEntities(activeClients);
    if (activeEntities.length === 0) return null;

    return activeEntities[Math.floor(Math.random() * activeEntities.length)].id;
  };

  // Get the config service entity ID and find its client
  const configServiceEntityId = config.serviceEntityId;
  const clientWithConfigId = response.find((client) =>
    client.serviceEntities.some((entity) => entity.id === configServiceEntityId && entity.isActive)
  );

  let institutionServiceEntityID, individualServiceEntityID;

  if (clientWithConfigId) {
    switch (clientWithConfigId.type) {
      case 'individual':
        individualServiceEntityID = configServiceEntityId;
        institutionServiceEntityID = getRandomServiceEntityId('institution');
        break;
      case 'institution':
        institutionServiceEntityID = configServiceEntityId;
        individualServiceEntityID = getRandomServiceEntityId('individual');
        break;
      default:
        institutionServiceEntityID = null;
        individualServiceEntityID = null;
    }
  } else {
    institutionServiceEntityID = getRandomServiceEntityId('institution');
    individualServiceEntityID = getRandomServiceEntityId('individual');
  }

  return { institutionServiceEntityID, individualServiceEntityID };
}

// Function to fetch whitelisting IDs
async function fetchWhitelistingIds(ENV_CONTEXT) {
  const envDataPath = path.join(__dirname, '../cypress/fixtures/CP_Agg/cp-environment-data.json');
  const envData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));

  // Get environment configuration
  const config = getEnvironmentConfig(ENV_CONTEXT);

  // Make API requests to fetch the IDs
  const getOwnBankAccountId = {
    requestHeader: {},
    requestApiUrl: `${config.baseUrl}/whitelist/own?_sort=&_page=1&_pageSize=1000`,
    requestApiMethod: 'GET',
  };

  const getThirdPartyIds = {
    requestHeader: {},
    requestApiUrl: `${config.baseUrl}/whitelist/third-party?_sort=&_page=1&_pageSize=1000`,
    requestApiMethod: 'GET',
  };

  // Execute API requests and process responses
  const ownBankResponse = makeApiRequest(getOwnBankAccountId.requestApiUrl, config.serviceEntityId, ENV_CONTEXT);
  const thirdPartyResponse = makeApiRequest(getThirdPartyIds.requestApiUrl, config.serviceEntityId, ENV_CONTEXT);

  const getAccountId = (status, accounts) => {
    const accountList = accounts?.data || [];
    const filtered = accountList.filter((a) => a.status === status);
    if (!filtered.length) {
      throw new Error(`No Account found with status: "${status}"`);
    }
    const oldest = filtered.reduce((prev, curr) => (curr.id < prev.id ? curr : prev));
    return oldest.id;
  };

  return {
    ownBankAccountId: getAccountId('verified', ownBankResponse),
    thirdPartyId: getAccountId('approved', thirdPartyResponse),
  };
}

// Main function to update environment data
async function updateEnvironmentData() {
  try {
    const ENV_CONTEXT = getEnvironmentFromConfig();

    const envDataPath = path.join(__dirname, '../cypress/fixtures/CP_Agg/cp-environment-data.json');

    // Read and validate environment data file
    if (!fs.existsSync(envDataPath)) {
      throw new Error(`Environment data file not found at: ${envDataPath}`);
    }

    const envData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));
    if (!envData.data || !envData.data[ENV_CONTEXT]) {
      throw new Error(`Environment data structure invalid or missing data for ${ENV_CONTEXT}`);
    }

    // Fetch and update asset IDs
    const assetIds = await fetchAssetIds(ENV_CONTEXT);
    envData.data[ENV_CONTEXT].fiatAssetAccountId = assetIds.fiatAssetAccountId;
    envData.data[ENV_CONTEXT].assetAccountNumber = assetIds.assetAccountNumber;
    envData.data[ENV_CONTEXT].cryptoAssetAccountId = assetIds.cryptoAssetAccountId;
    envData.data[ENV_CONTEXT].fiatAssetMasterId = assetIds.fiatAssetMasterId;
    envData.data[ENV_CONTEXT].cryptoAssetMasterId = assetIds.cryptoAssetMasterId;
    envData.data[ENV_CONTEXT].otcAssetMasterId = assetIds.otcAssetMasterId;
    envData.data[ENV_CONTEXT].serviceEntityId = getEnvironmentConfig(ENV_CONTEXT).serviceEntityId;

    // Fetch and update service entity IDs
    const serviceEntityIds = await fetchServiceEntityId(ENV_CONTEXT);
    envData.data[ENV_CONTEXT].institutionServiceEntityID = serviceEntityIds.institutionServiceEntityID;
    envData.data[ENV_CONTEXT].individualServiceEntityID = serviceEntityIds.individualServiceEntityID;

    // Fetch and update whitelisting IDs
    const whitelistingIds = await fetchWhitelistingIds(ENV_CONTEXT);
    envData.data[ENV_CONTEXT].ownBankAccountId = whitelistingIds.ownBankAccountId;
    envData.data[ENV_CONTEXT].thirdPartyBankAccountId = whitelistingIds.thirdPartyId;

    // Save the updated data
    fs.writeFileSync(envDataPath, JSON.stringify(envData, null, 2));
    console.log('Environment data updated successfully');
  } catch (error) {
    console.error('Error updating environment data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the main function
updateEnvironmentData().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
