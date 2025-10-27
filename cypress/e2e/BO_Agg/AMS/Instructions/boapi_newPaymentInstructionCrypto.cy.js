import { data } from '../../../../fixtures/BO_Agg/AMS/Instructions/boapi_newPaymentInstructionCrypto.json';
import { ENV_CONTEXT, STATUS_CODES, setRequestApiUrl } from '../../../../support/Utility/common-utility';
import {
  handleTempFileUploadResponse,
  validateInstructionIdentifiers,
} from '../../../../support/Utility/instruction-utility';

let instructionId, instructionReferenceNumber, transactionId, fileKey, fileName;

describe.skip('New crypto payment instruction', () => {
  it('Create crypto payment instruction - [POST] /crypto-payment-instruction', () => {
    data.createCryptoInstructionSuccess.requestBody.serviceAccountId =
      data.createCryptoInstructionSuccess[ENV_CONTEXT].serviceAccountId;
    cy.api_request(data.createCryptoInstructionSuccess)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.createCryptoInstructionSuccess)
      .then((response) => {
        instructionId = response.body.id;
        instructionReferenceNumber = response.body.referenceNumber;
      });
  });

  context('New Crypto Payment Instruction validation with Instruction ID', () => {
    before(() => {
      validateInstructionIdentifiers(instructionId, instructionReferenceNumber);
    });

    it('Retrieve crm services tab instructions list - [POST] /payment-instruction/filter-instructions', () => {
      data.retrieveInstructionsList.requestBody.clientId = data.retrieveInstructionsList[ENV_CONTEXT].clientId;
      cy.api_request(data.retrieveInstructionsList)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsList[ENV_CONTEXT]);
    });

    it('Retrieve instructions details - [POST] /instruction/inbox-crypto-detail', () => {
      data.retrieveInstructionsDetails.requestQS.cryptoPaymentInstructionId = instructionId;
      cy.api_request(data.retrieveInstructionsDetails)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsDetails);
    });

    it('Retrieve instructions client summary - [GET] /instruction/client-summary/crypto/{instructionId}', () => {
      setRequestApiUrl(data.retrieveInstructionsClientSummary, '{instructionId}', instructionId);
      cy.api_request(data.retrieveInstructionsClientSummary)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsClientSummary);
    });

    it('Retrieve instructions uploaded document list - [GET] /uploaded-files/instructions/{instructionId}/files', () => {
      setRequestApiUrl(data.retrieveInstructionsUploadedDocumentsList, '{instructionId}', instructionId);
      cy.api_request(data.retrieveInstructionsUploadedDocumentsList)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsUploadedDocumentsList);
    });

    it('Retrieve instructions linked transactions list - [GET] /instruction/linked-transaction/crypto/{instructionId}', () => {
      setRequestApiUrl(data.retrieveInstructionsLinkedTransactions, '{instructionId}', instructionId);
      cy.api_request(data.retrieveInstructionsLinkedTransactions)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsLinkedTransactions);
    });

    it('Retrieve instructions audit list - [GET] /instruction/InstructionCryptoLogs/{instructionId}', () => {
      setRequestApiUrl(data.retrieveInstructionsAuditList, '{instructionId}', instructionId);
      cy.api_request(data.retrieveInstructionsAuditList)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsAuditList);
    });

    it('Upload temp instructions documents - [POST] /file-storage/upload-temp', () => {
      data.uploadTempInstructionsDocuments.requestBody.formData.uploadFileClientId =
        data.uploadTempInstructionsDocuments[ENV_CONTEXT].uploadFileClientId;
      cy.api_request(data.uploadTempInstructionsDocuments)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.uploadTempInstructionsDocuments)
        .then((response) => {
          let decodedResponse = JSON.parse(new TextDecoder().decode(response.body));
          fileKey = decodedResponse.key;
          fileName = decodedResponse.fileName;
        });
    });

    it('Upload save instructions documents - [POST] /uploaded-files/instruction-files/upload', () => {
      const { requestBody } = data.uploadInstructionsDocuments[ENV_CONTEXT];
      requestBody.fileKey = fileKey;
      requestBody.fileName = fileName;
      requestBody.instructionReferenceNumber = instructionReferenceNumber;
      data.uploadInstructionsDocuments.requestBody = requestBody;
      cy.api_request(data.uploadInstructionsDocuments)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.uploadInstructionsDocuments[ENV_CONTEXT]);
    });

    it('Retrieve fireblock Tx - [POST] /fireblocks/transactions-by-filter', () => {
      cy.api_request(data.retrieveFireblockTx)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveFireblockTx)
        .then((response) => {
          transactionId = response.body.items[0].id;
        });
    });

    it('Retrieve instructions linked fireblock transactions list - [GET] /fireblocks/transaction/{transactionId}', () => {
      if (transactionId) {
        setRequestApiUrl(data.retrieveInstructionsLinkedFireblockTransactions, '{transactionId}', transactionId);
        cy.api_request(data.retrieveInstructionsLinkedFireblockTransactions)
          .verifyStatusCode(STATUS_CODES.OK)
          .validateResponseBody(data.retrieveInstructionsLinkedFireblockTransactions);
      } else {
        throw new Error('Transaction ID is undefined or null');
      }
    });
  });
});
