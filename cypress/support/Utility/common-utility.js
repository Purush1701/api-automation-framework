/**
 * @fileoverview Common utility functions for API testing.
 * This module provides utility functions for date operations, HTTP status codes,
 * API request handling, and document type management.
 */

/** Current environment value from Cypress config */
export const ENV_CONTEXT = Cypress.env('context');

/** HTTP Status Codes used in API testing */
export const STATUS_CODES = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVICE_UNAVAILABLE: 503,
});

/** Document types used in the application */
export const DOCUMENT_TYPES = Object.freeze({
  BANK_STATEMENT: 'Bank Statement',
  BIRTH_CERTIFICATE: 'Birth Certificate',
  CERTIFICATE_OF_INSURANCE: 'Certificate of Insurance',
  CERTIFICATE_OF_NATURALISATION: 'Certificate of Naturalisation',
  DRIVING_LICENCE: 'Driving Licence',
  GOVERNMENT_LETTER: 'Government Letter',
  HOME_OFFICE_LETTER: 'Home Office Letter',
  IMMIGRATION_STATUS_DOCUMENT: 'Immigration Status Document',
  MARRIAGE_CERTIFICATE: 'Marriage Certificate',
  NATIONAL_IDENTITY_CARD: 'National Identity Card',
  NATIONAL_INSURANCE_CARD: 'National Insurance Card',
  PASSPORT: 'Passport',
  PAYSLIP: 'Payslip',
  RESIDENCE_PERMIT: 'Residence Permit',
  TAX_ID: 'Tax ID',
  UTILITY_BILL_ELECTRIC: 'Utility Bill (Electric)',
  UTILITY_BILL_GAS: 'Utility Bill (Gas)',
  UTILITY_BILL_OTHER: 'Utility Bill (Other)',
  WORK_PERMIT: 'Work Permit',
  W8_BEN: 'W8-BEN',
  CERTIFICATE_OF_LOSS_OF_NATIONALITY: 'Certificate of Loss of Nationality of the US',
  ARTICLES_OF_ASSOCIATION: 'Articles of Association',
  CERTIFICATE_OF_INCORPORATION: 'Certificate of Incorporation',
  REGISTER_OF_MEMBERS: 'Register of Members',
  REGISTER_OF_DIRECTORS: 'Register of Directors',
  ANNUAL_RETURNS: 'Annual Returns',
  FINANCIAL_STATEMENTS: 'Financial Statements',
  UTILITY_BILL_WATER: 'Utility Bill (Water)',
  UTILITY_BILL_LANDLINE_PHONE: 'Utility Bill (Landline Phone)',
  UTILITY_BILL_INTERNET: 'Utility Bill (Internet)',
  CREDIT_CARD_STATEMENT: 'Credit Card Statement',
  TAX_RECEIPT: 'Tax Receipt',
  OTHER: 'Other',
  TRANSACTION: 'Transaction',
  UTILITY_BILL_MOBILE: 'Utility Bill (Mobile)',
  DEPOSIT_SLIP: 'Deposit Slip',
  PROOF_OF_ID_BENEFICIAL_OWNER: 'Proof of Identification of Beneficial Owner',
  PROOF_OF_ID_DIRECTOR: 'Proof of Identification of Director',
  PROOF_OF_ADDRESS_DIRECTOR: 'Proof of Address of Director',
  INVOICE: 'Invoice',
  SERVICE_AGREEMENT: 'Service Agreement',
  CERTIFICATE_OF_INCUMBENCY: 'Certificate of Incumbency',
  PROOF_OF_SOURCE_OF_FUNDS: 'Proof of Source of Funds',
  LICENSE_FOR_REGULATED_ACTIVITIES: 'Copy of License for conducting regulated activities',
  PROOF_OF_ADDRESS_BENEFICIAL_OWNER: 'Proof of Address of Beneficial Owner',
  WITHDRAWAL_COMPLETION_SLIP: 'Withdrawal Completion Slip',
  PAYMENT_COMPLETION_SLIP: 'Payment Completion Slip',
  BUSINESS_REGISTRATION: 'Business Registration',
});

/**
 * Utility functions for date operations
 * @type {Object}
 */
