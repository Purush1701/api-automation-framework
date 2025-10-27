import { data } from '../../../fixtures/IntegrationAPI/BankAccounts/integration_bank_accounts.json';
import { data as env_data } from '../../../fixtures/IntegrationAPI/integration-environment-data.json';
import { ENV_CONTEXT, STATUS_CODES, setSCHeaders } from '../../../support/Utility/common-utility';

const { clientId } = env_data[ENV_CONTEXT];
describe('Bank Accounts', () => {
  it('Retrieve Bank Accounts - [GET] /bank-accounts', () => {
    setSCHeaders(data.retrieveBankAccounts, clientId);
    cy.api_request(data.retrieveBankAccounts)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveBankAccounts);
  });
});
