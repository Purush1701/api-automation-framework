/**
 * @fileoverview Cypress configuration for staging environment.
 * This configuration extends the common configuration and sets up staging-specific
 * environment variables and endpoints.
 */

import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import commonConfig from './cypress.common.js';

dotenv.config({ path: './.env.staging' });

/**
 * Cypress configuration for staging environment
 * @type {Cypress.ConfigOptions}
 */
export default defineConfig({
  ...commonConfig,
  env: {
    ...commonConfig.env,
    /** Current environment context */
    context: 'staging',
    testTitle: '{your-org} API Automation - Staging Environment',

    /** Client Portal API Configuration */
    cpapi: '{CP_API_URL}',
    cp_apikey: process.env.CP_APIKEY,
    cp_userid: process.env.CP_USERID,

    /** Back Office Configuration */
    bo: '{BO_URL}',
    botoken: '{BO_TOKEN_URL}',
    boapi: '{BO_API_URL}',
    bo_bff_api: '{BO_BFF_API_URL}',
    boapi_clientId: process.env.BOAPI_CLIENT_ID,
    boapi_clientSecret: process.env.BOAPI_CLIENT_SECRET,
    boapi_scope: process.env.BOAPI_SCOPE,

    /** Partner API Configuration */
    partnerapi: '{PARTNER_API_URL}',
    partnertoken: '{PARTNER_TOKEN_URL}',
    partnerapi_clientId: process.env.PARTNERAPI_CLIENT_ID,
    partnerapi_clientSecret: process.env.PARTNERAPI_CLIENT_SECRET,
    partnerapi_scope: process.env.PARTNERAPI_SCOPE,

    /** BVNK Configuration */
    bvnk_secret_key: process.env.BVNK_SECRET_KEY,

    /** Platform Coin OS Back Office Configuration */
    scos_bo: '{SCOS_BO_URL}',
    scos_bo_url: '{SCOS_BO_UI_URL}',
    scos_boapi_clientId: process.env.SCOS_BOAPI_CLIENT_ID,
    scos_boapi_clientSecret: process.env.SCOS_BOAPI_CLIENT_SECRET,
    scos_boapi_scope: process.env.SCOS_BOAPI_SCOPE,

    /** MSAL Token Configuration for UI Tests (Environment-specific) */
    msal_target_audience: process.env.MSAL_TARGET_AUDIENCE,

    /** Platform Coin OS Integration-API config */
    integrationapi: '{INTEGRATION_API_URL}',
    integrationapi_token: '{INTEGRATION_TOKEN_URL}',
    integrationapi_clientId: process.env.INTEGRATIONAPI_CLIENT_ID,
    integrationapi_clientSecret: process.env.INTEGRATIONAPI_CLIENT_SECRET,
    integrationapi_scope: process.env.INTEGRATIONAPI_SCOPE,
  },
});
