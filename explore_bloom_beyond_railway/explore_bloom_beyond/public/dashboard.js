const state = { user: null, bookings: [] };
const bookingList = document.querySelector('#bookingList');
const profileForm = document.querySelector('#profileForm');
const profileMessage = document.querySelector('#profileMessage');

initMenu();
loadDashboard();
document.querySelector('#logoutButton')?.addEventListener('click', logout);
profileForm?.addEventListener('submit', saveProfile);
bookingList?.addEventListener('click', handleBookingAction);

async function loadDashboard() {
  try {
    const data = await api('/api/customer/dashboard');
    if (data.user.role !== 'customer') return window.location.replace('admin.html');
    state.user = data.user;
    state.bookings = data.bookings || [];
    renderUser();
    renderStats();
    renderBookings();
  } catch (error) {
    if (error.status === 401) return window.location.replace('login.html');
    bookingList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function renderUser() {
  document.querySelector('#dashboardGreeting').textContent = `Welcome, ${state.user.fullName.split(' ')[0]}`;
  document.querySelector('#profileName').value = state.user.fullName || '';
  document.querySelector('#profileEmail').value = state.user.email || '';
  document.querySelector('#profilePhone').value = state.user.phone || '';
  document.querySelector('#profileNationality').value = state.user.nationality || '';
}

function renderStats() {
  const paid = state.bookings.filter((booking) => booking.paymentStatus === 'paid').length;
  const active = state.bookings.filter((booking) => !['completed', 'cancelled'].includes(booking.status)).length;
  const quoted = state.bookings.filter((booking) => booking.totalAmount > 0 && booking.paymentStatus !== 'paid').length;
  document.querySelector('#dashboardStats').innerHTML = [
    ['Requests', state.bookings.length], ['Active', active], ['Quotes', quoted], ['Paid', paid]
  ].map(([label, value]) => `<article class="stat-card"><strong>${value}</strong><span>${label}</span></article>`).join('');
}

function renderBookings() {
  if (!state.bookings.length) {
    bookingList.innerHTML = '<div class="empty-state"><h3>No bookings yet.</h3><p>Choose a package and send your first request.</p><a class="btn primary compact" href="trips.html">View Trips</a></div>';
    return;
  }
  bookingList.innerHTML = state.bookings.map((booking) => {
    const canPay = booking.totalAmount > 0 && booking.paymentStatus !== 'paid' && booking.status !== 'cancelled';
    const canCancel = ['pending', 'quoted'].includes(booking.status) && booking.paymentStatus !== 'paid';
    return `<article class="booking-card">
      <div class="booking-card-head"><div><span class="booking-reference">${escapeHtml(booking.reference)}</span><h3>${escapeHtml(booking.tripTitle || booking.destination || 'Travel request')}</h3></div><span class="status-badge status-${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span></div>
      <p>${escapeHtml(booking.message || 'No additional message.')}</p>
      <div class="booking-meta"><span>${booking.travelers} traveler${booking.travelers === 1 ? '' : 's'}</span><span>${booking.days} day${booking.days === 1 ? '' : 's'}</span>${booking.startDate ? `<span>${formatDate(booking.startDate)}</span>` : ''}<span class="payment-badge">${escapeHtml(booking.paymentStatus)}</span></div>
      <div class="booking-price">${booking.totalAmount > 0 ? `<strong>${formatMoney(booking.totalAmount, booking.currency)}</strong><small>Package quote</small>` : '<strong>Quote pending</strong><small>Our team will confirm the price.</small>'}</div>
      <div class="booking-actions">${canPay ? `<button class="btn primary compact" data-pay="${booking.id}" type="button">Pay Now</button>` : ''}${canCancel ? `<button class="btn outline compact" data-cancel="${booking.id}" type="button">Cancel</button>` : ''}<a class="btn dark compact" href="https://wa.me/256788518714?text=${encodeURIComponent(`Hello, I need help with booking ${booking.reference}.`)}" target="_blank" rel="noopener">Get Help</a></div>
    </article>`;
  }).join('');
}

async function handleBookingAction(event) {
  const payButton = event.target.closest('[data-pay]');
  const cancelButton = event.target.closest('[data-cancel]');
  if (payButton) {
    setBusy(payButton, true, 'Opening');
    try {
      const data = await api('/api/payments/create', { method: 'POST', body: JSON.stringify({ bookingId: payButton.dataset.pay }) });
      window.location.href = data.redirectUrl;
    } catch (error) {
      alert(error.message);
      setBusy(payButton, false);
    }
  }
  if (cancelButton) {
    if (!confirm('Cancel this booking request?')) return;
    setBusy(cancelButton, true, 'Cancelling');
    try {
      await api(`/api/customer/bookings/${cancelButton.dataset.cancel}/cancel`, { method: 'PATCH', body: '{}' });
      await loadDashboard();
    } catch (error) {
      alert(error.message);
      setBusy(cancelButton, false);
    }
  }
}

async function saveProfile(event) {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, 'Saving');
  try {
    const payload = Object.fromEntries(new FormData(profileForm).entries());
    const data = await api('/api/customer/profile', { method: 'PATCH', body: JSON.stringify(payload) });
    state.user = data.user;
    renderUser();
    show(profileMessage, 'Profile saved.', 'success');
  } catch (error) {
    show(profileMessage, error.message, 'error');
  } finally {
    setBusy(button, false);
  }
}

async function logout() {
  try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } catch (_) {}
  window.location.replace('login.html');
}

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error || 'Request failed.'); error.status = response.status; throw error; }
  return data;
}
function formatMoney(amount, currency) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(Number(amount || 0)); }
function formatDate(value) { const date = new Date(`${String(value).slice(0, 10)}T00:00:00`); return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
function setBusy(button, busy, text = '') { if (!button) return; if (busy) { button.dataset.label = button.textContent; button.textContent = text; button.disabled = true; } else { button.textContent = button.dataset.label || button.textContent; button.disabled = false; } }
function show(element, text, type) { element.textContent = text; element.className = `form-message ${type}`; }
function escapeHtml(value = '') { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function initMenu() { const toggle = document.querySelector('.menu-toggle'); const links = document.querySelector('.nav-links'); toggle?.addEventListener('click', () => { const active = links.classList.toggle('active'); toggle.setAttribute('aria-expanded', String(active)); }); }
