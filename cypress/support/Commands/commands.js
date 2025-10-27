/**
 * @fileoverview Custom Cypress commands for API testing.
 * This file contains custom commands for token generation, API requests,
 * response validation, and utility functions.
 */

/* ***********************************************
This example commands.js shows you how to
create various custom commands and overwrite
existing commands.

For more comprehensive examples of custom
commands please read more here:
https://on.cypress.io/custom-commands
*********************************************** */

/* -- This is a parent command --
Cypress.Commands.add('login', (email, password) => { ... }) */

/* -- This is a child command --
Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... }) */

/* -- This is a dual command --
Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... }) */

/* -- This will overwrite an existing command --
Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... }) */

import { STATUS_CODES, setCpHeaders, ENV_CONTEXT } from '../Utility/common-utility';
const { generateBvnkSignature } = require('../Utility/bvnk-signature'); // Import utility here

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 50000;

/**
 * Generates an access token based on the provided configuration
 * @param {Object} config - Token generation configuration
 * @param {string} config.tokenUrl - URL for token generation
 * @param {string} config.grantType - OAuth grant type
 * @param {string} config.scope - OAuth scope
 * @param {string} config.clientId - OAuth client ID
 * @param {string} config.clientSecret - OAuth client secret
 * @param {string} [config.username] - Username for password grant type
 * @param {string} [config.password] - Password for password grant type
 * @returns {Cypress.Chainable<string>} Access token
 */
const generateToken = (config) => {
  const options = {
    method: 'POST',
    url: Cypress.env(config.tokenUrl),
    form: true,
    body: {
      grant_type: config.grantType,
      scope: Cypress.env(config.scope),
      client_id: Cypress.env(config.clientId),
      client_secret: Cypress.env(config.clientSecret),
      ...(config.grantType === 'password' && {
        username: Cypress.env(config.username),
        password: Cypress.env(config.password),
      }),
    },
  };

  return cy.request(options).then((response) => response.body['access_token']);
};

/**
 * Token generation configurations for different services
 * @type {Object}
 */
const TOKEN_CONFIGS = {
  bo: {
    tokenUrl: 'botoken',
    grantType: 'password',
    scope: 'boapi_scope',
    clientId: 'boapi_clientId',
    clientSecret: 'boapi_clientSecret',
    username: 'boapi_username',
    password: 'boapi_password',
  },
  scos_bo: {
    tokenUrl: 'botoken',
    grantType: 'password',
    scope: 'scos_boapi_scope',
    clientId: 'scos_boapi_clientId',
    clientSecret: 'scos_boapi_clientSecret',
    username: 'scos_boapi_username',
    password: 'scos_boapi_password',
  },
  scos_integration: {
    tokenUrl: 'integrationapi_token',
    grantType: 'client_credentials',
    scope: 'integrationapi_scope',
    clientId: 'integrationapi_clientId',
    clientSecret: 'integrationapi_clientSecret',
  },
  partner: {
    tokenUrl: 'partnertoken',
    grantType: 'client_credentials',
    scope: 'partnerapi_scope',
    clientId: 'partnerapi_clientId',
    clientSecret: 'partnerapi_clientSecret',
  },
};

/**
 * Generates an access token for Back Office API
 * @returns {Cypress.Chainable<string>} Access token
 */
Cypress.Commands.add('generate_api_token_bo', () => generateToken(TOKEN_CONFIGS.bo));

/**
 * Generates an access token for Platform Coin OS Back Office API
 * @returns {Cypress.Chainable<string>} Access token
 */
Cypress.Commands.add('generate_api_token_scos_bo', () => generateToken(TOKEN_CONFIGS.scos_bo));

/**
 * Generates an access token for Partner API
 * @returns {Cypress.Chainable<string>} Access token
 */
Cypress.Commands.add('generate_api_token_partner', () => generateToken(TOKEN_CONFIGS.partner));

/**
 * Generates an access token for integration API
 * @returns {Cypress.Chainable<string>} Access token
 */
Cypress.Commands.add('generate_api_token_integration', () => generateToken(TOKEN_CONFIGS.scos_integration));

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
Cypress.Commands.add('api_request', (data) => {
  const { requestHeader, requestApiMethod, requestApiUrl, requestQS, requestBody = {} } = data;
  const headers = { ...(requestHeader || {}) };

  const url = `${Cypress.env('baseUrl')}${requestApiUrl}`;

  // Add authorization header if token exists
  if (Cypress.env('access_token') && !headers.Authorization) {
    headers.Authorization = `Bearer ${Cypress.env('access_token')}`;
  }

  // Opt-in: BFF XLSX upload (kept separate to avoid changing the blocks below)
  if (requestBody.formData?.fileFieldName === 'file') {
    return handleFormDataRequest_base64(requestApiMethod, url, headers, requestQS, requestBody);
  } else if (requestBody.formData) {
    const formDataConfig = requestBody.formData;
    const fileConfig = formDataConfig.FormFile || formDataConfig;
    // If size or contentType do not exist, use custom SC handler
    if (!fileConfig.size || !fileConfig.contentType) {
      return handleScUploadFormDataRequest(requestApiMethod, url, headers, requestQS, requestBody);
    }
    return handleFormDataRequest(requestApiMethod, url, headers, requestQS, requestBody);
  }

  // Handle regular requests
  return makeRequest(requestApiMethod, url, headers, requestQS, requestBody);
});

