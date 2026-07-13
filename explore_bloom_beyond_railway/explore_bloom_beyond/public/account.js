const message = document.querySelector('#accountMessage');
initMenu();
redirectAuthenticatedUser();

document.querySelector('#loginForm')?.addEventListener('submit', login);
document.querySelector('#registerForm')?.addEventListener('submit', register);
document.querySelector('#forgotForm')?.addEventListener('submit', forgotPassword);
document.querySelector('#resetForm')?.addEventListener('submit', resetPassword);

async function redirectAuthenticatedUser() {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    if (!data.user) return;
    window.location.replace(data.user.role === 'customer' ? 'dashboard.html' : 'admin.html');
  } catch (_) {}
}

async function login(event) {
  event.preventDefault();
  setBusy(event.submitter, true, 'Logging In');
  try {
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    show('Login successful. Opening your dashboard…', 'success');
    window.location.replace(data.redirect || 'dashboard.html');
  } catch (error) {
    show(error.message, 'error');
  } finally {
    setBusy(event.submitter, false);
  }
}

async function register(event) {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (payload.password !== payload.confirmPassword) return show('Passwords do not match.', 'error');
  delete payload.confirmPassword;
  setBusy(event.submitter, true, 'Creating');
  try {
    await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    show('Account created. Opening your dashboard…', 'success');
    window.location.replace('dashboard.html');
  } catch (error) {
    show(error.message, 'error');
  } finally {
    setBusy(event.submitter, false);
  }
}

async function forgotPassword(event) {
  event.preventDefault();
  setBusy(event.submitter, true, 'Sending');
  try {
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const data = await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) });
    show(data.message, 'success');
    if (data.developmentResetUrl) {
      const link = document.createElement('a');
      link.href = data.developmentResetUrl;
      link.textContent = 'Open Test Link';
      link.className = 'development-reset-link';
      message.after(link);
    }
  } catch (error) {
    show(error.message, 'error');
  } finally {
    setBusy(event.submitter, false);
  }
}

async function resetPassword(event) {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (payload.password !== payload.confirmPassword) return show('Passwords do not match.', 'error');
  delete payload.confirmPassword;
  payload.token = new URLSearchParams(window.location.search).get('token') || '';
  if (!payload.token) return show('The reset token is missing.', 'error');
  setBusy(event.submitter, true, 'Saving');
  try {
    const data = await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) });
    show(data.message, 'success');
    setTimeout(() => window.location.replace('login.html'), 1000);
  } catch (error) {
    show(error.message, 'error');
  } finally {
    setBusy(event.submitter, false);
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function show(text, type) {
  if (!message) return;
  message.textContent = text;
  message.className = `form-message ${type}`;
}

function setBusy(button, busy, label = '') {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}

function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  toggle?.addEventListener('click', () => {
    const active = links.classList.toggle('active');
    toggle.setAttribute('aria-expanded', String(active));
  });
}
