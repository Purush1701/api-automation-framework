# API Automation Framework 🚀

## Overview 📝

Test automation framework for {your-org} application APIs, built with Cypress. This framework provides comprehensive testing coverage for:

- Client Portal Aggregators (CP_Agg)
- Back Office Aggregators (BO_Agg)
- Back Office BFF (BO_Bff)
- Back Office SCOS (BO_Scos)
- Partner APIs

The framework utilizes Cypress's native `cy.request` for API testing and validation against JSON fixtures.

## Table of Contents 📑

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Test Execution](#test-execution)
- [Test Reports](#test-reports)
- [API Coverage Analysis](#api-coverage-analysis)
- [Code Quality](#code-quality)
- [Docker Setup](#docker-setup)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Prerequisites 🛠️

- **Node.js**: v18.x or higher
- **NPM**: v5.x or higher
- **Git**: Latest version
- **Docker**: (Optional) For containerized testing

## Project Structure 📂

````plaintext
cypress/
├── e2e/                    # Test specifications
│   ├── BO_Agg/            # Back Office Aggregator tests
│   │   ├── CRM/           # CRM related tests
│   │   ├── AMS/           # AMS related tests
│   │   ├── Compliance/    # Compliance related tests
│   │   └── Billing/       # Billing related tests
│   ├── BO_Bff/            # Back Office BFF tests
│   ├── BO_Scos/           # Back Office SCOS tests
│   ├── CP_Agg/            # Client Portal Aggregator tests
│   └── PartnerAPI/        # Partner API tests
├── fixtures/              # Test data
│   ├── BO_Agg/           # BO Aggregator test data
│   ├── BO_Bff/           # BO BFF test data
│   ├── BO_Scos/          # BO SCOS test data
│   ├── CP_Agg/           # CP Aggregator test data
│   ├── PartnerAPI/       # Partner API test data
│   └── images/           # Image assets
├── support/              # Support files
│   ├── Commands/        # Custom Cypress commands
│   ├── Utility/         # Utility functions
│   └── e2e.js          # Support file for e2e tests
├── downloads/           # Downloaded files during tests
└── reports/            # Test reports
   ├── html/           # HTML reports (Mochawesome)
   └── junit/          # JUnit reports (TestMo integration)
```bash

## Installation 💻

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd sample-test-automation-api
````

1. **Install Dependencies**

   ```bash
   npm install
   ```

1. **Environment Setup**

   ```bash
   # Copy environment templates
   cp .env.common.template .env.common
   cp .env.staging.template .env.staging
   cp .env.uat.template .env.uat

   # Configure your environment variables
   ```

## Configuration ⚙️

### Environment Variables

- `.env.common`: Shared configuration
- `.env.staging`: Staging environment config
- `.env.uat`: UAT environment config

### Test Data Management 🔄

The framework requires up-to-date test data for Client Portal (CP) tests. This includes:

- Asset IDs
- Service Entity IDs
- Whitelisting IDs

#### Updating Test Data

```bash
# Update CP test data for staging
npm run update:cp-data:staging

# Update CP test data for UAT
npm run update:cp-data:uat
```

The update process:

1. Fetches current IDs from the API
2. Updates the test data in `cypress/fixtures/CP_Agg/cp-environment-data.json`
3. Ensures tests use valid, existing IDs

> **Note**: Run these commands before test execution if you encounter ID-related failures or when testing with a new environment setup.

### Important Configuration Files

- `cypress.config.js`: Cypress configuration
- `package.json`: Project dependencies and scripts
- `.prettierrc`: Code formatting rules

## Test Execution 🧪

### Via Cypress UI

#### Staging Environment

```bash
npm run cy:open:staging
```

#### UAT Environment

```bash
npm run cy:open:uat
```

### Via Command Line

#### All Tests

```bash
# Staging
npm run cy:run:staging

# UAT
npm run cy:run:uat

```

### Skip suites per run (optional)

Use the helper script to skip specific folders in UAT, or customize via CLI.

Examples (PowerShell):

```powershell
# UAT: skip IntegrationAPI and BO_Scos (predefined, this can be customized)
npm run cy:run:uat:skip

# Customize skipped folders ad-hoc via --config (adjust as needed)
npm run cy:run:uat -- --config 'excludeSpecPattern=["cypress/e2e/IntegrationAPI/**/*.cy.js","cypress/e2e/BO_Scos/**/*.cy.js"]'

# Run all (no skip)
npm run cy:run:uat
```

#### Specific Service Tests

##### Back Office (BO) Tests

```bash
# All BO Tests
npm run cy:run:staging:BO

# Specific BO Modules
npm run cy:run:staging:BO:CRM
npm run cy:run:staging:BO:AMS
npm run cy:run:staging:BO:Compliance
npm run cy:run:staging:BO:Billing
```

##### Client Portal (CP) Tests

```bash
npm run cy:run:staging:CP
```

##### Partner API Tests

```bash
npm run cy:run:staging:PartnerAPI
```

## Test Reports 📊

### HTML Reports (Mochawesome)

- Location: `cypress/reports/html`
- Features:
  - Interactive UI
  - Test execution details
  - Screenshots for failures
  - Execution time statistics

### JSON Reports (JUnit)

- Location: `cypress/reports/junit`
- Integration with TestMo
- CI/CD pipeline compatibility

## API Coverage Analysis 📈

### Coverage Commands

```bash
# Generate coverage report for all services
npm run api:coverage

# Generate coverage report for specific services
npm run api:coverage:CP     # Client Portal API (CP_Agg)
npm run api:coverage:BO     # Back Office API (BO_Agg)
npm run api:coverage:BFF    # Back Office BFF API (BO_Bff)
npm run api:coverage:SCOS   # Back Office SCOS API (BO_Scos)
npm run api:coverage:Partner # Partner API
```

### Coverage Calculation

```javascript
Coverage = ((Tested + Ignored) / (Total - Deprecated)) * 100;
```

### Coverage Thresholds

- 🟢 Good: ≥ 80%
- 🟠 Moderate: 50% to < 80%
- 🔴 Low: < 50%

### API Coverage Reports 📑

The framework automatically generates detailed API coverage reports in markdown format. These reports are:

- Generated in `cypress/reports/api-coverage/`
- Named as `api_coverage_[SERVICE].md` (e.g., `api_coverage_BO_Agg.md`)
- Include a summary report `api_coverage_summary.md` with overall statistics
- Excluded from version control (configured in .gitignore)

Each coverage report includes:

- Total endpoints in Swagger
- Number of tested endpoints
- Number of ignored endpoints
- Number of deprecated endpoints
- Coverage percentage with status indicator
- List of uncovered endpoints
- List of tested endpoints
- List of ignored endpoints

The summary report provides:

- Overall statistics across all services
- Service-wise breakdown of coverage
- Health status for each service
- Recommendations for improvement

## Code Quality 🎯

### Prettier Setup

1. Install VSCode Extension

   ```bash
   ext install esbenp.prettier-vscode
   ```

2. Format Code

   ```bash
   # Check formatting
   npm run check

   # Auto-format code
   npm run format
   ```

### Best Practices

- Follow AAA pattern (Arrange-Act-Assert)
- Use meaningful test descriptions
- Maintain test independence
- Handle errors appropriately

## Docker Setup 🐳

### Build Image

```bash
docker build -t sample-cypress --build-arg ENV_NAME=<environment> .
```

### Run Tests in Container

```bash
docker run -it sample-cypress
```

## Contributing 🤝

1. Follow the [Pull Request Template](./pull_request_template.md)
2. Ensure all tests pass
3. Update documentation
4. Follow code formatting guidelines
5. Update API coverage documentation

## Troubleshooting 🔧

### Common Issues

1. **Authentication Failures**

   - Check environment variables
   - Verify token generation
   - Confirm API endpoints

2. **Test Flakiness**

   - Review timeouts
   - Check for race conditions
   - Verify test independence

3. **Report Generation Issues**
   - Clear previous reports
   - Check disk space
   - Verify reporter configuration

### Support

For additional support:

- Check the [API Test Automation Guide]({your-org-wiki-url})

## License 📄

This project is proprietary and confidential. All rights reserved.

```

```
