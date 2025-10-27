import { data } from '../../../fixtures/PartnerAPI/Bank/partner-Banks.json';
import { ENV_CONTEXT, STATUS_CODES, setRequestApiUrl } from '../../../support/Utility/common-utility';
const { clientId } = data.commonData[ENV_CONTEXT];
let bankAccountId;

describe('Bank Accounts', () => {
  it('Create Bank - [POST] /banks/create', () => {
    data.createBank.requestBody.name = `qa_bankName_+${Cypress._.random(100000)}`;
    cy.api_request(data.createBank)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.createBank)
      .then((response) => {
        bankAccountId = response.body;
      });
  });

  it('Create Bank Account - [POST] /bank-accounts', () => {
    const { requestBody } = data.createBankAccount;
    requestBody.clientId = clientId;
    requestBody.bankId = bankAccountId;
    requestBody.accountHolder = data.createBankAccount[ENV_CONTEXT].accountHolder;
    requestBody.accountNumber = Cypress._.random(10000000000).toString();
    cy.api_request(data.createBankAccount).verifyStatusCode(STATUS_CODES.CREATED);
  });

  it('Retrieve List of Bank Accounts - [GET] /bank-accounts', () => {
    data.retrieveListOfBankAccounts.requestQS.clientId = clientId;
    cy.api_request(data.retrieveListOfBankAccounts)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveListOfBankAccounts[ENV_CONTEXT]);
  });

  it('Retrieve Select List of Bank Accounts - [GET] /bank-accounts/selectlist', () => {
    data.retrieveSelectListOfBankAccounts.requestQS.clientId = clientId;
    cy.api_request(data.retrieveSelectListOfBankAccounts)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        bankAccountId = response.body[0].id;
      });
  });

  it('Retrieve Bank Account Details - [GET] /bank-accounts/{bankAccountId}', () => {
    setRequestApiUrl(data.retrieveBankAccountDetails, '{bankAccountId}', bankAccountId);
    cy.api_request(data.retrieveBankAccountDetails).verifyStatusCode(STATUS_CODES.OK);
  });

  it('Retrieve Bank by ID - [GET] /banks/{id}/list-item', () => {
    setRequestApiUrl(data.retrieveBankById, '{id}', bankAccountId);
    cy.api_request(data.retrieveBankById).verifyStatusCode(STATUS_CODES.OK);
  });

  it('Search Banks by Name & Swift Code - [GET] /banks/search', () => {
    cy.api_request(data.searchBanksByNameOrSwift).verifyStatusCode(STATUS_CODES.OK);
  });
});
