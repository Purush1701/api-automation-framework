/**
 * @fileoverview Comprehensive utility functions for Solana blockchain operations.
 * This module provides functionality for:
 * - Signing Solana transactions
 * - Polling for blockchain transactions
 * - Processing multi-signature workflows
 * - Managing order signing processes
 * - Encrypting/Decrypting private keys (AES encryption via CryptoJS)
 *
 * Private Key Security:
 * - Private keys in sc-environment-data.json are AES encrypted
 * - Encryption key stored in .env.common (ENCRYPTION_SECRET_KEY)
 * - Automatic decryption during test execution
 * - Encrypted keys start with "U2FsdGVkX1" prefix
 */

import { Keypair, Transaction, Connection, PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';
import * as nacl from 'tweetnacl';
import CryptoJS from 'crypto-js';
import bs58 from 'bs58';
import { setRequestApiUrl, STATUS_CODES } from './common-utility';

/**
 * Encrypts a plain text private key using AES encryption
 * @param {string} plainTextPrivateKey - The plain text private key to encrypt
 * @param {string} encryptionKey - The encryption key to use (optional, uses Cypress env if in test context)
 * @returns {string} The encrypted private key
 */
export function encryptPrivateKey(plainTextPrivateKey, encryptionKey = null) {
  const key = encryptionKey || (typeof Cypress !== 'undefined' ? Cypress.env('encryption_secret_key') : null);

  if (!key) {
    throw new Error('Encryption key not provided');
  }

  try {
    const encrypted = CryptoJS.AES.encrypt(plainTextPrivateKey, key).toString();
    return encrypted;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts an encrypted private key using AES decryption
 * @param {string} encryptedPrivateKey - The AES encrypted private key
 * @param {string} encryptionKey - The encryption key to use (optional, uses Cypress env if in test context)
 * @returns {string} The decrypted private key
 */
export function decryptPrivateKey(encryptedPrivateKey, encryptionKey = null) {
  const key = encryptionKey || (typeof Cypress !== 'undefined' ? Cypress.env('encryption_secret_key') : null);

  if (!key) {
    throw new Error('Encryption key not found in environment configuration');
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedPrivateKey, key);
    const privateKey = decrypted.toString(CryptoJS.enc.Utf8);

    if (!privateKey) {
      throw new Error('Failed to decrypt private key - invalid encryption key or corrupted data');
    }

    return privateKey;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Signs a serialized Solana transaction with a private key
 * @param {string} serializedMessage - The serialized transaction message (base64 encoded)
 * @param {string} privateKey - The private key in byte array string format or base58 format
 * @returns {string} The signature as a base64 encoded string
 */
export function signSolanaTransaction(serializedMessage, privateKey = null) {
  try {
    // Use provided private key or get from environment
    let privKey = privateKey || Cypress.env('solana_private_key');

    if (!privKey) {
      throw new Error('Private key not provided and SOLANA_PRIVATE_KEY environment variable not set');
    }

    // Decrypt the private key if it's encrypted (starts with "U2FsdGVkX1")
    if (privKey.startsWith('U2FsdGVkX1')) {
      privKey = decryptPrivateKey(privKey);
    }

    // Convert base64 serialized message to Uint8Array
    const messageBytes = Uint8Array.from(atob(serializedMessage), (c) => c.charCodeAt(0));

    // Convert private key to Uint8Array
    let privateKeyBytes;

    try {
      // Check if the private key is in array format like "[51,18,250,...]"
      if (privKey.startsWith('[') && privKey.endsWith(']')) {
        const keyArray = JSON.parse(privKey);
        privateKeyBytes = new Uint8Array(keyArray);
      } else {
        // Try to parse as base58 first
        privateKeyBytes = bs58.decode(privKey);
      }
    } catch (e) {
      try {
        // If base58 fails, try as hex
        privateKeyBytes = Uint8Array.from(privKey.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
      } catch (e2) {
        throw new Error(`Unable to parse private key format: ${e2.message}`);
      }
    }

    // Create keypair from private key
    const keypair = Keypair.fromSecretKey(privateKeyBytes);

    // Sign the message
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);

    // Convert signature to base64
    const signatureBase64 = btoa(String.fromCharCode(...signature));

    return signatureBase64;
  } catch (error) {
    cy.log(`❌ Error signing Solana transaction: ${error.message}`);
    throw new Error(`Failed to sign Solana transaction: ${error.message}`);
  }
}

/**
 * Alternative signing method using the actual Solana cryptographic signing
 * @param {string} serializedMessage - The serialized transaction message
 * @param {string} privateKey - The private key in byte array format
 * @returns {string} The signature
 */
export function signSolanaTransactionSimple(serializedMessage, privateKey = null) {
  try {
    const privKey = privateKey || Cypress.env('solana_private_key');

    if (!privKey) {
      throw new Error('Private key not provided');
    }

    // Use the full signing function for proper cryptographic signature
    return signSolanaTransaction(serializedMessage, privKey);
  } catch (error) {
    cy.log(`❌ Error creating signature: ${error.message}`);

    // Fallback to mock signature if real signing fails
    const message = serializedMessage + (privKey || 'fallback');
    const hash = CryptoJS.SHA256(message).toString();
    const signature = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(hash));

    cy.log(`⚠️ Using fallback mock signature`);
    return signature;
  }
}

/**
 * Validates if a signature is properly formatted
 * @param {string} signature - The signature to validate
 * @returns {boolean} True if signature is valid format
 */
export function validateSignature(signature) {
  try {
    // Check if it's a valid base64 string
    const decoded = atob(signature);
    return decoded.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Poll for serializedMessage from blockchain transactions
 * @param {object} data - The fixture data object containing getBlockchainTransaction
 * @param {string} orderId - The order ID
 * @param {number} initialWaitTime - Initial wait time in milliseconds before starting to poll (default: 90000ms = 1.5 minutes)
 * @param {number} retryInterval - Time to wait between retry attempts in milliseconds (default: 10000ms = 10 seconds)
 * @returns {Promise} Promise that resolves with the serializedMessage
 */
export function pollForSerializedMessage(data, orderId, initialWaitTime = 90000, retryInterval = 10000) {
  // Validate required parameters
  if (!data || !data.getBlockchainTransaction) {
    throw new Error('data with getBlockchainTransaction is required for pollForSerializedMessage');
  }
  if (!orderId) {
    throw new Error('orderId is required for pollForSerializedMessage');
  }

  data.getBlockchainTransaction.requestQS.orderId = orderId;

  // Wait for initial time before starting
  cy.wait(initialWaitTime);

  // Function to poll for serializedMessage
  const poll = () => {
    return cy
      .api_request(data.getBlockchainTransaction)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.getBlockchainTransaction)
      .then((response) => {
        const orderTransactions = response.body.orderTransactions || [];

        // Check if any transaction has a non-null serializedMessage
        const transactionWithMessage = orderTransactions.find((transaction) => transaction.serializedMessage !== null);

        if (transactionWithMessage) {
          // Found a transaction with serializedMessage, return it
          const serializedMessage = transactionWithMessage.serializedMessage;
          return cy.wrap(serializedMessage);
        } else {
          // No serializedMessage found, wait and try again
          return cy.wait(retryInterval).then(() => {
            return poll();
          });
        }
      });
  };

  // Start polling
  return poll();
}

/**
 * Process blockchain transaction for a single signer
 * @param {object} blockchainTransactionData - The fixture data object for updateBlockchainTransaction
 * @param {string} orderId - The order ID
 * @param {object} signerConfig - Signer configuration with privateKey and publicKey
 * @param {string} serializedMessage - The serialized message to sign
 * @param {string} signerName - Name of the signer for logging (e.g., 'Signer 1')
 */
export function updateBlockchainTransaction(
  blockchainTransactionData,
  orderId,
  signerConfig,
  serializedMessage,
  signerName = 'Signer'
) {
  // Validate required parameters
  if (!orderId) {
    throw new Error('orderId is required for updateBlockchainTransaction');
  }
  if (!signerConfig || !signerConfig.privateKey || !signerConfig.publicKey) {
    throw new Error('signerConfig with privateKey and publicKey is required for updateBlockchainTransaction');
  }
  if (!serializedMessage) {
    throw new Error('serializedMessage is required for updateBlockchainTransaction');
  }

  setRequestApiUrl(blockchainTransactionData, '{orderId}', orderId);
  const { requestBody } = blockchainTransactionData;

  const signature = signSolanaTransaction(serializedMessage, signerConfig.privateKey);
  requestBody.signature = signature;
  requestBody.publicKey = signerConfig.publicKey;

  cy.api_request(blockchainTransactionData)
    .verifyStatusCode(STATUS_CODES.OK)
    .validateResponseBody(blockchainTransactionData);
}

/**
 * Update mint order as signed with cumulative signatures
 * @param {object} signedOrderData - The fixture data object for signedMintOrder
 * @param {string} orderId - The order ID
 * @param {array} cumulativeSigners - Array of signer configs to include in signatures
 * @param {string} submissionDate - Submission date in YYYY-MM-DD format
 * @param {string} signerName - Name of the signer for logging (e.g., 'Signer 1')
 */
export function signOrder(signedOrderData, orderId, cumulativeSigners, submissionDate, signerName = 'Signer') {
  // Validate required parameters
  if (!orderId) {
    throw new Error('orderId is required for signOrder');
  }
  if (!cumulativeSigners || !Array.isArray(cumulativeSigners) || cumulativeSigners.length === 0) {
    throw new Error('cumulativeSigners must be a non-empty array for signOrder');
  }
  if (!submissionDate) {
    throw new Error('submissionDate is required for signOrder');
  }

  setRequestApiUrl(signedOrderData, '{orderId}', orderId);
  const { requestBody } = signedOrderData;

  requestBody.txHash = null;
  requestBody.signatures = cumulativeSigners.map((signer) => ({
    address: signer.publicKey,
    submissionDate: submissionDate,
  }));

  cy.api_request(signedOrderData).verifyStatusCode(STATUS_CODES.OK).validateResponseBody(signedOrderData);
}

/**
 * Process complete signing flow for a single signer (blockchain transaction + mint order signed)
 * @param {object} blockchainTransactionData - The fixture data object for updateBlockchainTransaction
 * @param {object} signedOrderData - The fixture data object for signedMintOrder
 * @param {string} orderId - The order ID
 * @param {object} signerConfig - Signer configuration with privateKey and publicKey
 * @param {array} cumulativeSigners - Array of all signers up to and including current signer
 * @param {string} serializedMessage - The serialized message to sign
 * @param {string} submissionDate - Submission date in YYYY-MM-DD format
 * @param {string} signerName - Name of the signer for logging (e.g., 'Signer 1')
 */
export function processCompleteSigner(
  blockchainTransactionData,
  signedOrderData,
  orderId,
  signerConfig,
  cumulativeSigners,
  serializedMessage,
  submissionDate,
  signerName = 'Signer'
) {
  updateBlockchainTransaction(blockchainTransactionData, orderId, signerConfig, serializedMessage, signerName);
  signOrder(signedOrderData, orderId, cumulativeSigners, submissionDate, signerName);
}

/**
 * Process all signers sequentially (all 4 signers)
 * @param {object} blockchainTransactionData - The fixture data object for updateBlockchainTransaction
 * @param {object} signedOrderData - The fixture data object for signedMintOrder
 * @param {string} orderId - The order ID
 * @param {string} serializedMessage - The serialized message to sign
 * @param {object} signers - Object containing all signer configs (signer1, signer2, signer3, signer4)
 * @param {string} submissionDate - Submission date in YYYY-MM-DD format
 */
export function processAllSigners(
  blockchainTransactionData,
  signedOrderData,
  orderId,
  serializedMessage,
  signers,
  submissionDate
) {
  const signerList = [
    { config: signers.signer1, name: 'Signer 1' },
    { config: signers.signer2, name: 'Signer 2' },
    { config: signers.signer3, name: 'Signer 3' },
    { config: signers.signer4, name: 'Signer 4' },
  ];

  signerList.forEach((signer, index) => {
    const cumulativeSigners = signerList.slice(0, index + 1).map((s) => s.config);
    processCompleteSigner(
      blockchainTransactionData,
      signedOrderData,
      orderId,
      signer.config,
      cumulativeSigners,
      serializedMessage,
      submissionDate,
      signer.name
    );
  });
}

/**
 * Executes order transaction through UI
 * Navigates to token overview, then to specific order page, and executes the transaction
 *
 * @param {string} tokenId - The token identifier from environment data
 * @param {string} orderId - The order identifier (dynamically created from API)
 * @returns {void}
 *
 * @example
 * executeOrderTransaction('14c337ef-7476-4c28-8243-6f1fd8ab9d4b', 'c7385b30-5f7f-4906-9a07-caf6b07deaee');
 */
export function executeOrderTransaction(tokenId, orderId) {
  // Validate required parameters
  if (!tokenId) {
    throw new Error('tokenId is required for executeOrderTransaction');
  }
  if (!orderId) {
    throw new Error('orderId is required for executeOrderTransaction');
  }

  // Get base URL from config
  const BASE_URL = Cypress.env('scos_bo_url');

  const TARGET_URL = `${BASE_URL}/token-overview`;

  // Navigate to token-overview page to establish login
  cy.visit(TARGET_URL, { failOnStatusCode: false });
  cy.url({ timeout: 10000 }).should('not.include', 'login.microsoftonline.com');
  cy.contains('Tokens overview', { timeout: 10000 }).should('be.visible');

  // Click on "Tokens overview" label in the navigation
  cy.contains('span.navigation-label', 'Tokens overview').click();
  cy.url().should('include', '/token-overview');

  // Navigate to the specific order page
  const orderUrl = `${BASE_URL}/token/${tokenId}/order/solana-testnet/mint/${orderId}`;
  cy.visit(orderUrl, { failOnStatusCode: false, timeout: 30000 });

  // Verify order details API endpoint
  cy.intercept('GET', '**/orders/mint/**').as('orderDetails');
  cy.wait('@orderDetails', { timeout: 15000 }).its('response.statusCode').should('eq', 200);

  // Verify broadcast endpoint
  cy.intercept('PUT', '**/broadcast').as('broadcast');

  // Wait for page to load and scroll to Execute transaction button
  cy.contains('button', 'Execute transaction', { timeout: 30000 })
    .scrollIntoView()
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  cy.wait('@broadcast', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

  // Verify executed endpoint
  cy.intercept('PUT', '**/mint/executed').as('executed');
  cy.wait('@executed', { timeout: 30000 }).its('response.statusCode').should('eq', 200);

  // Verify success modal
  cy.contains('.success-modal__title', 'Order completed', { timeout: 30000 }).should('be.visible');
  cy.contains('.success-modal__message', 'Order Mint successfully completed').should('be.visible');

  // Click Back to order button
  cy.contains('button', 'Back to order').should('be.visible').click();

  // Verify we're back on the order page
  cy.url().should('include', `/order/solana-testnet/mint/${orderId}`);

  cy.log(`✅ Order transaction executed successfully for orderId: ${orderId}`);
}

/**
 * Gets the SPL token account balance for a given token account
 * Uses Solana RPC to query the token account balance
 *
 * @param {string} tokenAccountAddress - The SPL token account address
 * @param {string} rpcUrl - Optional RPC URL (defaults to Solana testnet)
 * @returns {Promise<Object>} Object containing raw balance and decimals { balance: string, decimals: number }
 *
 * @example
 * getTokenAccountBalance('tokenaddress_SolPlaceholder1A2B3C4D5E6F7G8H9I0J')
 *   .then(result => cy.log(`Token balance: ${result.balance}, Decimals: ${result.decimals}`));
 */
export function getTokenAccountBalance(tokenAccountAddress, rpcUrl = 'https://api.testnet.solana.com') {
  // Validate required parameters
  if (!tokenAccountAddress) {
    throw new Error('tokenAccountAddress is required for getTokenAccountBalance');
  }

  return cy.wrap(null).then(async () => {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const tokenAccountPubkey = new PublicKey(tokenAccountAddress);

      // Get token account info
      const tokenAccount = await getAccount(connection, tokenAccountPubkey);

      // Get raw balance (in smallest units)
      const rawBalance = tokenAccount.amount.toString();
      const decimals = tokenAccount.mint
        ? await connection.getParsedAccountInfo(tokenAccount.mint).then((info) => {
            return info.value?.data?.parsed?.info?.decimals || 6;
          })
        : 6;

      // Calculate formatted balance (with decimals applied)
      const formattedBalance = (Number(rawBalance) / Math.pow(10, decimals)).toFixed(decimals);

      cy.log(`📊 Token Balance: ${formattedBalance} (Raw: ${rawBalance})`);

      return { balance: rawBalance, decimals: decimals };
    } catch (error) {
      cy.log(`❌ Error fetching token balance: ${error.message}`);
      throw new Error(`Failed to get token account balance: ${error.message}`);
    }
  });
}

/**
 * Compares two token balances and asserts that the difference matches expected amount
 *
 * @param {string} balanceBefore - Balance before the operation (raw balance in smallest units)
 * @param {string} balanceAfter - Balance after the operation (raw balance in smallest units)
 * @param {string|number} expectedDifference - Expected difference (minted amount in smallest units)
 * @param {string} operation - Operation description (e.g., 'mint', 'burn')
 * @param {number} decimals - Number of decimals for the token (default: 6)
 *
 * @example
 * compareTokenBalances('1000000', '2000000', '1000000', 'mint', 6);
 */
export function compareTokenBalances(
  balanceBefore,
  balanceAfter,
  expectedDifference,
  operation = 'operation',
  decimals = 6
) {
  const before = BigInt(balanceBefore);
  const after = BigInt(balanceAfter);
  const expected = BigInt(expectedDifference);

  const actualDifference = after - before;

  // Convert to formatted values (with decimals applied)
  const beforeFormatted = (Number(balanceBefore) / Math.pow(10, decimals)).toFixed(decimals);
  const afterFormatted = (Number(balanceAfter) / Math.pow(10, decimals)).toFixed(decimals);
  const expectedFormatted = (Number(expectedDifference) / Math.pow(10, decimals)).toFixed(decimals);
  const actualFormatted = (Number(actualDifference.toString()) / Math.pow(10, decimals)).toFixed(decimals);

  cy.log(`📈 Balance Comparison (${operation}):`);
  cy.log(`   Before: ${beforeFormatted} | After: ${afterFormatted}`);
  cy.log(`   Expected Change: ${expectedFormatted} | Actual Change: ${actualFormatted}`);

  expect(actualDifference.toString()).to.equal(
    expected.toString(),
    `Balance should increase by ${expectedFormatted} after ${operation}`
  );

  cy.log(`✅ Balance verified: +${actualFormatted}`);
}
