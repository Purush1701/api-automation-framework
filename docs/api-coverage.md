# API Coverage Documentation

## Overview

The API coverage system compares endpoints defined in Swagger documentation with the endpoints that have been tested in the Cypress test suite. This helps track which API endpoints have test coverage and which ones still need to be tested.

## Coverage Calculation

The coverage percentage is calculated as:

```
Coverage Percentage = (Tested Endpoints + Ignored Endpoints) / (Total Endpoints - Deprecated Endpoints) * 100
```

## Ignored Endpoints

Some API endpoints may be deliberately excluded from coverage requirements for valid reasons:

- Endpoints that are not applicable in the test environment
- Endpoints that require physical hardware
- Endpoints that are difficult to test in an automated way
- Deprecated endpoints that will be removed in future versions

## How to Configure Ignored Endpoints

Each API area has its own ignored-endpoints.json file located in the fixtures directory:

- `cypress/fixtures/BO_Agg/ignored-endpoints.json`
- `cypress/fixtures/BO_Bff/ignored-endpoints.json`
- `cypress/fixtures/BO_Scos/ignored-endpoints.json`
- `cypress/fixtures/CP_Agg/ignored-endpoints.json`
- `cypress/fixtures/PartnerAPI/ignored-endpoints.json`

### File Format

The ignored-endpoints.json file has the following structure:

```json
{
  "ignoredEndpoints": [
    {
      "requestApiUrl": "tags/create",
      "requestApiMethod": "POST",
      "reason": "Not applicable in test environment"
    },
    {
      "requestApiUrl": "client-portal/user/profile/avatar",
      "requestApiMethod": "POST",
      "reason": "Avatar upload tested through UI automation"
    }
  ]
}
```

### Required Fields

- `requestApiUrl`: The API endpoint path as it appears in the Swagger documentation
- `requestApiMethod`: The HTTP method (GET, POST, PUT, DELETE, PATCH)
- `reason`: A brief explanation of why this endpoint is being ignored

## Running the Coverage Check

Run the API coverage check using one of the following npm commands:

- `npm run api:coverage` - Check coverage for all environments
- `npm run api:coverage:staging` - Check coverage for staging only
- `npm run api:coverage:uat` - Check coverage for UAT only

## Coverage Status Levels

- 🟢 Good coverage (≥ 80%)
- 🟠 Moderate coverage (50% to < 80%)
- 🔴 Low coverage (< 50%)

## Coverage Reports

The coverage reports include:

- Total number of endpoints from Swagger
- Number of tested endpoints
- Number of ignored endpoints
- Effectively covered endpoints (tested + ignored)
- Missing endpoints (not tested and not ignored)
- Coverage percentage

## Best Practices

1. Only ignore endpoints for valid reasons
2. Document the specific reason for ignoring each endpoint
3. Periodically review ignored endpoints to check if they can be tested
4. Try to achieve at least 80% coverage for each API area
