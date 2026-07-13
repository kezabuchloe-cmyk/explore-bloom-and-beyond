const state = {
  user: null,
  metrics: {},
  bookings: [],
  users: [],
  payments: [],
  destinations: [],
  trips: [],
  posts: [],
  socials: [],
  chats: [],
  collection: 'trips',
  editingId: null
};

const fieldConfig = {
  trips: [
    ['title', 'Title', 'text', true], ['destination', 'Destination', 'text', true],
    ['category', 'Category', 'text'], ['duration', 'Duration', 'text'],
    ['days', 'Days', 'number'], ['price', 'Price', 'number'], ['currency', 'Currency', 'text'],
    ['summary', 'Summary', 'textarea', true], ['imageUrl', 'Image URL', 'text'],
    ['featured', 'Featured', 'checkbox'], ['active', 'Active', 'checkbox']
  ],
  destinations: [
    ['name', 'Name', 'text', true], ['region', 'Region', 'text'],
    ['summary', 'Summary', 'textarea', true], ['imageUrl', 'Image URL', 'text'], ['featured', 'Featured', 'checkbox']
  ],
  posts: [
    ['title', 'Title', 'text', true], ['author', 'Author', 'text'], ['publishedAt', 'Published', 'date'],
    ['excerpt', 'Excerpt', 'textarea', true], ['imageUrl', 'Image URL', 'text'], ['content', 'Content', 'textarea']
  ],
  socials: [['platform', 'Platform', 'text', true], ['handle', 'Handle', 'text'], ['url', 'URL', 'url', true]]
};

const adminMessage = document.querySelector('#adminMessage');
const contentForm = document.querySelector('#contentForm');
const contentList = document.querySelector('#contentList');

loadAdmin();
document.querySelector('#refreshAdmin')?.addEventListener('click', loadAdmin);
document.querySelector('#adminLogout')?.addEventListener('click', logout);
document.querySelector('#contentCollection')?.addEventListener('change', (event) => {
  state.collection = event.target.value;
  state.editingId = null;
  renderContentForm();
  renderContentList();
});
contentForm?.addEventListener('submit', saveContent);
document.querySelector('#bookingSearch')?.addEventListener('input', renderBookings);
document.querySelector('#customerSearch')?.addEventListener('input', renderCustomers);
document.querySelector('.admin-main')?.addEventListener('click', handleAdminClick);
document.querySelector('.admin-main')?.addEventListener('submit', handleAdminSubmit);
document.querySelectorAll('.admin-nav[data-panel]').forEach((button) => button.addEventListener('click', () => switchPanel(button.dataset.panel)));

async function loadAdmin() {
  showMessage('Loading dashboard…', '');
  try {
    const data = await api('/api/admin/dashboard');
    Object.assign(state, data);
    document.querySelector('#adminIdentity').textContent = `${data.user.fullName} · ${data.user.role}`;
    if (data.user.role !== 'admin') {
      document.querySelector('[data-panel="content"]')?.classList.add('hidden');
    }
    renderAll();
    showMessage('', '');
  } catch (error) {
    if ([401, 403].includes(error.status)) return window.location.replace('login.html');
    showMessage(error.message, 'error');
  }
}

function renderAll() {
  renderMetrics();
  renderRecentBookings();
  renderBookings();
  renderCustomers();
  renderPayments();
  renderContentForm();
  renderContentList();
  renderChats();
}

function renderMetrics() {
  const items = [
    ['Bookings', state.metrics.bookings || 0],
    ['Pending', state.metrics.pending || 0],
    ['Customers', state.metrics.customers || 0],
    ['Revenue', formatMoney(state.metrics.revenue || 0, 'USD')],
    ['Paid', state.metrics.paidPayments || 0]
  ];
  document.querySelector('#adminMetrics').innerHTML = items.map(([label, value]) => `<article class="admin-metric"><span>${label}</span><strong>${value}</strong></article>`).join('');
}

function renderRecentBookings() {
  document.querySelector('#recentBookings').innerHTML = renderBookingTable(state.bookings.slice(0, 6), false);
}

