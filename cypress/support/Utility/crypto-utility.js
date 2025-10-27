/**
 * @fileoverview Utility functions for cryptocurrency operations using Alchemy SDK.
 * This module provides functionality for sending ETH transactions on the Sepolia network.
 */

const { Alchemy, Network, Wallet, Utils } = require('alchemy-sdk');

/** Gas limit for ETH transactions */
const GAS_LIMIT = '21000';

/** Maximum priority fee per gas in gwei */
const MAX_PRIORITY_FEE_PER_GAS = '5';

/** Maximum fee per gas in gwei */
const MAX_FEE_PER_GAS = '20';

/** Transaction type for EIP-1559 transactions */
const TRANSACTION_TYPE = 2;

/**
 * Alchemy SDK configuration settings
 * @type {Object}
 */
const ALCHEMY_SETTINGS = {
  alchemy_api_key: Cypress.env('alchemy_api_key'),
  network: Network.ETH_SEPOLIA,
};

/** Alchemy SDK instance */
const alchemy = new Alchemy(ALCHEMY_SETTINGS);

/** Wallet instance initialized with private key */
const wallet = new Wallet(Cypress.env('crypto_private_key'));

/**
 * Sends ETH to a specified wallet address
 * @async
 * @param {string} walletAddress - The recipient's wallet address
 * @param {string} amount - Amount of ETH to send
 * @returns {Promise<Object>} Transaction response from Alchemy
 * @throws {Error} If nonce fetch fails
 * @throws {Error} If transaction signing fails
 * @throws {Error} If transaction sending fails
 * @throws {Error} If transaction confirmation fails
 */
export async function sendEth(walletAddress, amount) {
  let nonce;
  try {
    nonce = await alchemy.core.getTransactionCount(wallet.address, 'latest');
  } catch (error) {
    console.error('Error fetching nonce:', error);
    throw new Error('Failed to fetch nonce');
  }

  /**
   * Transaction configuration object
   * @type {Object}
   */
  const transaction = {
    to: walletAddress,
    value: Utils.parseEther(amount),
    gasLimit: GAS_LIMIT,
    maxPriorityFeePerGas: Utils.parseUnits(MAX_PRIORITY_FEE_PER_GAS, 'gwei'),
    maxFeePerGas: Utils.parseUnits(MAX_FEE_PER_GAS, 'gwei'),
    nonce,
    type: TRANSACTION_TYPE,
    chainId: Cypress.env('chain_id'),
  };

  let rawTransaction;
  try {
    rawTransaction = await wallet.signTransaction(transaction);
  } catch (error) {
    throw new Error('Failed to sign transaction');
  }

  let tx;
  try {
    tx = await alchemy.core.sendTransaction(rawTransaction);
  } catch (error) {
    throw new Error('Failed to send transaction');
  }

  try {
    const response = await alchemy.transact.waitForTransaction(tx.hash);
    return response;
  } catch (error) {
    throw new Error('Failed to wait for transaction');
  }
}
