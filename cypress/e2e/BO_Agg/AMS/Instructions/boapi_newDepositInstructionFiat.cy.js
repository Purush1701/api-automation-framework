import { data } from '../../../../fixtures/BO_Agg/AMS/Instructions/boapi_newDepositInstructionFiat.json';
import { dateUtility, ENV_CONTEXT, STATUS_CODES, setRequestApiUrl } from '../../../../support/Utility/common-utility';
import {
  validateAuditLogResponse,
  handleTempFileUploadResponse,
  setupInstructionDocumentUpload,
  validateInstructionIdentifiers,
} from '../../../../support/Utility/instruction-utility';

let instructionId, instructionReferenceNumber, transactionId, fileKey, fileName;

describe('New fiat deposit instruction', () => {
  it('Create fiat deposit instruction - [POST] /payment-instruction', () => {
    const {
      requestBody,
      [ENV_CONTEXT]: { serviceAccountId, clientBankAccountId },
    } = data.createFiatInstructionSuccess;
    requestBody.serviceAccountId = serviceAccountId;
    requestBody.clientBankAccountId = clientBankAccountId;

    cy.api_request(data.createFiatInstructionSuccess)
      .verifyStatusCode(STATUS_CODES.OK)
      //.verifyResponseSchema(data.createFiatInstructionSuccess) //Resposne schema validation
      .validateResponseBody(data.createFiatInstructionSuccess[ENV_CONTEXT])
      .then((response) => {
        instructionId = response.body.id;
        instructionReferenceNumber = response.body.referenceNumber;
      });
  });

  context('New Deposit Instruction validation with Instruction ID', () => {
    before(() => {
      validateInstructionIdentifiers(instructionId, instructionReferenceNumber);
    });

    it('Retrieve crm services tab instructions list - [POST] /payment-instruction/filter-instructions', () => {
      data.retrieveInstructionsList.requestBody.clientId = data.retrieveInstructionsList[ENV_CONTEXT].clientId;
      cy.api_request(data.retrieveInstructionsList)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsList[ENV_CONTEXT]);
    });

    it('Retrieve instructions details - [POST] /instruction/inbox-fiat-detail', () => {
      data.retrieveInstructionsDetails.requestQS.paymentInstructionId = instructionId;
      cy.api_request(data.retrieveInstructionsDetails)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsDetails);
    });

    it('Retrieve instructions client summary - [GET] /instruction/client-summary/fiat/{instructionId}', () => {
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

    it('Retrieve instructions linked transactions list - [GET] /instruction/linked-transaction/fiat/{instructionId}', () => {
      setRequestApiUrl(data.retrieveInstructionsLinkedTransactions, '{instructionId}', instructionId);
      cy.api_request(data.retrieveInstructionsLinkedTransactions)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsUploadedDocumentsList);
    });

    it('Upload temp instructions documents - [POST] /file-storage/upload-temp', () => {
      data.uploadTempInstructionsDocuments.requestBody.formData.uploadFileClientId =
        data.uploadTempInstructionsDocuments[ENV_CONTEXT].uploadFileClientId;
      cy.api_request(data.uploadTempInstructionsDocuments)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.uploadTempInstructionsDocuments)
        .then((response) => {
          const { fileKey: tempFileKey, fileName: tempFileName } = handleTempFileUploadResponse(response);
          fileKey = tempFileKey;
          fileName = tempFileName;
        });
    });

    it('Upload save instructions documents - [POST] /uploaded-files/instruction-files/upload', () => {
      setupInstructionDocumentUpload(
        data,
        fileKey,
        fileName,
        instructionReferenceNumber,
        data.uploadInstructionsDocuments[ENV_CONTEXT].uploadFileClientId
      );
      cy.api_request(data.uploadInstructionsDocuments)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.uploadInstructionsDocuments);
    });

    it('Create linked transaction - [POST] /ams/transaction/inventory-receipt', () => {
      const { requestBody } = data.createLinkedTransaction[ENV_CONTEXT];
      requestBody.instructionReferenceNumber = instructionReferenceNumber;
      requestBody.reference = instructionReferenceNumber;
      requestBody.paidOnDate = `${dateUtility.getCurrentDate()}`;
      data.createLinkedTransaction.requestBody = requestBody;
      cy.api_request(data.createLinkedTransaction)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.createLinkedTransaction[ENV_CONTEXT])
        .then((response) => {
          transactionId = response.body.id;
        });
    });

    it('Retrieve linked transaction details - [GET] /ams/transaction/transaction-details/{id}', () => {
      setRequestApiUrl(data.retrieveLinkedTransactionDetails, '{transactionId}', transactionId);
      cy.api_request(data.retrieveLinkedTransactionDetails)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveLinkedTransactionDetails);
    });

    it('Update linked transaction status to complete - [PATCH] /ams/transaction/complete', () => {
      data.updateStatusCompleteLinkedTransaction.requestQS.id = transactionId;
      cy.api_request(data.updateStatusCompleteLinkedTransaction).verifyStatusCode(STATUS_CODES.OK);
    });

    it('Update instruction status to pending - [POST] /instruction/update-fiat-status', () => {
      data.updateStatusPendingInstruction.requestBody.id = instructionId;
      cy.api_request(data.updateStatusPendingInstruction).verifyStatusCode(STATUS_CODES.NO_CONTENT);
    });

    it('Update instruction status to complete - [POST] /instruction/update-fiat-status', () => {
      data.updateStatusCompleteInstruction.requestBody.id = instructionId;
      cy.api_request(data.updateStatusCompleteInstruction).verifyStatusCode(STATUS_CODES.NO_CONTENT);
    });

    it('Retrieve transaction Fee type - [GET] /ams/transaction/fee-type/{instructionRefNumber}', () => {
      setRequestApiUrl(data.retrieveTransactionFeeType, '{instructionRefNumber}', instructionReferenceNumber);
      cy.api_request(data.retrieveTransactionFeeType)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveTransactionFeeType);
    });

    it('Retrieve bank changer by types - [GET] /payment-instruction/bank-changer-by-types', () => {
      cy.api_request(data.retrieveBankChangerByTypes)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveBankChangerByTypes);
    });

    it('Retrieve instructions audit list - [GET] /instruction/InstructionFiatLogs/{instructionId}', () => {
      setRequestApiUrl(data.retrieveInstructionsAuditList, '{instructionId}', instructionId);
      cy.api_request(data.retrieveInstructionsAuditList)
        .verifyStatusCode(STATUS_CODES.OK)
        .validateResponseBody(data.retrieveInstructionsAuditList)
        .then((response) => {
          validateAuditLogResponse(response);
        });
    });
  });
});
