import { data } from '../../../fixtures/BO_Scos/Clients/scos_clients_bank_accounts.json';
import { data as env_data } from '../../../fixtures/BO_Scos/sc-environment-data.json';
import { setRequestApiUrl, ENV_CONTEXT, STATUS_CODES } from '../../../support/Utility/common-utility.js';
import { generateRandomData } from '../../../support/Utility/generateData.js';

const { clientId } = env_data[ENV_CONTEXT];
describe('Clients Authorized users', () => {
  let bankAccountId = '';
  let newBankAccountId = '';

  it('Retrieve client bank accounts - [GET] clients/{clientId}/bank-accounts', () => {
    setRequestApiUrl(data.retrieveClientBankAccounts, '{clientId}', clientId);
    cy.api_request(data.retrieveClientBankAccounts)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveClientBankAccounts)
      .then((response) => {
        bankAccountId = response.body.data[0].id;
      });
  });

  it('Retrieve client bank account details - [GET] clients/{clientId}/bank-accounts/{bankAccountId}', () => {
    const { requestApiUrl } = data.retrieveClientBankAccountDetails;
    data.retrieveClientBankAccountDetails.requestApiUrl = requestApiUrl
      .replace('{clientId}', clientId)
      .replace('{bankAccountId}', bankAccountId);
    cy.api_request(data.retrieveClientBankAccountDetails)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveClientBankAccountDetails);
  });

  it('Retrieve client bank account orders - [GET] clients/{clientId}/bank-accounts/{bankAccountId}/orders', () => {
    const { requestApiUrl } = data.retrieveClientBankAccountOrders;
    data.retrieveClientBankAccountOrders.requestApiUrl = requestApiUrl
      .replace('{clientId}', clientId)
      .replace('{bankAccountId}', bankAccountId);
    cy.api_request(data.retrieveClientBankAccountOrders)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveClientBankAccountOrders);
  });
  it('Create client bank account - [POST] clients/{clientId}/bank-accounts', () => {
    setRequestApiUrl(data.createClientBankAccount, '{clientId}', clientId);
    const { bankAccountDetails, bankAddress } = data.createClientBankAccount.requestBody;

    bankAccountDetails.beneficiary = generateRandomData().firstName;
    bankAccountDetails.iban = `${Cypress._.random(100000000000)}`;
    bankAccountDetails.bankName = generateRandomData().companyName;
    bankAccountDetails.swiftCode = generateRandomData().swiftCode;
    bankAccountDetails.alias = generateRandomData().lastName;
    bankAccountDetails.sampleOwnBankId = `${Cypress._.random(100000)}`;
    bankAccountDetails.sampleThirdPartyBankId = `${Cypress._.random(10000)}`;

    bankAddress.street = generateRandomData().address;
    bankAddress.postalCode = generateRandomData().postalCode;
    bankAddress.city = generateRandomData().city;
    bankAddress.state = generateRandomData().state;
    bankAddress.country = generateRandomData().country;

    cy.api_request(data.createClientBankAccount)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.createClientBankAccount)
      .then((response) => {
        newBankAccountId = response.body.id;
      });
  });

  it('Archive client bank account - [PUT] clients/{clientId}/bank-accounts/{bankAccountId}/archive', () => {
    const { requestApiUrl } = data.archiveClientBankAccount;
    data.archiveClientBankAccount.requestApiUrl = requestApiUrl
      .replace('{clientId}', clientId)
      .replace('{bankAccountId}', newBankAccountId);
    cy.api_request(data.archiveClientBankAccount)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.archiveClientBankAccount);
  });

  it.skip('Verify client bank account - [PUT] clients/{clientId}/bank-accounts/{bankAccountId}/verify', () => {
    // Skipped: Endpoint will be covered as part of onboarding script.
    const { requestApiUrl } = data.verifyClientBankAccount;
    data.verifyClientBankAccount.requestApiUrl = requestApiUrl
      .replace('{clientId}', clientId)
      .replace('{bankAccountId}', newBankAccountId);
    cy.api_request(data.verifyClientBankAccount)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.verifyClientBankAccount);
  });

  it.skip('Decline client bank account - [PUT] clients/{clientId}/bank-accounts/{bankAccountId}/decline', () => {
    // Skipped: Endpoint will be covered as part of onboarding script.
    const { requestApiUrl } = data.declineClientBankAccount;
    data.declineClientBankAccount.requestApiUrl = requestApiUrl
      .replace('{clientId}', clientId)
      .replace('{bankAccountId}', newBankAccountId);
    cy.api_request(data.declineClientBankAccount)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.declineClientBankAccount);
  });
});
