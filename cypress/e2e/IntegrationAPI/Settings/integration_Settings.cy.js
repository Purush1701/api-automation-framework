import { data } from '../../../fixtures/IntegrationAPI/Settings/integration_Settings.json';
import { data as env_data } from '../../../fixtures/IntegrationAPI/integration-environment-data.json';
import { ENV_CONTEXT, STATUS_CODES, setSCHeaders } from '../../../support/Utility/common-utility';

const { clientId } = env_data[ENV_CONTEXT];
describe('Settings', () => {
  it('Retrieve client Details - [GET] /settings/me', () => {
    setSCHeaders(data.retrieveClientDetails, clientId);
    cy.api_request(data.retrieveClientDetails)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveClientDetails);
  });
});
