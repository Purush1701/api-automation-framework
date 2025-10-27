/* ***********************************************************
This example support/e2e.js is processed and
loaded automatically before your test files.

This is a great place to put global configuration and
behavior that modifies Cypress.

You can change the location of this file or turn off
automatically serving support files with the
'supportFile' configuration option.

You can read more here:
https://on.cypress.io/configuration
*********************************************************** */

import './Commands/commands';
import 'cypress-mochawesome-reporter/register';

// API configurations
export const API_CONFIGS = {
  CP_Agg: {
    baseUrl: 'cpapi',
  },
  BO_Agg: {
    baseUrl: 'boapi',
    tokenKey: 'access_token_bo',
    tokenGenerator: 'generate_api_token_bo',
  },
  BO_Bff: {
    baseUrl: 'bo_bff_api',
    tokenKey: 'access_token_bo',
    tokenGenerator: 'generate_api_token_bo',
  },
  PartnerAPI: {
    baseUrl: 'partnerapi',
    tokenKey: 'access_token_partner',
    tokenGenerator: 'generate_api_token_partner',
  },
  BO_Scos: {
    baseUrl: 'scos_bo',
    tokenKey: 'access_token_bo_scos',
    tokenGenerator: 'generate_api_token_scos_bo',
  },
  IntegrationAPI: {
    baseUrl: 'integrationapi',
    tokenKey: 'access_token_integration',
    tokenGenerator: 'generate_api_token_integration',
  },
};

// Helper function to set up API environment
export const setupApiEnvironment = (config) => {
  const { baseUrl, tokenKey, tokenGenerator } = config;

  // Set base URL
  Cypress.env('baseUrl', Cypress.env(baseUrl));

  // Skip token generation for CP_Agg
  if (baseUrl === 'cpapi') {
    return;
  }

  // Generate and set token if not already set
  if (!Cypress.env(tokenKey)) {
    cy[tokenGenerator]().then((token) => {
      Cypress.env(tokenKey, token);
      Cypress.env('access_token', token);
    });
  }
};

// Helper function to determine API config based on spec path
const getApiConfig = (specPath) => {
  // Handle special case for batch execution
  if (specPath.includes('__all')) {
    return API_CONFIGS.IntegrationAPI;
  }

  // Find matching API config
  const matchingApi = Object.entries(API_CONFIGS).find(([apiName]) => specPath.includes(apiName));

  if (!matchingApi) {
    throw new Error(`Invalid test file: ${specPath}`);
  }

  return matchingApi[1];
};

// Global before hook for API setup
before(() => {
  const specPath = Cypress.spec.relative;
  const apiConfig = getApiConfig(specPath);
  setupApiEnvironment(apiConfig);
});
