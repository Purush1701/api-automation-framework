import { data } from '../../../fixtures/CP_Agg/AssetTransfer/cpapi_transfer-in.json';
import { data as env_data } from '../../../fixtures/CP_Agg/cp-environment-data.json';
import {
  ENV_CONTEXT,
  STATUS_CODES,
  setRequestApiUrl,
  setCpHeaders,
  DOCUMENT_TYPES,
  uploadTempDocuments,
} from '../../../support/Utility/common-utility';
const { serviceEntityId, fiatAssetMasterId, ownBankAccountId, fiatAssetAccountId, thirdPartyBankAccountId } =
  env_data[ENV_CONTEXT];
let sourceBankAccountId, destinationAssetAccountId, _newReferenceNumber;

describe('Asset Transfer - Transfer-In Instruction', () => {
  it('Retrieve asset transfer bank accounts select list - [GET] asset-transfer/transfer-in-fiat/bank-accounts-select-list', () => {
    setCpHeaders(data.retrieveBankAccountSelectList, serviceEntityId);
    cy.api_request(data.retrieveBankAccountSelectList)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        expect(response.body).to.not.be.empty;
        sourceBankAccountId = response.body[0].id;
      });
  });

  it('Retrieve asset transfer select accounts list - [GET] asset-transfer/accounts-select-list', () => {
    setCpHeaders(data.retrieveSelectAccountsList, serviceEntityId);
    const { requestQS } = data.retrieveSelectAccountsList;
    requestQS.assetMasterId = fiatAssetMasterId;

    cy.api_request(data.retrieveSelectAccountsList)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        expect(response.body).to.not.be.empty;
        destinationAssetAccountId = response.body[0].id;
      });
  });

  it('Create fiat transfer in - [POST] asset-transfer/transfer-in-fiat', () => {
    setCpHeaders(data.createTransferInFiat, serviceEntityId);
    const { requestBody } = data.createTransferInFiat;
    requestBody.sourceBankAccountId = sourceBankAccountId;
    requestBody.destinationAssetAccountId = fiatAssetAccountId;

    uploadTempDocuments(DOCUMENT_TYPES.OTHER, serviceEntityId).then((decodedResponse) => {
      requestBody.attachments[0].key = decodedResponse.key;
      requestBody.attachments[0].userId = decodedResponse.userId;
    });

    cy.api_request(data.createTransferInFiat)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        _newReferenceNumber = response.body.referenceNumber;
        //will enhance this script in future to validate created instruction in BO API
      });
  });

  context('New Transfer-In Instruction validation with Reference Number', () => {
    before(() => {
      expect(_newReferenceNumber, 'Reference Number is undefined, skipping all the cases in the spec file').to.be.ok;
    });
    it('Add additional document to the fiat transfer in instruction- [POST] activities/instruction-files/add', () => {
      setCpHeaders(data.addAdditionalDocument, serviceEntityId);
      const { requestBody } = data.addAdditionalDocument;

      requestBody.instructionReferenceNumber = _newReferenceNumber;
      uploadTempDocuments(DOCUMENT_TYPES.OTHER, serviceEntityId).then((decodedResponse) => {
        requestBody.fileDtos[0].key = decodedResponse.key;
        requestBody.fileDtos[0].userId = decodedResponse.userId;
        cy.api_request(data.addAdditionalDocument).verifyStatusCode(STATUS_CODES.OK);
      });
    });

    it('Retrieve asset transfer-in is-first bank account - [GET] asset-transfer/transfer-in-fiat/{bankAccountId}/is-first', () => {
      setCpHeaders(data.retrieveIsFirstBankAccount, serviceEntityId);
      setRequestApiUrl(data.retrieveIsFirstBankAccount, '{bankAccountId}', thirdPartyBankAccountId);
      cy.api_request(data.retrieveIsFirstBankAccount).verifyStatusCode(STATUS_CODES.OK);
    });

    context('Forbidden Validation - 403', () => {
      it('Should not Create fiat transfer in if serviceEntityId is not provided - [POST] asset-transfer/transfer-in-fiat', () => {
        cy.verifyForbiddenApiRequest(data.createTransferInFiat);
      });

      it('Should not retrieve asset transfer-in bank account if serviceEntityId is not provided - [GET] asset-transfer/transfer-in-fiat/{bankAccountId}/is-first', () => {
        cy.verifyForbiddenApiRequest(data.retrieveIsFirstBankAccount);
      });
    });
  });
});
