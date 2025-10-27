import { data as depositData } from '../../fixtures/BO_Agg/AMS/Instructions/boapi_newDepositInstructionFiat.json';
import { data as env_data } from '../../fixtures/IntegrationAPI/integration-environment-data.json';
import { dateUtility, ENV_CONTEXT, STATUS_CODES } from './common-utility';
import { generateRandomData } from './generateData';
import { API_CONFIGS } from '../e2e.js';

const { serviceAccountId, clientBankAccountId } = env_data[ENV_CONTEXT];

/**
 * Creates and completes a deposit instruction via BO API for use in mint order tests.
 * This function performs the complete deposit workflow:
 * 1. Creates a fiat deposit instruction
 * 2. Sets instruction status to pending
 * 3. Creates a linked transaction
 * 4. Sets linked transaction status to complete
 * 5. Sets instruction status to complete
 *
 * @param {number} [amount] - The deposit amount. If not provided, a random amount is generated.
 * @param {string} [serviceAccId] - Optional override for serviceAccountId.
 * @param {string} [clientBankAccId] - Optional override for clientBankAccountId.
 * @returns {Cypress.Chainable<{referenceNumber: string, amount: number, instructionId: string}>}
 */
export const createAndCompleteDepositInstruction = (
  amount = generateRandomData().amount,
  serviceAccId = serviceAccountId,
  clientBankAccId = clientBankAccountId
) => {
  let instructionId, referenceNumber, txId;

  // Save current environment state to restore later
  const originalBaseUrl = Cypress.env('baseUrl');
  const originalAccessToken = Cypress.env('access_token');

  // Configure API environment for BO_Agg
  const { baseUrl, tokenKey, tokenGenerator } = API_CONFIGS.BO_Agg;
  Cypress.env('baseUrl', Cypress.env(baseUrl));

  // Always generate a fresh BO token to ensure it's valid
  return cy[tokenGenerator]()
    .then((token) => {
      Cypress.env(tokenKey, token);
      Cypress.env('access_token', token);
      return token;
    })
    .then(() => {
      // Step 1: Create deposit instruction
      const createInstruction = JSON.parse(JSON.stringify(depositData.createFiatInstructionSuccess));
      const { requestBody } = createInstruction;

      requestBody.serviceAccountId = serviceAccId;
      requestBody.clientBankAccountId = clientBankAccId;
      requestBody.amount = amount;

      return cy.api_request(createInstruction);
    })
    .then((response) => {
      // Validate create instruction response
      expect(response.status, 'Create deposit instruction should succeed').to.eq(STATUS_CODES.OK);

      // Store response data for subsequent steps
      instructionId = response.body.id;
      referenceNumber = response.body.referenceNumber;

      // Step 2: Set instruction status to pending
      const updatePending = JSON.parse(JSON.stringify(depositData.updateStatusPendingInstruction));
      updatePending.requestBody.id = instructionId;

      return cy.api_request(updatePending);
    })
    .then((response) => {
      // Validate pending status update response
      expect(response.status, 'Update to pending should succeed').to.eq(STATUS_CODES.NO_CONTENT);

      // Step 3: Create linked transaction
      const createLinkedTx = JSON.parse(JSON.stringify(depositData.createLinkedTransaction));
      const { requestBody } = createLinkedTx[ENV_CONTEXT];

      requestBody.instructionReferenceNumber = referenceNumber;
      requestBody.reference = referenceNumber;
      requestBody.paidOnDate = dateUtility.getCurrentDate();
      requestBody.quantity = amount;
      createLinkedTx.requestBody = requestBody;

      return cy.api_request(createLinkedTx);
    })
    .then((response) => {
      // Validate create linked transaction response
      expect(response.status, 'Create linked transaction should succeed').to.eq(STATUS_CODES.OK);

      txId = response.body.id;

      // Step 4: Set linked transaction status to complete
      const updateCompleteTx = JSON.parse(JSON.stringify(depositData.updateStatusCompleteLinkedTransaction));
      updateCompleteTx.requestQS.id = txId;

      return cy.api_request(updateCompleteTx);
    })
    .then((response) => {
      // Validate complete transaction status update response
      expect(response.status, 'Update transaction to complete should succeed').to.eq(STATUS_CODES.OK);

      // Step 5: Set instruction status to complete
      const updateComplete = JSON.parse(JSON.stringify(depositData.updateStatusCompleteInstruction));
      updateComplete.requestBody.id = instructionId;

      return cy.api_request(updateComplete);
    })
    .then((response) => {
      // Validate final instruction completion response
      expect(response.status, 'Update instruction to complete should succeed').to.eq(STATUS_CODES.NO_CONTENT);

      // Restore original environment state
      Cypress.env('baseUrl', originalBaseUrl);
      Cypress.env('access_token', originalAccessToken);

      // Return the completed deposit data
      return cy.wrap({
        referenceNumber,
        amount,
        instructionId,
      });
    });
};