/**
 * Verifies the status code of an API response
 * @param {Object} response - API response
 * @param {number} expectedSTATUS_CODES - Expected HTTP status code
 * @returns {Cypress.Chainable<Object>} API response
 */
Cypress.Commands.add('verifyStatusCode', { prevSubject: true }, (response, expectedSTATUS_CODES) => {
  const { status, body } = response;
  const errorMessage =
    status !== expectedSTATUS_CODES ? body.detail || JSON.stringify(body.errors) || body.title : undefined;
  expect(status, errorMessage).to.equal(expectedSTATUS_CODES);
  return response;
});

/**
 * Validates the response body against a JSON schema
 * @param {Object} response - API response
 * @param {Object} data - Request configuration containing responseSchema
 * @returns {Cypress.Chainable<Object>} API response
 */
Cypress.Commands.add('verifyResponseSchema', { prevSubject: true }, (response, data) => {
  const { responseSchema } = data;

  if (!responseSchema) {
    cy.log('No response schema found in data object, skipping validation');
    return cy.wrap(response);
  }

  const { body } = response;

  // Validate response body exists
  expect(body, 'Response body should not be null or undefined').to.exist;

  // Validate main object type
  expect(body, `Response should be of type ${responseSchema.type}`).to.be.an(responseSchema.type);

  // Validate required fields
  if (responseSchema.required) {
    responseSchema.required.forEach((field) => {
      expect(body, `Required field '${field}' should exist`).to.have.property(field);
    });
  }

  // Validate properties
  if (responseSchema.properties) {
    Object.entries(responseSchema.properties).forEach(([key, schema]) => {
      if (body.hasOwnProperty(key)) {
        validateProperty(body[key], schema, key);
      }
    });
  }

  cy.log('Response schema validation passed');
  return cy.wrap(response);
});

/**
 * Helper function to validate individual properties against their schema
 * @param {*} value - The value to validate
 * @param {Object} schema - The schema to validate against
 * @param {string} fieldName - The name of the field being validated
 */
function validateProperty(value, schema, fieldName) {
  // Handle nullable types
  if (Array.isArray(schema.type)) {
    if (schema.type.includes('null') && value === null) {
      return; // null is allowed
    }
    // Get the non-null type for validation
    const nonNullTypes = schema.type.filter((type) => type !== 'null');
    if (nonNullTypes.length === 1) {
      schema = { ...schema, type: nonNullTypes[0] };
    }
  }

  // Validate type
  if (schema.type && value !== null) {
    switch (schema.type) {
      case 'string':
        expect(value, `Field '${fieldName}' should be a string`).to.be.a('string');
        break;
      case 'number':
        expect(value, `Field '${fieldName}' should be a number`).to.be.a('number');
        break;
      case 'object':
        expect(value, `Field '${fieldName}' should be an object`).to.be.an('object');

        // Validate nested object properties
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([nestedKey, nestedSchema]) => {
            if (value.hasOwnProperty(nestedKey)) {
              validateProperty(value[nestedKey], nestedSchema, `${fieldName}.${nestedKey}`);
            }
          });
        }

        // Validate required fields in nested object
        if (schema.required) {
          schema.required.forEach((requiredField) => {
            expect(value, `Required field '${fieldName}.${requiredField}' should exist`).to.have.property(
              requiredField
            );
          });
        }
        break;
      case 'array':
        expect(value, `Field '${fieldName}' should be an array`).to.be.an('array');
        break;
      case 'boolean':
        expect(value, `Field '${fieldName}' should be a boolean`).to.be.a('boolean');
        break;
    }
  }

  // Validate format (basic validation for common formats)
  if (schema.format && value !== null) {
    switch (schema.format) {
      case 'date-time':
        expect(value, `Field '${fieldName}' should be a valid ISO date-time string`).to.match(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/
        );
        break;
      case 'uuid':
        expect(value, `Field '${fieldName}' should be a valid UUID`).to.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        break;
    }
  }
}

