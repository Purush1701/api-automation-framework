import { data as instructionData } from '../../../fixtures/BO_Agg/AMS/Instructions/boapi_newDepositInstructionFiat.json';
import { data } from '../../../fixtures/BO_Bff/Finance/boapi_bankingReconciliationDepositInstruction.json';
import { ENV_CONTEXT, STATUS_CODES, setRequestApiUrl } from '../../../support/Utility/common-utility.js';
import { setupApiEnvironment, API_CONFIGS } from '../../../support/e2e.js';

const filePath = 'cypress/fixtures/images/Icbc_template.xlsx';
const MAX_ATTEMPTS_CLOSED_POLL = 10;
const MAX_RETRIES_CONFIRM_MATCH = 18;
const CONFIRM_POLL_INTERVAL_MS = 10000;

const parseBodyIfNeeded = (body) =>
  body instanceof ArrayBuffer
    ? JSON.parse(new TextDecoder().decode(body))
    : typeof body === 'string'
    ? JSON.parse(body)
    : body;

let instructionId, referenceNumber, BeneficiaryAcc, BeneficiaryName, batchId, newTxId, importId;

describe('Banking Reconciliation Flow', () => {
  before(() => {
    setupApiEnvironment(API_CONFIGS.BO_Agg);

    const requestData = {
      ...instructionData.createFiatInstructionSuccess,
      requestBody: {
        ...instructionData.createFiatInstructionSuccess.requestBody,
        serviceAccountId: instructionData.createFiatInstructionSuccess[ENV_CONTEXT].serviceAccountId,
        clientBankAccountId: instructionData.createFiatInstructionSuccess[ENV_CONTEXT].clientBankAccountId,
      },
    };
    cy.api_request(requestData)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        instructionId = response.body.id;
        referenceNumber = response.body.referenceNumber;
      });
  });

  context('New Deposit Instruction validation with Instruction ID', () => {
    before(() => {
      expect(instructionId, 'Instruction Id is undefined').to.be.ok;
    });

    it('Retrieve crm services tab instructions list - [POST] /payment-instruction/filter-instructions', () => {
      instructionData.retrieveInstructionsList.requestBody.clientId =
        instructionData.retrieveInstructionsList[ENV_CONTEXT].clientId;
      cy.api_request(instructionData.retrieveInstructionsList).verifyStatusCode(STATUS_CODES.OK);
    });

    it('Retrieve instructions details - [POST] /instruction/inbox-fiat-detail', () => {
      instructionData.retrieveInstructionsDetails.requestQS.paymentInstructionId = instructionId;
      cy.api_request(instructionData.retrieveInstructionsDetails)
        .verifyStatusCode(STATUS_CODES.OK)
        .then((response) => {
          const body = response.body;
          BeneficiaryName = body.accountHolder;
          BeneficiaryAcc = body.bankAccountNumber;
        });
    });

    it('Retrieve instructions client summary - [GET] /instruction/client-summary/fiat/{instructionId}', () => {
      setRequestApiUrl(instructionData.retrieveInstructionsClientSummary, '{instructionId}', instructionId);
      cy.api_request(instructionData.retrieveInstructionsClientSummary).verifyStatusCode(STATUS_CODES.OK);
    });
  });

  // Switch to BFF once and run all BFF endpoints in this block
  context('BFF: Import and confirm reconciliation', () => {
    before(() => {
      setupApiEnvironment(API_CONFIGS.BO_Bff);
    });

    it('Update ICBC Excel template and import reconciliation - [POST] /bank-transactions', () => {
      cy.task('updateIcbcExcel', {
        filePath,
        referenceNumber,
        BeneficiaryAcc,
        BeneficiaryName,
      }).then((taskResult) => {
        expect(String(taskResult?.after?.F9), 'F9 should equal referenceNumber').to.eq(String(referenceNumber));
        expect(String(taskResult?.after?.K9), 'K9 should equal BeneficiaryAcc').to.eq(String(BeneficiaryAcc));
        expect(String(taskResult?.after?.L9), 'L9 should equal BeneficiaryName').to.eq(String(BeneficiaryName));

        const { requestBody } = data.importFileValidation;
        requestBody.formData.referenceNumber = referenceNumber;

        cy.api_request(data.importFileValidation)
          .verifyStatusCode(STATUS_CODES.OK)
          .then(({ body }) => {
            const json = parseBodyIfNeeded(body);
            batchId = json.batchId;
            expect(Number(json.successListings), 'successListings should be 1').to.eq(1);
            expect(Number(json.failedListings), 'failedListings should be 0').to.eq(0);
            expect(Number(json.totalRows), 'totalRows should be 1').to.eq(1);
          });
      });
    });

    it('Confirm importing bank transactions - [PATCH] /bank-transactions/{batchId}', () => {
      setRequestApiUrl(data.importBankTransaction, '{batchId}', batchId);
      cy.api_request(data.importBankTransaction).verifyStatusCode(STATUS_CODES.OK);
    });

    it('Retrieve imported bank transactions - [GET] /bank-transactions/uploaded/list', () => {
      cy.api_request(data.retrieveImportedBankTransaction)
        .verifyStatusCode(STATUS_CODES.OK)
        .then(({ body }) => {
          const uploadedRecords = Array.isArray(body?.data) ? body.data : [];
          const matchedUploadedRecord =
            uploadedRecords.find((record) => record.bankReference === referenceNumber) ||
            uploadedRecords.find((record) => String(record.memo || '').includes(referenceNumber));

          expect(matchedUploadedRecord, `Row with reference ${referenceNumber} should exist`).to.be.ok;
          importId = matchedUploadedRecord.id;
          expect(importId, 'importId should be present').to.be.ok;
        });
    });

    it('Import uploaded bank transaction to banking reconciliation - [POST] /bank-transactions/import', () => {
      data.importToReconciliationPage.requestBody.ids = [importId];
      cy.api_request(data.importToReconciliationPage).verifyStatusCode(STATUS_CODES.OK);
    });

    it('Verify Bank Transaction is initiated in Banking Reconciliation Page - [GET] /bank-transactions/import?_filter=status=in=(matched,matching)', () => {
      cy.api_request(data.retrieveReconcileInitiatedRecords)
        .verifyStatusCode(STATUS_CODES.OK)
        .then((response) => {
          const initiatedRecords = response.body.data;
          const firstRow = initiatedRecords[0];
          expect(firstRow.id, 'First record id should match importId').to.eq(importId);
          expect(firstRow.referenceNumber, 'First record referenceNumber should match').to.eq(referenceNumber);
        });
    });

    it('Confirm reconciliation when matched - [PATCH] /bank-transactions/confirm', () => {
      const maxRetries = MAX_RETRIES_CONFIRM_MATCH;
      const intervalMs = CONFIRM_POLL_INTERVAL_MS;
      let attempts = 0;

      function pollAndConfirm() {
        cy.api_request(data.retrieveReconcileInitiatedRecords)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((response) => {
            const initiatedRecords = response.body.data;
            const expectedResult = 'full-match';
            const matched = initiatedRecords.find(
              (t) => t.id === importId && t.referenceNumber === referenceNumber
            );
            const currentStatus = matched?.reconcileResultStatus;

            if (matched && currentStatus === expectedResult) {
              data.confirmReconciliation.requestBody.ids = [importId];
              cy.api_request(data.confirmReconciliation)
                .verifyStatusCode(STATUS_CODES.OK)
                .then(() => cy.log(`Reconciliation confirmed for importId: ${importId}`));
            } else if (attempts < maxRetries) {
              attempts++;
              cy.wait(intervalMs).then(pollAndConfirm);
            } else {
              const lastStatus = matched?.reconcileResultStatus || matched?.status || 'unknown';
              throw new Error(
                `Import ${importId} did not reach full-match within ${maxRetries} attempts. Last status: ${lastStatus}`
              );
            }
          });
      }
      pollAndConfirm();
    });

    it('Verify Bank Transaction is moved to Closed tab in Banking Reconciliation Page - [GET] /bank-transactions/imported/list?_filter=status=in=(completed)', () => {
      const maxAttempts = MAX_ATTEMPTS_CLOSED_POLL;
      const intervalMs = 2000;
      let attempts = 0;
      let lastSeen;

      function pollClosed() {
        cy.api_request(data.retrieveReconcileClosedRecords)
          .verifyStatusCode(STATUS_CODES.OK)
          .then(({ body }) => {
            const closedRecords = Array.isArray(body?.data) ? body.data : [];

            const matchedClosedRecord =
              closedRecords.find((record) => record.id === importId) ||
              closedRecords.find((record) => record.referenceNumber === referenceNumber) ||
              closedRecords.find((record) => String(record.memo || '').includes(referenceNumber));

            if (matchedClosedRecord) {
              lastSeen = {
                id: matchedClosedRecord.id,
                instructionStatus: matchedClosedRecord.instructionStatus,
                reconcileResultStatus: matchedClosedRecord.reconcileResultStatus,
              };

              if (
                matchedClosedRecord.reconcileResultStatus === 'full-match' &&
                matchedClosedRecord.instructionStatus === 'pending'
              ) {
                expect(matchedClosedRecord.id, 'id should match importId').to.eq(importId);
                expect(matchedClosedRecord.referenceNumber, 'referenceNumber should match').to.eq(referenceNumber);
                expect(matchedClosedRecord.reconcileResultStatus, 'reconcileResultStatus').to.eq('full-match');
                expect(matchedClosedRecord.instructionStatus, 'instructionStatus').to.eq('pending');
                return;
              }
            }

            if (attempts < maxAttempts) {
              attempts++;
              cy.wait(intervalMs).then(pollClosed);
            } else {
              throw new Error(
                `Closed record not ready for id=${importId}, ref=${referenceNumber}. Last seen: ${JSON.stringify(
                  lastSeen
                )}`
              );
            }
          });
      }

      pollClosed();
    });
  });

  // Switch back to BO once and continue BO endpoints
  context('BO: Linked transaction and status updates', () => {
    before(() => {
      setupApiEnvironment(API_CONFIGS.BO_Agg);
    });

    it('Validate instruction status and reference - [POST] /instruction/inbox-fiat-detail', () => {
      instructionData.retrieveInstructionsDetails.requestQS.paymentInstructionId = instructionId;

      cy.api_request(instructionData.retrieveInstructionsDetails)
        .verifyStatusCode(STATUS_CODES.OK)
        .then(({ body }) => {
          expect(body.status, 'status should be 2 (Pending)').to.eq(2);
          expect(body.referenceNumber, 'referenceNumber should match created instruction').to.eq(referenceNumber);
        });
    });

    it('Retrieve instructions linked transactions id - [GET] /instruction/linked-transaction/fiat/{instructionId}', () => {
      setRequestApiUrl(instructionData.retrieveInstructionsLinkedTransactions, '{instructionId}', instructionId);

      cy.api_request(instructionData.retrieveInstructionsLinkedTransactions)
        .verifyStatusCode(STATUS_CODES.OK)
        .then(({ body }) => {
          const linkedTransactions =
            Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];

          expect(linkedTransactions.length, 'linked transactions list should not be empty').to.be.greaterThan(0);

          const matchedTransaction = linkedTransactions.find((tx) => tx?.transactionId);
          expect(matchedTransaction, 'linked transaction row not found').to.be.ok;

          newTxId = String(matchedTransaction.transactionId).trim();
          cy.log(`LinkedTx from list: ${newTxId}`);
          expect(newTxId, 'Transaction ID must be present').to.have.length.greaterThan(0);
        });
    });

    it('Retrieve linked transaction details - [GET] /ams/transaction/transaction-details/{id}', () => {
      expect(newTxId, 'Transaction ID must be set before fetching details').to.exist;
      setRequestApiUrl(instructionData.retrieveLinkedTransactionDetails, '{transactionId}', newTxId);
      cy.api_request(instructionData.retrieveLinkedTransactionDetails).verifyStatusCode(STATUS_CODES.OK);
    });

    it('Update linked transaction status to complete - [PATCH] /ams/transaction/complete', () => {
      expect(newTxId, 'Transaction ID must be set before completing').to.exist;
      instructionData.updateStatusCompleteLinkedTransaction.requestQS.id = newTxId;
      cy.api_request(instructionData.updateStatusCompleteLinkedTransaction).verifyStatusCode(STATUS_CODES.OK);
    });

    it('Update instruction status to complete - [POST] /instruction/update-fiat-status', () => {
      instructionData.updateStatusCompleteInstruction.requestBody.id = instructionId;
      cy.api_request(instructionData.updateStatusCompleteInstruction).verifyStatusCode(STATUS_CODES.NO_CONTENT);
    });
  });

  // BFF validation after BO updates
  context('BFF: Validate Closed tab (Completed)', () => {
    before(() => {
      setupApiEnvironment(API_CONFIGS.BO_Bff);
    });

    it('Verify Bank Transaction status updated- [GET] /bank-transactions/imported/list?_filter=status=in=(completed)', () => {
      cy.api_request(data.retrieveReconcileClosedRecords)
        .verifyStatusCode(STATUS_CODES.OK)
        .then(({ body }) => {
          const closedRecords = Array.isArray(body?.data) ? body.data : [];
          const matchedClosedRecord = closedRecords.find(
            (record) => record.id === importId && record.referenceNumber === referenceNumber
          );

          expect(matchedClosedRecord, `Closed record for ${referenceNumber} should exist`).to.be.ok;
          expect(matchedClosedRecord.instructionStatus, 'instructionStatus should be completed').to.eq('completed');
          expect(matchedClosedRecord.reconcileResultStatus, 'reconcileResultStatus should be full-match').to.eq('full-match');
        });
    });
  });
});