export const dateUtility = Object.freeze({
  /**
   * Gets current time in UTC format
   * @returns {string} ISO string of current time
   */
  getCurrentTimeUTC: () => {
    return new Date().toISOString();
  },

  /**
   * Gets current date in YYYY-MM-DD format
   * @returns {string} Current date string
   */
  getCurrentDate: () => {
    return new Date().toLocaleDateString('en-CA');
  },

  /**
   * Gets yesterday's date in YYYY-MM-DD format
   * @returns {string} Yesterday's date string
   */
  getYesterdayDate: () => {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    return today.toLocaleDateString('en-CA');
  },

  /**
   * Gets current year
   * @returns {number} Current year
   */
  getCurrentYear: () => {
    const currentTime = new Date();
    return currentTime.getFullYear();
  },

  /**
   * Gets previous month number (1-12)
   * @returns {number} Previous month number
   */
  getPreviousMonth: () => {
    const today = new Date();
    today.setMonth(today.getMonth() - 1);
    return today.getMonth() + 1;
  },

  /**
   * Generates a random date within a specified year range
   * @param {number} fromYear - Start year (default: 2000)
   * @param {number} toYear - End year (default: 2015)
   * @returns {string} Random date in ISO format
   */
  getRandomDateInYearRange: (fromYear = 2000, toYear = 2015) => {
    const startDate = new Date(fromYear, 0, 1);
    const endDate = new Date(toYear + 1, 0, 1);
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate - startDate));
    return randomDate.toISOString();
  },

  /**
   * Generates a random date of birth between 1960 and 2000
   * @returns {string} Random DOB in ISO format
   */
  getRandomDOB: () => {
    const year = Math.floor(Math.random() * (2000 - 1960)) + 1960;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const date = new Date(Date.UTC(year, month, day, 0, 0, 0));
    return date.toISOString().split('.')[0] + 'Z';
  },

  /**
   * Gets date from one week ago
   * @returns {string} Date from one week ago in ISO format
   */
  getWeekBeforeDate: () => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return today.toISOString();
  },

  /**
   * Gets current date in DD-MM-YYYY format
   * @returns {string} Current date in DD-MM-YYYY format
   */
  getTodayDate_DDMMYYYY: () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  },
});

/**
 * Updates the API URL in the request data
 * @param {Object} data - Request data object
 * @param {string} oldValue - Value to replace in URL
 * @param {string} newValue - New value to use in URL
 */
export const setRequestApiUrl = (data, oldValue, newValue) => {
  data.requestApiUrl = data.requestApiUrl.replace(oldValue, newValue);
};

/**
 * Sets common headers for client portal API requests
 * @param {Object} data - Request data object
 * @param {string} serviceEntityId - Service entity ID
 */
export const setCpHeaders = (data, serviceEntityId) => {
  data.requestHeader['Service-Entity-Id'] = serviceEntityId;
  data.requestHeader['X-Api-Key'] = Cypress.env('cp_apikey');
  data.requestHeader['Test-User-Id'] = Cypress.env('cp_userid');
};

export const setSCHeaders = (data, clientId) => {
  data.requestHeader['X-Delegated-Client'] = clientId;
};

/**
 * Generates a random number with specified number of digits
 * @param {number} digits - Number of digits in the random number
 * @returns {number} Random number
 */
export const getRandomNumber = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Cypress._.random(min, max);
};

/**
 * Encodes a file to base64 string
 * @param {string} filePath - Path to the file
 * @returns {Cypress.Chainable<string>} Base64 encoded string
 */
export const encodeFileToBase64 = (filePath) => {
  return cy.readFile(filePath, 'base64').then((base64String) => {
    return base64String;
  });
};

/**
 * Uploads a temporary document for testing
 * @param {string} type - Document type from DOCUMENT_TYPES enum
 * @param {string} serviceEntityId - Service entity ID
 * @returns {Cypress.Chainable<Object>} Upload response
 */