function renderBookings() {
  const term = String(document.querySelector('#bookingSearch')?.value || '').trim().toLowerCase();
  const rows = state.bookings.filter((booking) => [booking.reference, booking.fullName, booking.email, booking.tripTitle, booking.destination].join(' ').toLowerCase().includes(term));
  document.querySelector('#adminBookings').innerHTML = rows.length ? rows.map(renderBookingEditor).join('') : '<div class="empty-state">No matching bookings.</div>';
}

function renderBookingEditor(booking) {
  return `<article class="admin-record">
    <div class="record-heading"><div><span class="booking-reference">${escapeHtml(booking.reference)}</span><h3>${escapeHtml(booking.tripTitle || booking.destination || 'Travel request')}</h3><p>${escapeHtml(booking.fullName)} · ${escapeHtml(booking.email)} · ${escapeHtml(booking.phone)}</p></div><span class="status-badge status-${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span></div>
    <div class="record-meta"><span>${booking.travelers} travelers</span><span>${booking.days} days</span><span>${escapeHtml(booking.paymentStatus)}</span><span>${formatDateTime(booking.submittedAt)}</span></div>
    <p>${escapeHtml(booking.message || 'No message added.')}</p>
    <form class="inline-admin-form" data-booking-form="${booking.id}">
      <label>Status<select name="status">${['pending','quoted','confirmed','completed','cancelled'].map((status) => `<option value="${status}" ${booking.status === status ? 'selected' : ''}>${capitalize(status)}</option>`).join('')}</select></label>
      <label>Amount<input name="totalAmount" type="number" min="0" step="0.01" value="${Number(booking.totalAmount || 0)}"/></label>
      <label>Currency<input name="currency" maxlength="3" value="${escapeAttribute(booking.currency || 'USD')}"/></label>
      <button class="admin-button primary" type="submit">Save Quote</button>
    </form>
  </article>`;
}

