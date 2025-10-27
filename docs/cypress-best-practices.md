# Cypress API Automation Best Practices

## Table of Contents

1. [Variable Naming and Declaration](#variable-naming-and-declaration)
2. [File Structure and Organization](#file-structure-and-organization)
3. [Test Structure and Organization](#test-structure-and-organization)
4. [API Request Handling](#api-request-handling)
5. [Environment Configuration](#environment-configuration)
6. [Documentation Standards](#documentation-standards)
7. [Error Handling](#error-handling)
8. [Code Reusability](#code-reusability)

## Variable Naming and Declaration

### Constants

- Use UPPER_SNAKE_CASE for constant values
- Declare constants at the top of the file
- Group related constants together
- Use descriptive names that indicate the purpose

Example:

```javascript
/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 50000;

/** HTTP Status Codes */
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVICE_UNAVAILABLE: 503,
};
```

### Variables

- Use camelCase for variable names
- Use descriptive names that indicate the purpose
- Declare variables as close to their usage as possible
- Use const when the value won't be reassigned
- Use let when the value will be reassigned

Example:

```javascript
const requestData = {
  method: 'POST',
  url: '/api/endpoint',
  body: payload,
};

let responseData;
```

### Type Declarations

- Use JSDoc comments for type declarations
- Include parameter types and return types
- Document complex object structures

Example:

```javascript
/**
 * Makes an API request with the provided configuration
 * @param {Object} data - Request configuration
 * @param {Object} data.requestHeader - Request headers
 * @param {string} data.requestApiMethod - HTTP method
 * @param {string} data.requestApiUrl - API endpoint URL
 * @param {Object} data.requestQS - Query string parameters
 * @param {Object} data.requestBody - Request body
 * @returns {Cypress.Chainable<Object>} API response
 */
```

## File Structure and Organization

### Directory Structure

```plaintext
cypress/
├── e2e/                    # Test files
│   ├── BO_Bff/            # Back Office BFF tests
│   ├── BO_Scos/           # Platform Coin OS tests
│   ├── PartnerAPI/        # Partner API tests
│   └── CP_Agg/            # Client Portal tests
├── fixtures/              # Test data files
├── support/               # Support files
│   ├── Commands/         # Custom commands
│   └── Utility/          # Utility functions
└── results/              # Test results
```

### File Naming

- Use descriptive names that indicate the purpose
- Use kebab-case for file names
- Include the API name in the file name
- Use `.cy.js` extension for test files

Example:

```plaintext
boapi_bankTransactions.cy.js
boapi_cashReceipt.cy.js
```

## Test Structure and Organization

### Test Organization

- Group related tests using describe blocks
- Use clear, descriptive test names
- Follow the pattern: "Action - [METHOD] /endpoint/path"
- Keep tests independent and isolated

Example:

```javascript
describe('Finance > bankTransactions', () => {
  it('Retrieve Bank Transactions List - [GET] /bank-transactions/uploaded/list', () => {
    sendAPIRequestAndValidate(data.retrieveBankTransactionsList);
  });
});
```

### Test Data Management

- Store test data in JSON fixtures
- Use descriptive names for test data objects
- Group related test data together
- Keep test data close to the tests that use it

Example:

```json
{
  "retrieveBankTransactionsList": {
    "requestHeader": {},
    "requestApiMethod": "GET",
    "requestApiUrl": "/bank-transactions/uploaded/list",
    "requestQS": {},
    "responseBody": {}
  }
}
```

## API Request Handling

### Request Configuration

- Use consistent structure for request configuration
- Include all necessary request components
- Use environment variables for sensitive data
- Handle different request types (GET, POST, etc.)

Example:

```javascript
const requestConfig = {
  requestHeader: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  requestApiMethod: 'POST',
  requestApiUrl: '/api/endpoint',
  requestQS: {},
  requestBody: {},
};
```

### Response Handling

- Validate response status codes
- Validate response body structure
- Handle different response types
- Use custom commands for common validations

Example:

```javascript
cy.api_request(requestConfig).verifyStatusCode(STATUS_CODES.OK).validateResponseBody(expectedResponse);
```

## Environment Configuration

### Environment Variables

- Use .env files for environment-specific configuration
- Use descriptive names for environment variables
- Group related environment variables
- Document all environment variables

Example:

```env
# API Endpoints
CP_API_URL=https://api.example.com
BO_API_URL=https://bo-api.example.com

# Authentication
CP_API_KEY=your-api-key
BO_CLIENT_ID=your-client-id
```

### Configuration Files

- Use separate config files for different environments
- Extend common configuration
- Document all configuration options
- Use type-safe configuration

Example:

```javascript
// cypress.config.staging.js
export default defineConfig({
  ...commonConfig,
  env: {
    ...commonConfig.env,
    context: 'staging',
    cpapi: 'https://staging-api.example.com',
  },
});
```

## Documentation Standards

### Code Documentation

- Use JSDoc comments for functions and classes
- Document parameters and return types
- Include examples for complex functions
- Keep documentation up to date

Example:

```javascript
/**
 * Generates an access token based on the provided configuration
 * @param {Object} config - Token generation configuration
 * @param {string} config.tokenUrl - URL for token generation
 * @param {string} config.grantType - OAuth grant type
 * @returns {Cypress.Chainable<string>} Access token
 */
```

### Test Documentation

- Document test purpose and requirements
- Include setup and teardown instructions
- Document test dependencies
- Keep test documentation up to date

## Error Handling

### API Error Messages

- Use descriptive error messages
- Include relevant context in error messages
- Use consistent error message format
- Handle different types of errors

Example:

```javascript
try {
  // API request
} catch (error) {
  throw new Error(`Failed to process request: ${error.message}`);
}
```

### Test Error Recovery

- Implement retry mechanisms for flaky tests
- Handle network errors gracefully
- Provide clear error feedback
- Log errors appropriately

## Code Reusability

### Cypress Custom Commands

- Create reusable custom commands
- Document custom command usage
- Keep commands focused and single-purpose
- Use consistent naming conventions

Example:

```javascript
Cypress.Commands.add('api_request', (data) => {
  // Implementation
});
```

### Helper Utility Functions

- Create reusable utility functions
- Keep functions pure when possible
- Document function usage
- Use consistent naming conventions

Example:

```javascript
export const generateRandomEmail = () => {
  return `test-${Date.now()}@example.com`;
};
```
