# GitHub Copilot Usage Guide for {your-org} API Automation 🤖

## Table of Contents 📑

- [Overview](#overview)
- [Project Context for Copilot](#project-context-for-copilot)
- [Writing Effective Prompts](#writing-effective-prompts)
- [API Test Automation with Copilot](#api-test-automation-with-copilot)
- [Code Generation Best Practices](#code-generation-best-practices)
- [Fixture Data Generation](#fixture-data-generation)
- [Custom Commands and Utilities](#custom-commands-and-utilities)
- [Environment Configuration](#environment-configuration)
- [Documentation Generation](#documentation-generation)
- [Troubleshooting with Copilot](#troubleshooting-with-copilot)
- [Do's and Don'ts](#dos-and-donts)

## Overview 📝

This guide provides project-specific instructions for effectively using GitHub Copilot within the {your-org} API Automation framework. Copilot can significantly accelerate development of API tests, custom commands, and utility functions when properly guided with context-aware prompts.

## Project Context for Copilot 🎯

### Key Information to Provide to Copilot

When working with Copilot in this project, always provide these context elements in your prompts:

- **Framework**: Cypress API automation framework
- **Testing Focus**: API testing for {your-org} services (CP_Agg, BO_Agg, BO_Bff, BO_Scos, PartnerAPI)
- **Structure**: Test files use `.cy.js` extension with describe/it blocks
- **Custom Commands**: `cy.api_request()`, `cy.verifyStatusCode()`, `cy.validateResponseBody()`
- **Data Management**: JSON fixtures in `cypress/fixtures/` directory
- **Environment**: Multi-environment support (staging, UAT) with `.env` files

### Sample Context Prompt

```
// Context: Cypress API automation for {your-org} APIs
// Framework: Custom commands for API testing
// Structure: Tests in cypress/e2e/, fixtures in cypress/fixtures/
// Pattern: sendAPIRequestAndValidate() function with JSON test data
```

## Writing Effective Prompts 💬

### Specific API Test Generation

**Good Prompt:**

```
Create a Cypress API test for {your-org} BO_Agg CRM service:
- Endpoint: GET /customers/list
- Expected status: 200
- Use sendAPIRequestAndValidate pattern
- Include proper describe/it structure
- Follow project naming convention
```

**Poor Prompt:**

```
Create an API test
```

### Test Data Generation

**Good Prompt:**

```
Generate JSON fixture data for {your-org} bank transaction API:
- Include requestHeader, requestApiMethod, requestApiUrl, requestQS, requestBody
- Method: POST /bank-transactions/upload
- Include expected responseBody structure
- Follow project fixture pattern
```

### Custom Command Generation

**Good Prompt:**

```
Create Cypress custom command for {your-org} token generation:
- Function name: generate{your-org}Token
- Parameters: clientId, clientSecret, tokenUrl
- Return access token string
- Use cy.request() with proper error handling
- Follow project JSDoc documentation style
```

## API Test Automation with Copilot 🔧

### Test File Generation

Use Copilot to generate complete test files by providing:

1. **Service Context**: Which {your-org} service (BO_Agg, CP_Agg, etc.)
2. **Module Context**: Which module (CRM, AMS, Billing, etc.)
3. **Endpoint Details**: HTTP method and endpoint path
4. **Expected Behavior**: Status codes and response validation

**Example Prompt:**

```javascript
// Generate Cypress test for {your-org} BO_Agg Finance module
// Endpoint: GET /cash-receipts/list
// Expected: 200 status, array response with transaction objects
// Use sendAPIRequestAndValidate pattern from existing tests
```

### Response Validation Generation

**Prompt Pattern:**

```javascript
// Create response validation for {your-org} API:
// Endpoint: [METHOD] /endpoint/path
// Expected fields: [list key fields]
// Validation type: schema/content/status
// Use cy.validateResponseBody() custom command
```

## Code Generation Best Practices 🎯

### Variable Naming

Guide Copilot to use project conventions:

- **Constants**: `UPPER_SNAKE_CASE` (e.g., `REQUEST_TIMEOUT`, `STATUS_CODES`)
- **Variables**: `camelCase` (e.g., `requestData`, `responseBody`)
- **Files**: `kebab-case` with service prefix (e.g., `boapi_customers.cy.js`)

**Prompt Example:**

```
Generate constants for {your-org} API testing:
- Use UPPER_SNAKE_CASE naming
- Include common HTTP status codes
- Include request timeout values
- Follow project constant declaration pattern
```

### Function Structure

**Prompt for Custom Commands:**

```javascript
// Create Cypress custom command following project patterns:
// - Use JSDoc comments with @param and @returns
// - Include error handling with descriptive messages
// - Return Cypress chainable
// - Use consistent naming convention
```

### Error Handling

**Prompt Pattern:**

```javascript
// Add error handling to {your-org} API request:
// - Handle network errors
// - Handle authentication failures
// - Provide descriptive error messages
// - Log errors appropriately
// - Follow project error handling patterns
```

## Fixture Data Generation 📊

### JSON Fixture Structure

Guide Copilot to generate fixtures following the project pattern:

**Prompt:**

```json
Create JSON fixture for {your-org} API test:
- Object name: descriptive camelCase
- Required fields: requestHeader, requestApiMethod, requestApiUrl, requestQS, requestBody
- Optional field: responseBody for validation
- Follow existing fixture patterns in project
```

### Dynamic Test Data

**Prompt for Faker.js Integration:**

```javascript
// Generate test data using @faker-js/faker for {your-org} API:
// - Email addresses, names, IDs
// - Follow project data generation patterns
// - Include data validation
// - Ensure data uniqueness for parallel tests
```

## Custom Commands and Utilities 🛠️

### API Request Commands

**Prompt Pattern:**

```javascript
// Create Cypress custom command for {your-org} API requests:
// Command name: api_request
// Parameters: request configuration object
// Features: automatic token handling, environment resolution
// Return: chainable response object
// Error handling: descriptive messages with context
```

### Utility Functions

**Prompt for Utility Generation:**

```javascript
// Create utility function for {your-org} project:
// Purpose: [specific purpose]
// Location: cypress/support/Utility/
// Export: named export
// Documentation: JSDoc with examples
// Testing: pure function when possible
```

## Environment Configuration ⚙️

### Environment Variable Management

**Prompt for .env File Generation:**

```bash
# Generate .env configuration for {your-org} API testing:
# Include API URLs for all services (CP_Agg, BO_Agg, BO_Bff, BO_Scos, PartnerAPI)
# Include authentication variables
# Use descriptive naming convention
# Group related variables with comments
```

### Config File Generation

**Prompt Pattern:**

```javascript
// Generate Cypress config for {your-org} environment:
// Extend base configuration
// Include environment-specific settings
// Set proper timeout values
// Configure reporter settings
// Follow project config pattern
```

## Documentation Generation 📚

### Code Documentation

**Prompt for JSDoc:**

```javascript
// Generate JSDoc documentation for {your-org} function:
// Include parameter types and descriptions
// Include return type
// Add usage examples
// Follow project documentation style
// Include error conditions
```

### API Coverage Documentation

**Prompt Pattern:**

```markdown
Generate API coverage documentation for {your-org} service:

- Service: [service_name]
- Coverage metrics: tested/total endpoints
- List uncovered endpoints
- Include recommendations
- Follow project markdown style
```

## Troubleshooting with Copilot 🔍

### Debugging API Tests

**Prompt for Debug Code:**

```javascript
// Add debugging to {your-org} API test:
// Log request details
// Log response details
// Add conditional logging based on environment
// Include timing information
// Follow project logging patterns
```

### Error Analysis

**Prompt Pattern:**

```javascript
// Analyze {your-org} API test failure:
// Error: [paste error message]
// Context: [test context]
// Suggest fixes following project patterns
// Include preventive measures
```

## Do's and Don'ts ✅❌

### Do's ✅

- **Provide specific context** about {your-org} APIs and project structure
- **Reference existing patterns** in the codebase when asking for new code
- **Ask for JSDoc documentation** with all generated functions
- **Request error handling** for all API interactions
- **Specify naming conventions** (camelCase, UPPER_SNAKE_CASE, etc.)
- **Include validation** in all API test suggestions
- **Ask for environment-agnostic** code when applicable

### Don'ts ❌

- **Don't generate code** without understanding the existing project patterns
- **Don't ignore error handling** in API requests
- **Don't hardcode values** that should be environment variables
- **Don't create tests** without proper describe/it structure
- **Don't generate fixtures** without following the project JSON structure
- **Don't add dependencies** without understanding project requirements
- **Don't ignore the custom command patterns** already established

## Example Copilot Conversations 💭

### Complete Test Generation

**User:** Generate a complete Cypress test file for {your-org} BO_Agg compliance module, endpoint POST /compliance/reports/generate

**Context for Copilot:**

```javascript
// {your-org} API Automation - BO_Agg Compliance Module
// Framework: Cypress with custom API commands
// Pattern: sendAPIRequestAndValidate() with JSON fixtures
// Location: cypress/e2e/BO_Agg/Compliance/
// Fixture: cypress/fixtures/BO_Agg/Compliance/
```

### Custom Command Creation

**User:** Create a custom Cypress command to handle {your-org} multi-step authentication flow

**Context for Copilot:**

```javascript
// {your-org} Authentication Flow
// Steps: 1) Get client credentials token 2) Exchange for access token
// Requirements: Support multiple environments, error handling
// Return: Access token for API requests
// Location: cypress/support/Commands/
```

### Fixture Data Enhancement

**User:** Enhance the existing fixture with dynamic data generation for {your-org} customer creation

**Context for Copilot:**

```javascript
// {your-org} Customer API - POST /customers
// Requirements: Unique email, valid phone, random but realistic data
// Use: @faker-js/faker for data generation
// Maintain: Existing fixture structure (requestHeader, requestApiMethod, etc.)
```

---

## Best Practices Summary 📋

1. **Always provide project context** in your prompts
2. **Reference existing code patterns** and conventions
3. **Request comprehensive documentation** for generated code
4. **Include error handling** in all API-related code
5. **Follow the established naming conventions** consistently
6. **Generate environment-agnostic code** when possible
7. **Validate generated code** against existing project standards
8. **Use descriptive prompts** with specific requirements
9. **Ask for complete solutions** rather than partial implementations
10. **Review and adapt** generated code to fit project standards

---

_Remember: Copilot is a powerful tool, but it requires proper guidance to generate code that fits seamlessly into the {your-org} API Automation framework. Always review and test generated code before committing._
