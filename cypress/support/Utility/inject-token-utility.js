/**
 * @fileoverview MSAL Token Injection Utility
 * Provides authentication bypass functionality by injecting MSAL tokens directly into sessionStorage
 * This allows tests to bypass Azure AD SSO UI authentication flow
 */

/**
 * Injects MSAL authentication tokens into sessionStorage
 * Bypasses Azure AD SSO UI by directly setting up authentication state
 *
 * @function injectMSALToken
 * @description Sets up MSAL tokens in sessionStorage and suppresses Azure AD errors
 * @returns {void}
 */
export const injectMSALToken = () => {
  // Get configuration from Cypress environment
  const BASE_URL = Cypress.env('scos_bo_url');
  const HOME_ACCOUNT_PREFIX = Cypress.env('msal_home_account_prefix');
  const TENANT = Cypress.env('msal_tenant');
  const CLIENT_ID = Cypress.env('msal_client_id');
  const TARGET_AUDIENCE = Cypress.env('msal_target_audience');
  const ACCESS_TOKEN_JWT = Cypress.env('access_token');

  const EXPIRES_ON = `${Math.floor(Date.now() / 1000) + 3600}`; // 1 hour from now
  const CACHED_AT = `${Math.floor(Date.now() / 1000)}`;

  const accountKey = `${HOME_ACCOUNT_PREFIX}-login.microsoftonline.com-${TENANT}`;
  const accessTokenKey = `${HOME_ACCOUNT_PREFIX}-login.microsoftonline.com-accesstoken-${CLIENT_ID}-${TENANT}-${TARGET_AUDIENCE}--`;

  // Suppress Azure AD authentication errors
  Cypress.on('uncaught:exception', (err) => {
    if (err?.message.includes('AADSTS') || err?.message.includes('invalid_request') || err?.message.includes('token')) {
      return false;
    }
    return true;
  });

  // Inject MSAL tokens into sessionStorage before app initializes
  cy.visit(BASE_URL, {
    failOnStatusCode: false,
    onBeforeLoad(win) {
      // MSAL Account Information
      win.sessionStorage.setItem(
        accountKey,
        JSON.stringify({
          authorityType: 'MSSTS',
          homeAccountId: HOME_ACCOUNT_PREFIX,
          environment: 'login.microsoftonline.com',
          realm: TENANT,
          localAccountId: HOME_ACCOUNT_PREFIX.split('.')[0],
          username: 'sample.user@test.com',
          name: 'Test User',
          tenantProfiles: [
            {
              tenantId: TENANT,
              localAccountId: HOME_ACCOUNT_PREFIX.split('.')[0],
              name: 'Test User',
              isHomeTenant: true,
            },
          ],
        })
      );

      // MSAL Access Token
      win.sessionStorage.setItem(
        accessTokenKey,
        JSON.stringify({
          homeAccountId: HOME_ACCOUNT_PREFIX,
          credentialType: 'AccessToken',
          secret: ACCESS_TOKEN_JWT,
          cachedAt: CACHED_AT,
          expiresOn: EXPIRES_ON,
          environment: 'login.microsoftonline.com',
          clientId: CLIENT_ID,
          realm: TENANT,
          target: TARGET_AUDIENCE,
          tokenType: 'Bearer',
        })
      );

      // MSAL Cache Keys
      win.sessionStorage.setItem('msal.account.keys', JSON.stringify([accountKey]));
      win.sessionStorage.setItem(
        `msal.token.keys.${CLIENT_ID}`,
        JSON.stringify({
          idToken: [],
          accessToken: [accessTokenKey],
          refreshToken: [],
        })
      );
      win.sessionStorage.setItem('msal.version', '4.13.2');
    },
  });

  cy.log('✅ MSAL tokens injected successfully');
};