function renderCustomers() {
  const term = String(document.querySelector('#customerSearch')?.value || '').trim().toLowerCase();
  const rows = state.users.filter((user) => [user.fullName, user.email, user.phone, user.role].join(' ').toLowerCase().includes(term));
  const isAdmin = state.user?.role === 'admin';
  document.querySelector('#adminCustomers').innerHTML = rows.length ? `<div class="responsive-table"><table><thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>${rows.map((user) => `<tr><td><strong>${escapeHtml(user.fullName)}</strong><small>${formatDateTime(user.createdAt)}</small></td><td>${escapeHtml(user.email)}<small>${escapeHtml(user.phone || '')}</small></td><td><select data-user-role="${user.id}" ${isAdmin ? '' : 'disabled'}>${['customer','staff','admin'].map((role) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${capitalize(role)}</option>`).join('')}</select></td><td><select data-user-status="${user.id}" ${isAdmin ? '' : 'disabled'}><option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option><option value="disabled" ${user.status === 'disabled' ? 'selected' : ''}>Disabled</option></select></td><td>${isAdmin ? `<button class="admin-button secondary" data-save-user="${user.id}" type="button">Save User</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No matching customers.</div>';
}

function renderPayments() {
  document.querySelector('#adminPayments').innerHTML = state.payments.length ? `<div class="responsive-table"><table><thead><tr><th>Booking</th><th>Customer</th><th>Amount</th><th>Provider</th><th>Status</th><th>Date</th></tr></thead><tbody>${state.payments.map((payment) => `<tr><td>${escapeHtml(payment.bookingReference || '')}</td><td>${escapeHtml(payment.customerName || '')}<small>${escapeHtml(payment.customerEmail || '')}</small></td><td>${formatMoney(payment.amount, payment.currency)}</td><td>${escapeHtml(payment.provider)}</td><td><span class="status-badge status-${escapeHtml(payment.status)}">${escapeHtml(payment.status)}</span></td><td>${formatDateTime(payment.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No payment records.</div>';
}

function renderContentForm(item = null) {
  if (!contentForm) return;
  if (state.user?.role !== 'admin') {
    contentForm.innerHTML = '<div class="empty-state">Only administrators can edit website content.</div>';
    return;
  }
  const current = item || (state.editingId ? state[state.collection].find((entry) => entry.id === state.editingId) : null) || {};
  contentForm.innerHTML = fieldConfig[state.collection].map(([name, label, type, required]) => renderField(name, label, type, required, current[name])).join('') + `<div class="admin-actions"><button class="admin-button primary" type="submit">${state.editingId ? 'Save Changes' : 'Add Item'}</button>${state.editingId ? '<button class="admin-button secondary" data-cancel-edit type="button">Cancel</button>' : ''}</div>`;
  document.querySelector('#contentListTitle').textContent = collectionLabel(state.collection);
}

function renderField(name, label, type, required, value) {
  if (type === 'checkbox') return `<label class="checkbox-row"><input name="${name}" type="checkbox" ${value !== false && (value || name === 'active') ? 'checked' : ''}/> ${label}</label>`;
  if (type === 'textarea') return `<div class="form-row"><label for="content-${name}">${label}</label><textarea id="content-${name}" name="${name}" rows="4" ${required ? 'required' : ''}>${escapeHtml(value || '')}</textarea></div>`;
  return `<div class="form-row"><label for="content-${name}">${label}</label><input id="content-${name}" name="${name}" type="${type}" value="${escapeAttribute(value ?? '')}" ${required ? 'required' : ''}/></div>`;
}

function renderContentList() {
  const list = state[state.collection] || [];
  document.querySelector('#contentListTitle').textContent = collectionLabel(state.collection);
  contentList.innerHTML = list.length ? list.map((item) => `<article class="content-admin-item"><div><h3>${escapeHtml(item.title || item.name || item.platform || 'Untitled')}</h3><p>${escapeHtml(item.summary || item.excerpt || item.handle || item.url || '')}</p></div>${state.user?.role === 'admin' ? `<div class="admin-actions"><button class="admin-button secondary" data-edit-content="${item.id}" type="button">Edit</button><button class="admin-button danger" data-delete-content="${item.id}" type="button">Delete</button></div>` : ''}</article>`).join('') : '<div class="empty-state">No items.</div>';
}

function renderChats() {
  document.querySelector('#adminChats').innerHTML = state.chats.length ? state.chats.map((chat) => `<article class="admin-record"><div class="record-heading"><div><h3>${escapeHtml(chat.visitorName)}</h3><p>${escapeHtml(chat.visitorEmail || 'No email')}</p></div><span class="status-badge">${escapeHtml(chat.status)}</span></div><div class="admin-chat-log">${(chat.messages || []).map((msg) => `<div class="chat-bubble ${msg.sender === 'admin' ? 'from-admin' : 'from-visitor'}"><span>${msg.sender === 'admin' ? 'Team' : 'Visitor'}</span><p>${escapeHtml(msg.text)}</p><small>${formatDateTime(msg.createdAt)}</small></div>`).join('')}</div><form class="inline-admin-form chat-reply-form" data-chat-form="${chat.id}"><label class="grow-field">Reply<textarea name="message" rows="2" required></textarea></label><button class="admin-button primary" type="submit">Send Reply</button><button class="admin-button secondary" data-close-chat="${chat.id}" type="button">Close Chat</button></form></article>`).join('') : '<div class="empty-state">No support chats.</div>';
}

async function handleAdminSubmit(event) {
  const bookingForm = event.target.closest('[data-booking-form]');
  const chatForm = event.target.closest('[data-chat-form]');
  if (bookingForm) {
    event.preventDefault();
    const button = event.submitter;
    setBusy(button, true, 'Saving');
    try {
      const payload = Object.fromEntries(new FormData(bookingForm).entries());
      await api(`/api/admin/bookings/${bookingForm.dataset.bookingForm}`, { method: 'PATCH', body: JSON.stringify(payload) });
      await loadAdmin();
      showMessage('Booking updated.', 'success');
    } catch (error) { showMessage(error.message, 'error'); setBusy(button, false); }
  }
  if (chatForm) {
    event.preventDefault();
    const button = event.submitter;
    setBusy(button, true, 'Sending');
    try {
      const payload = Object.fromEntries(new FormData(chatForm).entries());
      await api(`/api/admin/chats/${chatForm.dataset.chatForm}/messages`, { method: 'POST', body: JSON.stringify(payload) });
      await loadAdmin();
      showMessage('Reply sent.', 'success');
    } catch (error) { showMessage(error.message, 'error'); setBusy(button, false); }
  }
}

async function handleAdminClick(event) {
  const saveUser = event.target.closest('[data-save-user]');
  const edit = event.target.closest('[data-edit-content]');
  const remove = event.target.closest('[data-delete-content]');
  const cancel = event.target.closest('[data-cancel-edit]');
  const closeChat = event.target.closest('[data-close-chat]');
  if (saveUser) {
    const id = saveUser.dataset.saveUser;
    setBusy(saveUser, true, 'Saving');
    try {
      await api(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role: document.querySelector(`[data-user-role="${id}"]`).value, status: document.querySelector(`[data-user-status="${id}"]`).value }) });
      await loadAdmin();
      showMessage('User updated.', 'success');
    } catch (error) { showMessage(error.message, 'error'); setBusy(saveUser, false); }
  }
  if (edit) {
    state.editingId = edit.dataset.editContent;
    renderContentForm();
    contentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (remove) {
    if (!confirm('Delete this item?')) return;
    try {
      await api(`/api/admin/${state.collection}/${remove.dataset.deleteContent}`, { method: 'DELETE' });
      await loadAdmin();
      showMessage('Item deleted.', 'success');
    } catch (error) { showMessage(error.message, 'error'); }
  }
  if (cancel) { state.editingId = null; renderContentForm(); }
  if (closeChat) {
    try {
      await api(`/api/admin/chats/${closeChat.dataset.closeChat}`, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) });
      await loadAdmin();
      showMessage('Chat closed.', 'success');
    } catch (error) { showMessage(error.message, 'error'); }
  }
}

