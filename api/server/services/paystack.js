const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = 'https://api.paystack.co';

const paystackClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize a Paystack transaction
 * @param {Object} params
 * @param {string} params.email - Customer email
 * @param {number} params.amount - Amount in kobo (cents)
 * @param {string} [params.plan] - Paystack plan code for subscriptions
 * @param {Object} [params.metadata] - Transaction metadata
 * @param {string} [params.callback_url] - Redirect URL after payment
 * @returns {Promise<Object>} Paystack initialization response
 */
async function initializeTransaction({ email, amount, plan, metadata, callback_url }) {
  const payload = { email, amount, metadata, callback_url, currency: 'KES' };
  if (plan) {
    payload.plan = plan;
  }
  const response = await paystackClient.post('/transaction/initialize', payload);
  return response.data;
}

/**
 * Verify a Paystack transaction by reference
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} Paystack verification response
 */
async function verifyTransaction(reference) {
  const response = await paystackClient.get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return response.data;
}

/**
 * Disable a Paystack subscription
 * @param {string} code - Subscription code
 * @param {string} token - Email token
 * @returns {Promise<Object>} Paystack response
 */
async function disableSubscription(code, token) {
  const response = await paystackClient.post('/subscription/disable', { code, token });
  return response.data;
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  disableSubscription,
};
