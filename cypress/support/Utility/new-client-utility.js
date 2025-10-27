/**
 * @fileoverview Utility functions for client-related operations including email generation,
 * random value selection, and string manipulation.
 */

/** Email domain for test accounts */
const EMAIL_DOMAIN = 'sample-test.com';

/** Available gender options */
const GENDER_OPTIONS = Object.freeze(['male', 'female', 'other']);

/** Characters available for alphanumeric string generation */
const ALPHANUMERIC_CHARS = Object.freeze('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');

/** Default length for generated alphanumeric strings */
const DEFAULT_STRING_LENGTH = 6;

/**
 * Generates a random email ID for testing
 * @returns {Object} Object containing random string and email
 * @returns {string} returns.randomString - Random alphanumeric string
 * @returns {string} returns.randomEmail - Random email address
 */
export const generateRandomEmailId = () => {
  const randomString = idAlphaNumeric(8);
  const randomEmail = `qa+${Cypress._.random(10000000)}@${EMAIL_DOMAIN}`;
  return {
    randomString,
    randomEmail,
  };
};

/**
 * Gets a random value from an array
 * @param {Array} array - Array to get random value from
 * @returns {*} Random value from array
 */
export const getRandomArrayValue = (array) => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

/**
 * Gets a random gender value
 * @returns {string} Random gender ('male', 'female', or 'other')
 */
export const getRandomGender = () => {
  const randomIndex = Math.floor(Math.random() * GENDER_OPTIONS.length);
  return GENDER_OPTIONS[randomIndex];
};

/**
 * Generates a random alphanumeric string
 * @param {number} length - Length of the string to generate
 * @returns {string} Random alphanumeric string
 */
export const idAlphaNumeric = (length = DEFAULT_STRING_LENGTH) => {
  let text = '';
  for (let i = 0; i < length; i++) {
    text += ALPHANUMERIC_CHARS.charAt(Math.floor(Math.random() * ALPHANUMERIC_CHARS.length));
  }
  return text;
};