async function saveContent(event) {
  event.preventDefault();
  if (state.user?.role !== 'admin') return;
  const button = event.submitter;
  setBusy(button, true, 'Saving');
  const data = new FormData(contentForm);
  const payload = Object.fromEntries(data.entries());
  fieldConfig[state.collection].forEach(([name, , type]) => {
    if (type === 'checkbox') payload[name] = data.has(name);
    if (type === 'number') payload[name] = Number(payload[name] || 0);
  });
  try {
    const url = state.editingId ? `/api/admin/${state.collection}/${state.editingId}` : `/api/admin/${state.collection}`;
    await api(url, { method: state.editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    state.editingId = null;
    await loadAdmin();
    showMessage('Content saved.', 'success');
  } catch (error) { showMessage(error.message, 'error'); setBusy(button, false); }
}

function switchPanel(panel) {
  document.querySelectorAll('.admin-nav[data-panel]').forEach((button) => button.classList.toggle('active', button.dataset.panel === panel));
  document.querySelectorAll('[data-panel-content]').forEach((section) => section.classList.toggle('active', section.dataset.panelContent === panel));
}

function renderBookingTable(bookings) {
  return bookings.length ? `<div class="responsive-table"><table><thead><tr><th>Reference</th><th>Traveler</th><th>Trip</th><th>Status</th><th>Payment</th></tr></thead><tbody>${bookings.map((b) => `<tr><td>${escapeHtml(b.reference)}</td><td>${escapeHtml(b.fullName)}<small>${escapeHtml(b.email)}</small></td><td>${escapeHtml(b.tripTitle || b.destination)}</td><td>${escapeHtml(b.status)}</td><td>${escapeHtml(b.paymentStatus)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No bookings.</div>';
}

async function logout() { try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } catch (_) {} window.location.replace('login.html'); }
async function api(url, options = {}) { const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const data = response.status === 204 ? {} : await response.json().catch(() => ({})); if (!response.ok) { const error = new Error(data.error || 'Request failed.'); error.status = response.status; throw error; } return data; }
function showMessage(text, type) { adminMessage.textContent = text; adminMessage.className = `form-message ${type}`; }
function setBusy(button, busy, text = '') { if (!button) return; if (busy) { button.dataset.label = button.textContent; button.textContent = text; button.disabled = true; } else { button.textContent = button.dataset.label || button.textContent; button.disabled = false; } }
function collectionLabel(value) { return ({ trips: 'Trips', destinations: 'Destinations', posts: 'Blog Posts', socials: 'Social Links' })[value] || value; }
function formatMoney(amount, currency) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(Number(amount || 0)); }
function formatDateTime(value) { if (!value) return ''; const date = new Date(value); return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function capitalize(value = '') { return String(value).charAt(0).toUpperCase() + String(value).slice(1); }
function escapeHtml(value = '') { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function escapeAttribute(value = '') { return escapeHtml(value).replace(/`/g, '&#96;'); }
