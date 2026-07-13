const resultBox = document.querySelector('#paymentResult');
const mockDetails = document.querySelector('#mockPaymentDetails');
const mockButton = document.querySelector('#completeMockPayment');
const mockMessage = document.querySelector('#mockMessage');

if (resultBox) checkPesapalStatus();
if (mockDetails) loadMockPayment();
mockButton?.addEventListener('click', completeMockPayment);

async function checkPesapalStatus() {
  const params = new URLSearchParams(window.location.search);
  const tracking = params.get('OrderTrackingId') || params.get('orderTrackingId');
  const reference = params.get('OrderMerchantReference') || params.get('orderMerchantReference') || '';
  if (!tracking) {
    resultBox.innerHTML = '<p class="eyebrow">Payment</p><h1>Status unavailable.</h1><p>The payment tracking reference was not returned. Check your dashboard or contact support.</p>';
    return;
  }
  try {
    const data = await api(`/api/payments/pesapal/status?orderTrackingId=${encodeURIComponent(tracking)}&orderMerchantReference=${encodeURIComponent(reference)}`);
    const paid = data.payment.status === 'paid';
    resultBox.innerHTML = `<p class="eyebrow">Payment ${paid ? 'confirmed' : 'status'}</p><h1>${paid ? 'Thank you.' : escapeHtml(capitalize(data.payment.status))}</h1><p>${paid ? `Booking ${escapeHtml(data.booking.reference)} is confirmed.` : 'Your dashboard will update when the payment is confirmed.'}</p><div class="payment-summary"><strong>${formatMoney(data.payment.amount, data.payment.currency)}</strong><span>${escapeHtml(data.payment.paymentMethod || data.payment.provider)}</span></div>`;
  } catch (error) {
    resultBox.innerHTML = `<p class="eyebrow">Payment</p><h1>We are checking.</h1><p>${escapeHtml(error.message)} Your dashboard remains the best place to see the latest status.</p>`;
  }
}

async function loadMockPayment() {
  const id = new URLSearchParams(window.location.search).get('payment');
  if (!id) return showMockError('Payment reference is missing.');
  try {
    const data = await api(`/api/payments/mock/${encodeURIComponent(id)}`);
    mockDetails.innerHTML = `<div class="payment-summary"><span>${escapeHtml(data.booking.reference)}</span><strong>${formatMoney(data.payment.amount, data.payment.currency)}</strong><small>${escapeHtml(data.booking.tripTitle || data.booking.destination)}</small></div>`;
    mockButton.disabled = false;
    mockButton.dataset.payment = id;
  } catch (error) {
    showMockError(error.message);
  }
}

async function completeMockPayment() {
  const id = mockButton.dataset.payment;
  if (!id) return;
  setBusy(mockButton, true, 'Processing');
  try {
    const data = await api(`/api/payments/mock/${encodeURIComponent(id)}/complete`, { method: 'POST', body: '{}' });
    mockMessage.textContent = data.message;
    mockMessage.className = 'form-message success';
    setTimeout(() => window.location.replace(data.redirect || 'dashboard.html'), 700);
  } catch (error) {
    showMockError(error.message);
    setBusy(mockButton, false);
  }
}

function showMockError(text) { if (mockMessage) { mockMessage.textContent = text; mockMessage.className = 'form-message error'; } }
async function api(url, options = {}) { const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Request failed.'); return data; }
function formatMoney(amount, currency) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(amount || 0)); }
function capitalize(value = '') { return value.charAt(0).toUpperCase() + value.slice(1); }
function setBusy(button, busy, text = '') { if (busy) { button.dataset.label = button.textContent; button.textContent = text; button.disabled = true; } else { button.textContent = button.dataset.label || button.textContent; button.disabled = false; } }
function escapeHtml(value = '') { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
