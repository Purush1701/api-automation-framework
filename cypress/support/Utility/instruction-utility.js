/**
 * @fileoverview Instruction utility functions for API testing.
 * This module provides reusable functions for instruction-related operations
 * to reduce code duplication across instruction test files.
 */

/**
 * Validates audit log response structure and field types
 * @param {Object} response - The API response containing audit logs
 * @param {string} responseBodyMessage - Custom message for response body validation
 */
export const validateAuditLogResponse = (response, responseBodyMessage = 'Response Body should not be null') => {
  // Ensure the response body is not null or undefined
  expect(response.body, responseBodyMessage).to.not.be.null;

  // Ensure the audit log array is not null or empty
  const auditLogs = response.body;
  expect(auditLogs).to.be.an('array').that.is.not.empty;

  // Define validation rules for each log field
  const fieldValidations = {
    userName: (value) => {
      expect(value, 'userName should not be null').to.not.be.null;
      if (value !== null) {
        expect(value).to.be.a('string', 'Expected userName to be a string');
      }
    },
    timeStamp: (value) => {
      expect(value).to.be.a('string', 'Expected timeStamp to be a string');
    },
    statusName: (value) => {
      expect(value).to.be.a('string', 'Expected statusName to be a string');
    },
    ruleCheckStatus: (value) => {
      if (value !== null) {
        expect(value).to.be.a('number', 'Expected ruleCheckStatus to be a number if not null');
      }
    },
    remark: (value) => {
      if (value !== null) {
        expect(value).to.be.a('string', 'Expected remark to be a string if not null');
      }
    },
  };

  // Validate each log entry using the defined rules
  auditLogs.forEach((log) => {
    Object.entries(fieldValidations).forEach(([field, validate]) => {
      expect(log).to.have.property(field);
      validate(log[field]);
    });
  });
};

/**
 * Validates audit log response structure and field types (for string-based ruleCheckStatus)
 * @param {Object} response - The API response containing audit logs
 * @param {string} responseBodyMessage - Custom message for response body validation
 */
export const validateAuditLogResponseWithStringRuleCheck = (
  response,
  responseBodyMessage = 'Response Body should not be null'
) => {
  // Ensure the response body is not null or undefined
  expect(response.body, responseBodyMessage).to.not.be.null;

  // Ensure the audit log array is not null or empty
  const auditLogs = response.body;
  expect(auditLogs).to.be.an('array').that.is.not.empty;

  // Define validation rules for each log field
  const fieldValidations = {
    userName: (value) => {
      expect(value, 'userName should not be null').to.not.be.null;
      if (value !== null) {
        expect(value).to.be.a('string', 'Expected userName to be a string');
      }
    },
    timeStamp: (value) => {
      expect(value).to.be.a('string', 'Expected timeStamp to be a string');
    },
    statusName: (value) => {
      expect(value).to.be.a('string', 'Expected statusName to be a string');
    },
    ruleCheckStatus: (value) => {
      if (value !== null) {
        expect(value).to.be.a('string', 'Expected ruleCheckStatus to be a string if not null');
      }
    },
    remark: (value) => {
      if (value !== null) {
        expect(value).to.be.a('string', 'Expected remark to be a string if not null');
      }
    },
  };

  // Validate each log entry using the defined rules
  auditLogs.forEach((log) => {
    Object.entries(fieldValidations).forEach(([field, validate]) => {
      expect(log).to.have.property(field);
      validate(log[field]);
    });
  });
};

/**
 * Handles temporary file upload and returns decoded response
 * @param {Object} response - The API response from file upload
 * @returns {Object} Decoded response with file key and name
 */
export const handleTempFileUploadResponse = (response) => {
  const decodedResponse = JSON.parse(new TextDecoder().decode(response.body));
  return {
    fileKey: decodedResponse.key,
    fileName: decodedResponse.fileName,
  };
};

/**
 * Sets up instruction document upload with standard parameters
 * @param {Object} data - The test data object
 * @param {string} fileKey - The file key from temp upload
 * @param {string} fileName - The file name from temp upload
 * @param {string} instructionReferenceNumber - The instruction reference number
 * @param {string} uploadFileClientId - The client ID for upload
 */
export const setupInstructionDocumentUpload = (
  data,
  fileKey,
  fileName,
  instructionReferenceNumber,
  uploadFileClientId
) => {
  const { requestBody } = data.uploadInstructionsDocuments;
  requestBody.fileKey = fileKey;
  requestBody.fileName = fileName;
  requestBody.instructionReferenceNumber = instructionReferenceNumber;
  requestBody.uploadFileClientId = uploadFileClientId;
};

/**
 * Standard validation for instruction ID and reference number
 * @param {string} instructionId - The instruction ID to validate
 * @param {string} instructionReferenceNumber - The instruction reference number to validate
 * @param {string} idMessage - Custom message for instruction ID validation
 * @param {string} refMessage - Custom message for reference number validation
 */
export const validateInstructionIdentifiers = (
  instructionId,
  instructionReferenceNumber,
  idMessage = 'Instruction Id is undefined, skipping all the cases in the spec file',
  refMessage = 'Instruction Reference Id is undefined'
) => {
  expect(instructionId, idMessage).to.be.ok;
  expect(instructionReferenceNumber, refMessage).to.be.ok;
};