/**
 * Validates the response body against expected values
 * @param {Object} response - API response
 * @param {Object} expectedResponse - Expected response configuration
 * @param {Object} expectedResponse.responseBody - Expected response body
 * @returns {Cypress.Chainable<Object>} API response
 */
Cypress.Commands.add('validateResponseBody', { prevSubject: 'optional' }, (response, expectedResponse) => {
  const { responseBody } = expectedResponse;

  // Validate response body exists
  expect(response.body, 'Response body should not be null or undefined').to.exist;

  if (typeof responseBody !== 'object' || responseBody === null) {
    // Validate non-object response
    expect(response.body).to.equal(responseBody, `Expected response body to be ${responseBody}`);
  } else if (Object.keys(responseBody).length === 0) {
    // Validate empty response
    expect(response).to.have.property('body');
  } else {
    // Validate object response
    Object.entries(responseBody).forEach(([key, value]) => {
      expect(response.body).to.have.property(key);
      expect(response.body[key]).to.deep.equal(value, `Expected value for key ${key}: ${value} >>`);
    });
  }
  return response;
});

/**
 * Asserts deep equality between objects while ignoring specified fields
 * @param {Object} actual - Actual object
 * @param {Object} expected - Expected object
 * @param {Array<string>} fieldsToIgnore - Fields to ignore in comparison
 */
Cypress.Commands.add('assertDeepEqualIgnoringFields', (actual, expected, fieldsToIgnore) => {
  const filterFields = (obj) =>
    Object.keys(obj)
      .filter((key) => !fieldsToIgnore.includes(key))
      .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});

  expect(filterFields(actual)).to.deep.equal(filterFields(expected));
});

/**
 * Verifies that an API request returns a forbidden status
 * @param {Object} data - Request configuration
 */
Cypress.Commands.add('verifyForbiddenApiRequest', (data) => {
  setCpHeaders(data, '');
  cy.api_request(data).verifyStatusCode(STATUS_CODES.FORBIDDEN);
});

/**
 * Makes a regular API request
 * @param {string} method - HTTP method
 * @param {string} url - API endpoint URL
 * @param {Object} headers - Request headers
 * @param {Object} qs - Query string parameters
 * @param {Object} body - Request body
 * @returns {Cypress.Chainable<Object>} API response
 */
const makeRequest = (method, url, headers, qs, body) => {
  return cy.request({
    method,
    url,
    headers,
    qs,
    body,
    failOnStatusCode: false,
    timeout: REQUEST_TIMEOUT,
  });
};

/**
 * Handles form data API requests
 * @param {string} method - HTTP method
 * @param {string} url - API endpoint URL
 * @param {Object} headers - Request headers
 * @param {Object} qs - Query string parameters
 * @param {Object} body - Request body containing form data
 * @returns {Cypress.Chainable<Object>} API response
 */
const handleFormDataRequest = (method, url, headers, qs, body) => {
  const { filePath, formFile, fileName, size, contentType, documentType, fileId, lastApprovedClientId } = body.formData;

  return cy.fixture(filePath, formFile).then((image) => {
    const blob = Cypress.Blob.binaryStringToBlob(image, contentType);
    const formData = new FormData();

    // Append form data fields
    formData.append('FormFile', blob, fileName);
    formData.append('Size', size);
    formData.append('ContentType', contentType);
    formData.append('DocumentType', documentType);
    formData.append('FileId', fileId);
    if (lastApprovedClientId) {
      formData.append('UploadFileClientId', lastApprovedClientId);
    }

    return makeRequest(method, url, headers, qs, formData);
  });
};

/**
 * New: BFF XLSX multipart upload using FormData + fetch
 * Opt-in via formData.fileFieldName === 'file'
 */
const handleFormDataRequest_base64 = (method, url, headers, qs, body) => {
  const { fileFieldName, FormFile, fileName, referenceNumber } = body.formData || {};

  const filePath = FormFile.filePath;
  const contentType = FormFile.contentType;

  if (!filePath) {
    throw new Error('FormData (BFF): formData.FormFile.filePath is required');
  }

  return cy.fixture(filePath, 'base64').then((base64) => {
    const blob = Cypress.Blob.base64StringToBlob(base64, contentType);
    const formData = new FormData();
    formData.append(fileFieldName, blob, fileName);
    formData.append('fileName', fileName);
    if (referenceNumber) {
      formData.append('referenceNumber', referenceNumber);
    }

    return cy.window().then((win) =>
      win
        .fetch(url, {
          method,
          headers, // do not set Content-Type; browser sets boundary
          body: formData,
        })
        .then(async (resp) => {
          let json;
          try {
            json = await resp.json();
          } catch {
            json = {};
          }
          return { status: resp.status, body: json };
        })
    );
  });
};