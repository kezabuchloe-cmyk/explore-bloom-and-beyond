const DEFAULT_TIMEOUT_MS = 20_000;
let tokenCache = null;
let registeredIpnId = null;

function getBaseUrl() {
  return String(process.env.PESAPAL_ENV || 'sandbox').toLowerCase() === 'live'
    ? 'https://pay.pesapal.com/v3/api'
    : 'https://cybqa.pesapal.com/pesapalv3/api';
}

function isConfigured() {
  return Boolean(process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET);
}

async function getAccessToken() {
  if (!isConfigured()) throw new Error('Pesapal credentials are not configured.');
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;

  const response = await apiFetch('/Auth/RequestToken', {
    method: 'POST',
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    })
  }, false);

  if (!response.token) throw new Error(response.message || response.error?.message || 'Pesapal did not return an access token.');
  tokenCache = { token: response.token, expiresAt: Date.now() + 4 * 60 * 1000 };
  return tokenCache.token;
}

async function getNotificationId(ipnUrl) {
  if (process.env.PESAPAL_IPN_ID) return process.env.PESAPAL_IPN_ID;
  if (registeredIpnId) return registeredIpnId;

  const token = await getAccessToken();
  const response = await apiFetch('/URLSetup/RegisterIPN', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: 'GET' })
  });

  const id = response.ipn_id || response.ipnId;
  if (!id) throw new Error(response.message || response.error?.message || 'Pesapal did not return an IPN ID.');
  registeredIpnId = id;
  return id;
}

async function submitOrder({ merchantReference, amount, currency, description, callbackUrl, ipnUrl, customer }) {
  const token = await getAccessToken();
  const notificationId = await getNotificationId(ipnUrl);
  const names = splitName(customer.fullName);

  const response = await apiFetch('/Transactions/SubmitOrderRequest', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      id: merchantReference,
      currency: String(currency).toUpperCase(),
      amount: Number(amount),
      description,
      callback_url: callbackUrl,
      notification_id: notificationId,
      billing_address: {
        email_address: customer.email,
        phone_number: customer.phone,
        country_code: customer.countryCode || 'UG',
        first_name: names.firstName,
        middle_name: '',
        last_name: names.lastName,
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: ''
      }
    })
  });

  if (!response.redirect_url || !response.order_tracking_id) {
    throw new Error(response.message || response.error?.message || 'Pesapal could not create the checkout session.');
  }
  return response;
}

async function getTransactionStatus(orderTrackingId) {
  if (!orderTrackingId) throw new Error('Pesapal order tracking ID is required.');
  const token = await getAccessToken();
  return apiFetch(`/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
}

function mapPaymentStatus(payload = {}) {
  const description = String(payload.payment_status_description || payload.status || '').toLowerCase();
  const statusCode = Number(payload.status_code);
  if (description.includes('completed') || description.includes('paid') || statusCode === 1) return 'paid';
  if (description.includes('failed') || description.includes('invalid') || statusCode === 2) return 'failed';
  if (description.includes('reverse') || statusCode === 3) return 'reversed';
  return 'pending';
}

async function apiFetch(endpoint, options = {}, includeJsonHeader = true) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(includeJsonHeader ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }),
        ...(options.headers || {})
      }
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!response.ok) {
      const error = new Error(data.message || data.error?.message || `Pesapal request failed with status ${response.status}.`);
      error.statusCode = 502;
      error.details = data;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Pesapal request timed out. Please try again.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Traveler',
    lastName: parts.slice(1).join(' ') || parts[0] || 'Traveler'
  };
}

module.exports = {
  getBaseUrl,
  isConfigured,
  getNotificationId,
  submitOrder,
  getTransactionStatus,
  mapPaymentStatus
};
