import { data } from '../../../fixtures/PartnerAPI/Bank/partner-3rdPartyBankAccount.json';
import {
  ENV_CONTEXT,
  STATUS_CODES,
  setRequestApiUrl,
  encodeFileToBase64,
} from '../../../support/Utility/common-utility';
const { clientId, bankAccountId } = data.commonData[ENV_CONTEXT];
const filePath = 'cypress/fixtures/images/upload_PDF_Sample.pdf';

describe('3rd-party Bank Accounts', () => {
  let encodedFileBase64;
  before(() => {
    return encodeFileToBase64(filePath).then((base64String) => {
      encodedFileBase64 = base64String;
    });
  });

  it('Retrieve List of 3rd-party Bank Accounts - [GET] /3rd-party-bank-accounts', () => {
    data.retrieveThirdPartyBankAccountsList.requestQS.clientId = clientId;
    cy.api_request(data.retrieveThirdPartyBankAccountsList).verifyStatusCode(STATUS_CODES.OK);
  });

  it('Create an Individual 3rd-party Bank Account - [POST] /3rd-party-bank-accounts/individual', () => {
    const { requestBody } = data.createIndividualThirdPartyBankAccount;
    requestBody.clientId = clientId;
    requestBody.bankId = bankAccountId;
    requestBody.accountNumber = Cypress._.random(100000000).toString();
    requestBody.bankAccountHolderDetails.firstName = `QA_${Cypress._.random(1000)}`;
    requestBody.bankAccountHolderDetails.identityProof.base64 = encodedFileBase64;
    requestBody.bankAccountHolderDetails.residentialAddressProof.base64 = encodedFileBase64;
    cy.api_request(data.createIndividualThirdPartyBankAccount).verifyStatusCode(STATUS_CODES.CREATED);
  });

  it('Create a Business 3rd-party Bank Account - [POST] /3rd-party-bank-accounts/business', () => {
    const { requestBody } = data.createBusinessThirdPartyBankAccount;
    requestBody.clientId = clientId;
    requestBody.bankId = bankAccountId;
    requestBody.accountNumber = Cypress._.random(10000000000).toString();
    requestBody.bankAccountHolderDetails.registrationDocumentProof.base64 = encodedFileBase64;
    requestBody.bankAccountHolderDetails.registeredAddressProof.base64 = encodedFileBase64;
    cy.api_request(data.createBusinessThirdPartyBankAccount).verifyStatusCode(STATUS_CODES.CREATED);
  });

  it('Retrieve Select List of 3rd-party Bank Accounts - [GET] /3rd-party-bank-accounts/selectlist', () => {
    data.retrieveSelectListOfThirdPartyBankAccounts.requestQS.clientId = clientId;
    cy.api_request(data.retrieveSelectListOfThirdPartyBankAccounts).verifyStatusCode(STATUS_CODES.OK);
  });

  it('Retrieve Details of a Specific 3rd-party Bank Account - [GET] /3rd-party-bank-accounts/{bankAccountId}', () => {
    setRequestApiUrl(data.retrieveThirdPartyBankAccountDetails, '{bankAccountId}', bankAccountId);
    cy.api_request(data.retrieveThirdPartyBankAccountDetails).verifyStatusCode(STATUS_CODES.OK);
  });
});
