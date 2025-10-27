/**
 * @fileoverview Common Cypress configuration shared across different environments.
 * This configuration sets up common environment variables, viewport settings,
 * and reporter configurations for test execution.
 */

import { defineConfig } from 'cypress';
import cypressMochawesomeReporter from 'cypress-mochawesome-reporter/plugin.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.common' });

export default defineConfig({
  env: {
    /** Back Office API credentials */
    boapi_username: process.env.BOAPI_USERNAME,
    boapi_password: process.env.BOAPI_PASSWORD,

    /** Platform Coin OS Back Office API credentials */
    scos_boapi_username: process.env.SCOS_BOAPI_USERNAME,
    scos_boapi_password: process.env.SCOS_BOAPI_PASSWORD,

    /** MSAL Token Configuration (Common) */
    msal_home_account_prefix: process.env.MSAL_HOME_ACCOUNT_PREFIX,
    msal_tenant: process.env.MSAL_TENANT,
    msal_client_id: process.env.MSAL_CLIENT_ID,

    /** Blockchain configuration */
    alchemy_api_key: process.env.ALCHEMY_API_KEY,
    crypto_private_key: process.env.CRYPTO_PRIVATE_KEY,
    chain_id: process.env.CHAIN_ID,

    /** Encryption configuration for sensitive data */
    encryption_secret_key: process.env.ENCRYPTION_SECRET_KEY,
  },
  e2e: {
    /**
     * Sets up node events for Cypress
     * @param {Cypress.PluginEvents} on - Cypress plugin events
     * @param {Cypress.PluginConfigOptions} config - Cypress configuration options
     */
    setupNodeEvents(on, config) {
      // Register Mochawesome plugin
      cypressMochawesomeReporter(on);

      // Logging start and end of run
      on('before:run', () => {
        console.log(`[STARTED] ${config.env.testTitle || '{your-org} API Automation'}`);
      });

      on('after:run', () => {
        console.log(`[COMPLETED] ${config.env.testTitle || '{your-org} API Automation'}`);
      });

      // // Register custom tasks (read removed by request)
      on('task', {
        updateIcbcExcel: async (args) => {
          const mod = await import('./cypress/support/Utility/workbook-utility.js');
          // pass config/env in case the task needs them
          return mod.updateIcbcExcel(args, config);
        },
        deleteFile: (filePath) => {
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.resolve(filePath);

          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`File deleted: ${fullPath}`);
          }
          return null;
        },
      });

      // return config;
      // Optional skip control: set env.skipFolders to a folder name, CSV, or string[].
      // Example values:
      // - null/undefined => run all specs
      // - 'IntegrationAPI' => skip all specs under cypress/e2e/IntegrationAPI
      // - 'IntegrationAPI,BO_Scos' or ['IntegrationAPI','BO_Scos'] => skip both
      const skipConfig = config?.env?.skipFolders;
      /** @type {string[]} */
      const skipList = Array.isArray(skipConfig)
        ? skipConfig
        : typeof skipConfig === 'string'
          ? skipConfig
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      if (skipList.length) {
        // Use specPattern to include only the folders we want, excluding the skip list
        const allFolders = ['BO_Agg', 'BO_Bff', 'CP_Agg', 'PartnerAPI', 'IntegrationAPI', 'BO_Scos'];
        const includeFolders = allFolders.filter((folder) => !skipList.includes(folder));

        const includeGlobs = includeFolders.flatMap((folder) => [
          `cypress/e2e/${folder}/**/*.cy.{js,jsx,ts,tsx}`,
          `cypress/e2e/${folder}/**/*.js`,
        ]);

        if (!config.e2e) config.e2e = {};
        config.e2e.specPattern = includeGlobs;
        console.log(`[CONFIG] Excluding spec folders: ${skipList.join(', ')}`);
        console.log(`[CONFIG] Including only folders: ${includeFolders.join(', ')}`);
        console.log(`[CONFIG] Spec patterns:`, config.e2e.specPattern);
        console.log(`[CONFIG] Full config.e2e:`, JSON.stringify(config.e2e, null, 2));
      }

      return config; // <- Ensure the config is returned
    },
    viewportWidth: 1920,
    viewportHeight: 1080,
    experimentalRunAllSpecs: true,
    chromeWebSecurity: false,
  },
  reporter: 'cypress-multi-reporters',
  screenshotsFolder: 'cypress/results/screenshots',
  reporterOptions: {
    reporterEnabled: 'cypress-mochawesome-reporter, mocha-junit-reporter',

    'cypress-mochawesome-reporter': {
      reportDir: 'cypress/reports/html',
      reportFilename: 'API_Automation_Test_Report',
      reportPageTitle: 'API Automation Test Report',
      reporterTitle: 'Automation Test Report',
      charts: true,
      inlineAssets: true,
      embeddedScreenshots: true,
      html: false,
      json: true,
    },

    'mocha-junit-reporter': {
      mochaFile: 'cypress/results/junit/test-results-[hash].xml',
      jenkinsMode: true,
      outputs: true,
      testCaseSwitchClassnameAndName: true,
    },
  },
});