export const uploadTempDocuments = (type, serviceEntityId) => {
  const documentMappings = Object.freeze({
    [DOCUMENT_TYPES.BANK_STATEMENT]: 1,
    [DOCUMENT_TYPES.BIRTH_CERTIFICATE]: 2,
    [DOCUMENT_TYPES.CERTIFICATE_OF_INSURANCE]: 3,
    [DOCUMENT_TYPES.CERTIFICATE_OF_NATURALISATION]: 4,
    [DOCUMENT_TYPES.DRIVING_LICENCE]: 5,
    [DOCUMENT_TYPES.GOVERNMENT_LETTER]: 6,
    [DOCUMENT_TYPES.HOME_OFFICE_LETTER]: 7,
    [DOCUMENT_TYPES.IMMIGRATION_STATUS_DOCUMENT]: 8,
    [DOCUMENT_TYPES.MARRIAGE_CERTIFICATE]: 9,
    [DOCUMENT_TYPES.NATIONAL_IDENTITY_CARD]: 10,
    [DOCUMENT_TYPES.NATIONAL_INSURANCE_CARD]: 11,
    [DOCUMENT_TYPES.PASSPORT]: 12,
    [DOCUMENT_TYPES.PAYSLIP]: 13,
    [DOCUMENT_TYPES.RESIDENCE_PERMIT]: 14,
    [DOCUMENT_TYPES.TAX_ID]: 15,
    [DOCUMENT_TYPES.UTILITY_BILL_ELECTRIC]: 16,
    [DOCUMENT_TYPES.UTILITY_BILL_GAS]: 17,
    [DOCUMENT_TYPES.UTILITY_BILL_OTHER]: 18,
    [DOCUMENT_TYPES.WORK_PERMIT]: 19,
    [DOCUMENT_TYPES.W8_BEN]: 20,
    [DOCUMENT_TYPES.CERTIFICATE_OF_LOSS_OF_NATIONALITY]: 21,
    [DOCUMENT_TYPES.ARTICLES_OF_ASSOCIATION]: 22,
    [DOCUMENT_TYPES.CERTIFICATE_OF_INCORPORATION]: 23,
    [DOCUMENT_TYPES.REGISTER_OF_MEMBERS]: 24,
    [DOCUMENT_TYPES.REGISTER_OF_DIRECTORS]: 25,
    [DOCUMENT_TYPES.ANNUAL_RETURNS]: 26,
    [DOCUMENT_TYPES.FINANCIAL_STATEMENTS]: 27,
    [DOCUMENT_TYPES.UTILITY_BILL_WATER]: 28,
    [DOCUMENT_TYPES.UTILITY_BILL_LANDLINE_PHONE]: 29,
    [DOCUMENT_TYPES.UTILITY_BILL_INTERNET]: 30,
    [DOCUMENT_TYPES.CREDIT_CARD_STATEMENT]: 31,
    [DOCUMENT_TYPES.TAX_RECEIPT]: 32,
    [DOCUMENT_TYPES.OTHER]: 33,
    [DOCUMENT_TYPES.TRANSACTION]: 34,
    [DOCUMENT_TYPES.UTILITY_BILL_MOBILE]: 35,
    [DOCUMENT_TYPES.DEPOSIT_SLIP]: 36,
    [DOCUMENT_TYPES.PROOF_OF_ID_BENEFICIAL_OWNER]: 37,
    [DOCUMENT_TYPES.PROOF_OF_ID_DIRECTOR]: 38,
    [DOCUMENT_TYPES.PROOF_OF_ADDRESS_DIRECTOR]: 39,
    [DOCUMENT_TYPES.INVOICE]: 40,
    [DOCUMENT_TYPES.SERVICE_AGREEMENT]: 41,
    [DOCUMENT_TYPES.CERTIFICATE_OF_INCUMBENCY]: 42,
    [DOCUMENT_TYPES.PROOF_OF_SOURCE_OF_FUNDS]: 43,
    [DOCUMENT_TYPES.LICENSE_FOR_REGULATED_ACTIVITIES]: 44,
    [DOCUMENT_TYPES.PROOF_OF_ADDRESS_BENEFICIAL_OWNER]: 45,
    [DOCUMENT_TYPES.WITHDRAWAL_COMPLETION_SLIP]: 46,
    [DOCUMENT_TYPES.PAYMENT_COMPLETION_SLIP]: 47,
    [DOCUMENT_TYPES.BUSINESS_REGISTRATION]: 48,
    [DOCUMENT_TYPES.OTHER]: 'Other',
  });

  const availableFiles = Object.freeze([
    { filePath: 'images/upload_PDF_Sample.pdf', contentType: 'application/pdf' },
    { filePath: 'images/upload_PNG_Sample.png', contentType: 'image/png' },
    { filePath: 'images/upload_JPG_Sample.jpg', contentType: 'image/jpeg' },
  ]);

  const getRandomFile = () => {
    const randomIndex = Math.floor(Math.random() * availableFiles.length);
    return availableFiles[randomIndex];
  };

  const documentType = documentMappings[type];
  if (!documentType) {
    throw new Error(`Document type '${type}' is not recognized.`);
  }

  const selectedFile = getRandomFile();

  const requestData = {
    requestHeader: {},
    requestApiMethod: 'POST',
    requestApiUrl: 'file-storage/upload-temp',
    requestBody: {
      formData: {
        filePath: selectedFile.filePath,
        fileName: selectedFile.filePath.split('/').pop(),
        formFile: 'binary',
        size: 215212,
        contentType: selectedFile.contentType,
        documentType,
        fileId: 0,
      },
    },
  };

  if (serviceEntityId) {
    requestData.requestHeader['Service-Entity-Id'] = serviceEntityId;
    requestData.requestHeader['X-Api-Key'] = Cypress.env('cp_apikey');
    requestData.requestHeader['Test-User-Id'] = Cypress.env('cp_userid');
  }

  return cy
    .api_request(requestData)
    .verifyStatusCode(STATUS_CODES.OK)
    .then((response) => {
      const decodedResponse = JSON.parse(new TextDecoder().decode(response.body));
      return decodedResponse;
    });
};
