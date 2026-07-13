try {
  require('dotenv').config();
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const {
  query,
  withTransaction,
  initializeDatabase,
  audit,
  normalizeEmail,
  cleanText,
  isUsingMemoryDatabase,
  closePool
} = require('./src/db');
const {
  getJwtSecret,
  setSessionCookie,
  clearSessionCookie,
  attachUser,
  requireAuth,
  requireRole,
  publicUser
} = require('./src/auth');
const { sendPasswordReset, sendBookingNotice } = require('./src/mailer');
const pesapal = require('./src/pesapal');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONTENT_COLLECTIONS = new Set(['destinations', 'trips', 'posts', 'socials']);
const PAYMENT_MODE = String(process.env.PAYMENTS_MODE || (process.env.NODE_ENV === 'production' ? 'disabled' : 'mock')).toLowerCase();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
      connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
      frameSrc: ['https://cybqa.pesapal.com', 'https://pay.pesapal.com'],
      objectSrc: ["'none'"]
    }
  }
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use('/api', attachUser);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: 'draft-8', legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 80, standardHeaders: 'draft-8', legacyHeaders: false });
const paymentLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false });

app.get('/api/health', asyncHandler(async (req, res) => {
  const database = await query('SELECT CURRENT_TIMESTAMP AS now');
  res.json({
    ok: true,
    message: 'Explore Bloom & Beyond booking platform is running',
    database: isUsingMemoryDatabase() ? 'temporary-memory' : 'postgresql',
    paymentMode: PAYMENT_MODE,
    time: database.rows[0].now
  });
}));

app.get('/api/content', asyncHandler(async (req, res) => {
  const [destinations, trips, posts, socials] = await Promise.all([
    query('SELECT * FROM destinations ORDER BY featured DESC, name ASC'),
    query('SELECT * FROM trips WHERE active = TRUE ORDER BY featured DESC, price ASC, title ASC'),
    query('SELECT * FROM posts ORDER BY published_at DESC NULLS LAST, created_at DESC'),
    query('SELECT * FROM socials ORDER BY platform ASC')
  ]);
  res.json({
    destinations: destinations.rows.map(mapDestination),
    trips: trips.rows.map(mapTrip),
    posts: posts.rows.map(mapPost),
    socials: socials.rows.map(mapSocial)
  });
}));

app.get('/api/:collection', asyncHandler(async (req, res, next) => {
  const collection = req.params.collection;
  if (!CONTENT_COLLECTIONS.has(collection)) return next();
  const order = collection === 'trips'
    ? 'featured DESC, price ASC, title ASC'
    : collection === 'posts'
      ? 'published_at DESC NULLS LAST, created_at DESC'
      : collection === 'destinations'
        ? 'featured DESC, name ASC'
        : 'platform ASC';
  const where = collection === 'trips' ? ' WHERE active = TRUE' : '';
  const result = await query(`SELECT * FROM ${collection}${where} ORDER BY ${order}`);
  res.json(result.rows.map((row) => mapCollectionRow(collection, row)));
}));

// Authentication
app.post('/api/auth/register', authLimiter, asyncHandler(async (req, res) => {
  const fullName = cleanText(req.body?.fullName);
  const email = normalizeEmail(req.body?.email);
  const phone = cleanText(req.body?.phone);
  const nationality = cleanText(req.body?.nationality);
  const password = String(req.body?.password || '');

  validateRegistration({ fullName, email, phone, password });
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount) return res.status(409).json({ error: 'An account already exists for this email.' });

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO users (id, full_name, email, phone, nationality, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'customer')
       RETURNING id, full_name, email, phone, nationality, role, status, created_at`,
      [userId, fullName, email, phone, nationality, passwordHash]
    );
    await client.query(
      `UPDATE bookings SET user_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id IS NULL AND LOWER(email) = $2`,
      [userId, email]
    );
    return inserted.rows[0];
  });

  setSessionCookie(res, result);
  await audit(userId, 'auth.register', 'user', userId);
  res.status(201).json({ user: publicUser(result) });
}));

app.post('/api/auth/login', authLimiter, asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (!result.rowCount || !(await bcrypt.compare(password, result.rows[0].password_hash))) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  const user = result.rows[0];
  if (user.status !== 'active') return res.status(403).json({ error: 'This account is disabled.' });

  await query(
    `UPDATE bookings SET user_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id IS NULL AND LOWER(email) = $2`,
    [user.id, email]
  );
  setSessionCookie(res, user);
  await audit(user.id, 'auth.login', 'user', user.id);
  res.json({ user: publicUser(user), redirect: user.role === 'customer' ? '/dashboard.html' : '/admin.html' });
}));

app.post('/api/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  await audit(req.user.id, 'auth.logout', 'user', req.user.id);
  clearSessionCookie(res);
  res.json({ ok: true });
}));

app.get('/api/auth/me', (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post('/api/auth/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const result = await query('SELECT id, full_name, email FROM users WHERE email = $1 AND status = \'active\'', [email]);
  const generic = { message: 'If that email is registered, a password-reset link has been prepared.' };
  if (!result.rowCount) return res.json(generic);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await withTransaction(async (client) => {
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [result.rows[0].id]);
    await client.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenId, result.rows[0].id, tokenHash, expiresAt]
    );
  });

  const resetUrl = `${getPublicUrl(req)}/reset-password.html?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordReset(result.rows[0].email, result.rows[0].full_name, resetUrl);
  await audit(result.rows[0].id, 'auth.password_reset_requested', 'user', result.rows[0].id);
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) generic.developmentResetUrl = resetUrl;
  res.json(generic);
}));

app.post('/api/auth/reset-password', authLimiter, asyncHandler(async (req, res) => {
  const rawToken = String(req.body?.token || '');
  const password = String(req.body?.password || '');
  validatePassword(password);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const tokenResult = await query(
    `SELECT prt.id, prt.user_id
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token_hash = $1 AND prt.used_at IS NULL AND prt.expires_at > $2 AND u.status = 'active'`,
    [tokenHash, new Date()]
  );
  if (!tokenResult.rowCount) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });

  const passwordHash = await bcrypt.hash(password, 12);
  await withTransaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, tokenResult.rows[0].user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1', [tokenResult.rows[0].id]);
  });
  await audit(tokenResult.rows[0].user_id, 'auth.password_reset_completed', 'user', tokenResult.rows[0].user_id);
  res.json({ message: 'Password updated. You can now log in.' });
}));

// Bookings and customer dashboard
app.post('/api/bookings', writeLimiter, asyncHandler(async (req, res) => {
  const payload = await sanitizeBooking(req.body, req.user);
  if (!payload.fullName || !payload.email || !payload.phone || (!payload.tripId && !payload.destination)) {
    return res.status(400).json({ error: 'Full name, email, phone, and a destination or trip are required.' });
  }

  const id = crypto.randomUUID();
  const reference = await createBookingReference();
  const booking = await query(
    `INSERT INTO bookings (
      id, reference, user_id, request_type, full_name, email, phone, nationality,
      destination, trip_id, trip_title, travelers, days, start_date, message, source,
      status, total_amount, currency, payment_status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14::date, $15, $16,
      $17, $18, $19, 'unpaid'
    ) RETURNING *`,
    [
      id, reference, req.user?.id || null, payload.requestType, payload.fullName, payload.email,
      payload.phone, payload.nationality, payload.destination, payload.tripId || null, payload.tripTitle,
      payload.travelers, payload.days, payload.startDate, payload.message, payload.source,
      payload.totalAmount > 0 ? 'quoted' : 'pending', payload.totalAmount, payload.currency
    ]
  );
  const mapped = mapBooking(booking.rows[0]);
  sendBookingNotice(mapped).catch((error) => console.error('Booking email error:', error.message));
  await audit(req.user?.id, 'booking.created', 'booking', id, { reference });
  res.status(201).json({
    ...mapped,
    next: req.user ? '/dashboard.html' : '/register.html',
    notice: req.user
      ? `Request ${reference} was saved to your dashboard.`
      : `Request ${reference} was saved. Create an account with the same email to manage it.`
  });
}));

app.get('/api/customer/dashboard', requireAuth, asyncHandler(async (req, res) => {
  const [bookings, payments] = await Promise.all([
    query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY submitted_at DESC', [req.user.id]),
    query(`SELECT p.* FROM payments p JOIN bookings b ON b.id = p.booking_id
           WHERE b.user_id = $1 ORDER BY p.created_at DESC`, [req.user.id])
  ]);
  const paymentsByBooking = new Map();
  for (const row of payments.rows) {
    const list = paymentsByBooking.get(row.booking_id) || [];
    list.push(mapPayment(row));
    paymentsByBooking.set(row.booking_id, list);
  }
  res.json({
    user: publicUser(req.user),
    bookings: bookings.rows.map((row) => ({ ...mapBooking(row), payments: paymentsByBooking.get(row.id) || [] }))
  });
}));

app.patch('/api/customer/profile', requireAuth, writeLimiter, asyncHandler(async (req, res) => {
  const fullName = cleanText(req.body?.fullName);
  const phone = cleanText(req.body?.phone);
  const nationality = cleanText(req.body?.nationality);
  if (!fullName || !phone) return res.status(400).json({ error: 'Full name and phone are required.' });
  const result = await query(
    `UPDATE users SET full_name = $1, phone = $2, nationality = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING id, full_name, email, phone, nationality, role, status, created_at`,
    [fullName, phone, nationality, req.user.id]
  );
  await audit(req.user.id, 'profile.updated', 'user', req.user.id);
  res.json({ user: publicUser(result.rows[0]) });
}));

app.patch('/api/customer/bookings/:id/cancel', requireAuth, writeLimiter, asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'quoted') AND payment_status <> 'paid'
     RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rowCount) return res.status(400).json({ error: 'This booking cannot be cancelled online.' });
  await audit(req.user.id, 'booking.cancelled', 'booking', req.params.id);
  res.json({ booking: mapBooking(result.rows[0]) });
}));

// Payments
app.post('/api/payments/create', requireAuth, paymentLimiter, asyncHandler(async (req, res) => {
  const bookingResult = await query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [req.body?.bookingId, req.user.id]);
  if (!bookingResult.rowCount) return res.status(404).json({ error: 'Booking not found.' });
  const booking = bookingResult.rows[0];
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Cancelled bookings cannot be paid.' });
  if (booking.payment_status === 'paid') return res.status(400).json({ error: 'This booking is already paid.' });
  if (Number(booking.total_amount) <= 0) return res.status(400).json({ error: 'The booking needs a price quote before payment.' });
  if (PAYMENT_MODE === 'disabled') return res.status(503).json({ error: 'Online payments are not enabled yet.' });

  const paymentId = crypto.randomUUID();
  const merchantReference = `${booking.reference}-${Date.now().toString(36).toUpperCase()}`;
  await query(
    `INSERT INTO payments (id, booking_id, provider, merchant_reference, amount, currency, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
    [paymentId, booking.id, PAYMENT_MODE === 'mock' ? 'mock' : 'pesapal', merchantReference, booking.total_amount, booking.currency]
  );
  await query("UPDATE bookings SET payment_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [booking.id]);

  if (PAYMENT_MODE === 'mock') {
    const redirectUrl = `${getPublicUrl(req)}/mock-checkout.html?payment=${encodeURIComponent(paymentId)}`;
    await audit(req.user.id, 'payment.mock_created', 'payment', paymentId, { bookingId: booking.id });
    return res.status(201).json({ redirectUrl, paymentId, provider: 'mock' });
  }

  if (PAYMENT_MODE !== 'pesapal' || !pesapal.isConfigured()) {
    await query("UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [paymentId]);
    await query("UPDATE bookings SET payment_status = 'unpaid', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [booking.id]);
    return res.status(503).json({ error: 'Pesapal is selected but its credentials are not configured.' });
  }

  try {
    const publicUrl = getPublicUrl(req);
    const response = await pesapal.submitOrder({
      merchantReference,
      amount: Number(booking.total_amount),
      currency: booking.currency,
      description: `Explore Bloom & Beyond booking ${booking.reference}`,
      callbackUrl: `${publicUrl}/payment-result.html`,
      ipnUrl: `${publicUrl}/api/payments/pesapal/ipn`,
      customer: {
        fullName: booking.full_name,
        email: booking.email,
        phone: booking.phone,
        countryCode: inferCountryCode(booking.nationality)
      }
    });
    await query(
      `UPDATE payments SET order_tracking_id = $1, raw_response = $2::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [response.order_tracking_id, JSON.stringify(response), paymentId]
    );
    await audit(req.user.id, 'payment.pesapal_created', 'payment', paymentId, { bookingId: booking.id });
    return res.status(201).json({ redirectUrl: response.redirect_url, paymentId, provider: 'pesapal' });
  } catch (error) {
    await query("UPDATE payments SET status = 'failed', raw_response = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [JSON.stringify({ error: error.message }), paymentId]);
    await query("UPDATE bookings SET payment_status = 'unpaid', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [booking.id]);
    throw error;
  }
}));

app.get('/api/payments/mock/:id', requireAuth, asyncHandler(async (req, res) => {
  if (PAYMENT_MODE !== 'mock') return res.status(404).json({ error: 'Mock checkout is disabled.' });
  const result = await query(
    `SELECT p.*, b.reference, b.trip_title, b.destination, b.user_id
     FROM payments p JOIN bookings b ON b.id = p.booking_id
     WHERE p.id = $1 AND b.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Payment not found.' });
  res.json({ payment: mapPayment(result.rows[0]), booking: { reference: result.rows[0].reference, tripTitle: result.rows[0].trip_title, destination: result.rows[0].destination } });
}));

app.post('/api/payments/mock/:id/complete', requireAuth, paymentLimiter, asyncHandler(async (req, res) => {
  if (PAYMENT_MODE !== 'mock') return res.status(404).json({ error: 'Mock checkout is disabled.' });
  const result = await withTransaction(async (client) => {
    const payment = await client.query(
      `SELECT p.*, b.user_id FROM payments p JOIN bookings b ON b.id = p.booking_id
       WHERE p.id = $1 AND b.user_id = $2 FOR UPDATE`,
      [req.params.id, req.user.id]
    );
    if (!payment.rowCount) return null;
    await client.query(
      `UPDATE payments SET status = 'paid', payment_method = 'Mock payment', confirmation_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [`TEST-${Date.now()}`, req.params.id]
    );
    await client.query(
      `UPDATE bookings SET payment_status = 'paid', status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [payment.rows[0].booking_id]
    );
    return payment.rows[0];
  });
  if (!result) return res.status(404).json({ error: 'Payment not found.' });
  await audit(req.user.id, 'payment.mock_completed', 'payment', req.params.id);
  res.json({ message: 'Test payment completed.', redirect: '/dashboard.html' });
}));

app.all('/api/payments/pesapal/ipn', asyncHandler(async (req, res) => {
  const orderTrackingId = cleanText(req.query.OrderTrackingId || req.query.orderTrackingId || req.body?.OrderTrackingId || req.body?.orderTrackingId);
  const merchantReference = cleanText(req.query.OrderMerchantReference || req.query.orderMerchantReference || req.body?.OrderMerchantReference || req.body?.orderMerchantReference);
  const notificationType = cleanText(req.query.OrderNotificationType || req.query.orderNotificationType || req.body?.OrderNotificationType || req.body?.orderNotificationType || 'CHANGE');

  if (orderTrackingId && PAYMENT_MODE === 'pesapal' && pesapal.isConfigured()) {
    await updatePesapalPayment(orderTrackingId, merchantReference);
  }
  res.status(200).json({
    orderNotificationType: notificationType,
    orderTrackingId,
    orderMerchantReference: merchantReference,
    status: 200
  });
}));

app.get('/api/payments/pesapal/status', asyncHandler(async (req, res) => {
  const orderTrackingId = cleanText(req.query.OrderTrackingId || req.query.orderTrackingId);
  const merchantReference = cleanText(req.query.OrderMerchantReference || req.query.orderMerchantReference);
  if (!orderTrackingId) return res.status(400).json({ error: 'Order tracking ID is missing.' });

  if (PAYMENT_MODE === 'pesapal' && pesapal.isConfigured()) {
    await updatePesapalPayment(orderTrackingId, merchantReference);
  }
  const result = await query(
    `SELECT p.*, b.reference, b.trip_title, b.destination
     FROM payments p JOIN bookings b ON b.id = p.booking_id
     WHERE p.order_tracking_id = $1 OR ($2 <> '' AND p.merchant_reference = $2)
     ORDER BY p.created_at DESC LIMIT 1`,
    [orderTrackingId, merchantReference]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Payment record not found.' });
  res.json({ payment: mapPayment(result.rows[0]), booking: { reference: result.rows[0].reference, tripTitle: result.rows[0].trip_title, destination: result.rows[0].destination } });
}));

// Support chat
app.post('/api/chats', writeLimiter, asyncHandler(async (req, res) => {
  const name = cleanText(req.body?.name || req.user?.full_name);
  const email = normalizeEmail(req.body?.email || req.user?.email);
  const message = cleanText(req.body?.message);
  if (!name || !message) return res.status(400).json({ error: 'Name and message are required.' });
  const chatId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO chats (id, user_id, visitor_name, visitor_email) VALUES ($1, $2, $3, $4)`,
      [chatId, req.user?.id || null, name, email]
    );
    await client.query(
      `INSERT INTO chat_messages (id, chat_id, sender, text) VALUES ($1, $2, 'visitor', $3)`,
      [messageId, chatId, message]
    );
  });
  res.status(201).json({ id: chatId, visitorName: name, visitorEmail: email, status: 'open', messages: [{ id: messageId, sender: 'visitor', text: message, createdAt: new Date().toISOString() }] });
}));

app.get('/api/chats/:id', asyncHandler(async (req, res) => {
  const chat = await getChat(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found.' });
  res.json(chat);
}));

app.post('/api/chats/:id/messages', writeLimiter, asyncHandler(async (req, res) => {
  const text = cleanText(req.body?.message);
  if (!text) return res.status(400).json({ error: 'Message is required.' });
  const exists = await query('SELECT id FROM chats WHERE id = $1', [req.params.id]);
  if (!exists.rowCount) return res.status(404).json({ error: 'Chat not found.' });
  const messageId = crypto.randomUUID();
  const result = await query(
    `INSERT INTO chat_messages (id, chat_id, sender, text) VALUES ($1, $2, 'visitor', $3) RETURNING *`,
    [messageId, req.params.id, text]
  );
  await query("UPDATE chats SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [req.params.id]);
  res.status(201).json(mapChatMessage(result.rows[0]));
}));

// Admin and staff
app.get('/api/admin/dashboard', requireRole('staff', 'admin'), asyncHandler(async (req, res) => {
  const [metrics, bookings, users, payments, destinations, trips, posts, socials, chats] = await Promise.all([
    query(`SELECT
      (SELECT COUNT(*) FROM bookings) AS bookings,
      (SELECT COUNT(*) FROM bookings WHERE status = 'pending') AS pending,
      (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') AS revenue,
      (SELECT COUNT(*) FROM payments WHERE status = 'paid') AS paid_payments`),
    query('SELECT * FROM bookings ORDER BY submitted_at DESC LIMIT 300'),
    query("SELECT id, full_name, email, phone, nationality, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 300"),
    query(`SELECT p.*, b.reference, b.full_name, b.email FROM payments p JOIN bookings b ON b.id = p.booking_id ORDER BY p.created_at DESC LIMIT 300`),
    query('SELECT * FROM destinations ORDER BY featured DESC, name ASC'),
    query('SELECT * FROM trips ORDER BY featured DESC, title ASC'),
    query('SELECT * FROM posts ORDER BY published_at DESC NULLS LAST, created_at DESC'),
    query('SELECT * FROM socials ORDER BY platform ASC'),
    query('SELECT * FROM chats ORDER BY updated_at DESC LIMIT 200')
  ]);
  const chatList = [];
  for (const row of chats.rows) chatList.push(await getChat(row.id));
  res.json({
    user: publicUser(req.user),
    metrics: {
      bookings: Number(metrics.rows[0].bookings || 0),
      pending: Number(metrics.rows[0].pending || 0),
      customers: Number(metrics.rows[0].customers || 0),
      revenue: Number(metrics.rows[0].revenue || 0),
      paidPayments: Number(metrics.rows[0].paid_payments || 0)
    },
    bookings: bookings.rows.map(mapBooking),
    users: users.rows.map(publicUser),
    payments: payments.rows.map((row) => ({ ...mapPayment(row), bookingReference: row.reference, customerName: row.full_name, customerEmail: row.email })),
    destinations: destinations.rows.map(mapDestination),
    trips: trips.rows.map(mapTrip),
    posts: posts.rows.map(mapPost),
    socials: socials.rows.map(mapSocial),
    chats: chatList
  });
}));

app.patch('/api/admin/bookings/:id', requireRole('staff', 'admin'), writeLimiter, asyncHandler(async (req, res) => {
  const status = ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'].includes(req.body?.status) ? req.body.status : null;
  const currency = cleanCurrency(req.body?.currency || 'USD');
  const amountProvided = req.body?.totalAmount !== undefined && req.body?.totalAmount !== '';
  const totalAmount = amountProvided ? Math.max(Number(req.body.totalAmount), 0) : null;
  if (!status && !amountProvided) return res.status(400).json({ error: 'Add a status or quote amount.' });

  const current = await query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'Booking not found.' });
  const nextStatus = status || current.rows[0].status;
  const nextAmount = amountProvided ? totalAmount : current.rows[0].total_amount;
  const result = await query(
    `UPDATE bookings SET status = $1, total_amount = $2, currency = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 RETURNING *`,
    [nextStatus, nextAmount, currency || current.rows[0].currency, req.params.id]
  );
  await audit(req.user.id, 'admin.booking_updated', 'booking', req.params.id, { status: nextStatus, totalAmount: Number(nextAmount), currency });
  res.json({ booking: mapBooking(result.rows[0]) });
}));

app.patch('/api/admin/users/:id', requireRole('admin'), writeLimiter, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id && req.body?.status === 'disabled') return res.status(400).json({ error: 'You cannot disable your own account.' });
  const role = ['customer', 'staff', 'admin'].includes(req.body?.role) ? req.body.role : null;
  const status = ['active', 'disabled'].includes(req.body?.status) ? req.body.status : null;
  if (!role && !status) return res.status(400).json({ error: 'Choose a valid role or status.' });
  const current = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'User not found.' });
  const result = await query(
    `UPDATE users SET role = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3
     RETURNING id, full_name, email, phone, nationality, role, status, created_at`,
    [role || current.rows[0].role, status || current.rows[0].status, req.params.id]
  );
  await audit(req.user.id, 'admin.user_updated', 'user', req.params.id, { role: result.rows[0].role, status: result.rows[0].status });
  res.json({ user: publicUser(result.rows[0]) });
}));

app.post('/api/admin/chats/:id/messages', requireRole('staff', 'admin'), writeLimiter, asyncHandler(async (req, res) => {
  const text = cleanText(req.body?.message);
  if (!text) return res.status(400).json({ error: 'Reply message is required.' });
  const exists = await query('SELECT id FROM chats WHERE id = $1', [req.params.id]);
  if (!exists.rowCount) return res.status(404).json({ error: 'Chat not found.' });
  const id = crypto.randomUUID();
  const result = await query(
    `INSERT INTO chat_messages (id, chat_id, sender, text) VALUES ($1, $2, 'admin', $3) RETURNING *`,
    [id, req.params.id, text]
  );
  await query("UPDATE chats SET status = 'answered', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [req.params.id]);
  await audit(req.user.id, 'admin.chat_replied', 'chat', req.params.id);
  res.status(201).json(mapChatMessage(result.rows[0]));
}));

app.patch('/api/admin/chats/:id', requireRole('staff', 'admin'), writeLimiter, asyncHandler(async (req, res) => {
  const status = ['open', 'answered', 'closed'].includes(req.body?.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ error: 'Invalid chat status.' });
  const result = await query('UPDATE chats SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id', [status, req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Chat not found.' });
  res.json({ chat: await getChat(req.params.id) });
}));

app.post('/api/admin/:collection', requireRole('admin'), writeLimiter, asyncHandler(async (req, res, next) => {
  const collection = req.params.collection;
  if (!CONTENT_COLLECTIONS.has(collection)) return next();
  const item = sanitizeContent(collection, req.body);
  const id = cleanText(req.body?.id) || `${collection.slice(0, -1)}-${crypto.randomBytes(5).toString('hex')}`;
  const result = await insertContent(collection, id, item);
  await audit(req.user.id, 'admin.content_created', collection, id);
  res.status(201).json(mapCollectionRow(collection, result));
}));

app.put('/api/admin/:collection/:id', requireRole('admin'), writeLimiter, asyncHandler(async (req, res, next) => {
  const collection = req.params.collection;
  if (!CONTENT_COLLECTIONS.has(collection)) return next();
  const item = sanitizeContent(collection, req.body);
  const result = await updateContent(collection, req.params.id, item);
  if (!result) return res.status(404).json({ error: 'Item not found.' });
  await audit(req.user.id, 'admin.content_updated', collection, req.params.id);
  res.json(mapCollectionRow(collection, result));
}));

app.delete('/api/admin/:collection/:id', requireRole('admin'), writeLimiter, asyncHandler(async (req, res, next) => {
  const collection = req.params.collection;
  if (!CONTENT_COLLECTIONS.has(collection)) return res.status(404).json({ error: 'Unknown collection.' });
  const result = await query(`DELETE FROM ${collection} WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Item not found.' });
  await audit(req.user.id, 'admin.content_deleted', collection, req.params.id);
  res.status(204).send();
}));

app.use(express.static(PUBLIC_DIR, { dotfiles: 'deny', extensions: ['html'], maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.use((error, req, res, next) => {
  console.error(error);
  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Server error. Please try again.'
    : error.message || 'Server error.';
  res.status(statusCode).json({ error: message });
});

async function start() {
  getJwtSecret();
  await initializeDatabase();
  const server = app.listen(PORT, () => {
    console.log(`Explore Bloom & Beyond running on port ${PORT}`);
    console.log(`Payment mode: ${PAYMENT_MODE}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing server...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Application failed to start:', error);
    process.exit(1);
  });
}

async function sanitizeBooking(body = {}, user) {
  const requestType = body.requestType === 'booking' ? 'booking' : 'inquiry';
  const fullName = cleanText(body.fullName || user?.full_name);
  const email = normalizeEmail(body.email || user?.email);
  const phone = cleanText(body.phone || user?.phone);
  const nationality = cleanText(body.nationality || user?.nationality);
  const travelers = clampInteger(body.travelers || body.people || 1, 1, 100);
  let days = clampInteger(body.days || 1, 1, 90);
  let destination = cleanText(body.destination);
  let tripTitle = cleanText(body.trip);
  let tripId = cleanText(body.tripId);
  let totalAmount = 0;
  let currency = 'USD';

  let tripResult;
  if (tripId) tripResult = await query('SELECT * FROM trips WHERE id = $1 AND active = TRUE', [tripId]);
  if (!tripResult?.rowCount && tripTitle) tripResult = await query('SELECT * FROM trips WHERE LOWER(title) = LOWER($1) AND active = TRUE LIMIT 1', [tripTitle]);
  if (tripResult?.rowCount) {
    const trip = tripResult.rows[0];
    tripId = trip.id;
    tripTitle = trip.title;
    destination = destination || trip.destination;
    days = Number(body.days || trip.days || days);
    if (requestType === 'booking') totalAmount = Number(trip.price) * travelers;
    currency = trip.currency;
  }

  return {
    requestType,
    fullName,
    email,
    phone,
    nationality,
    destination,
    tripId,
    tripTitle,
    travelers,
    days,
    startDate: cleanDate(body.startDate),
    message: cleanText(body.message),
    source: cleanText(body.source || 'website').slice(0, 100),
    totalAmount,
    currency: cleanCurrency(currency)
  };
}

async function createBookingReference() {
  const date = new Date();
  const prefix = `EBB-${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const reference = `${prefix}-${suffix}`;
    const exists = await query('SELECT 1 FROM bookings WHERE reference = $1', [reference]);
    if (!exists.rowCount) return reference;
  }
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

async function updatePesapalPayment(orderTrackingId, merchantReference = '') {
  const statusPayload = await pesapal.getTransactionStatus(orderTrackingId);
  const status = pesapal.mapPaymentStatus(statusPayload);
  const paymentResult = await query(
    `UPDATE payments SET
       order_tracking_id = COALESCE(order_tracking_id, $1),
       status = $2,
       payment_method = $3,
       confirmation_code = $4,
       raw_response = $5::jsonb,
       updated_at = CURRENT_TIMESTAMP
     WHERE order_tracking_id = $1 OR ($6 <> '' AND merchant_reference = $6)
     RETURNING booking_id, id`,
    [
      orderTrackingId,
      status,
      cleanText(statusPayload.payment_method),
      cleanText(statusPayload.confirmation_code),
      JSON.stringify(statusPayload),
      merchantReference
    ]
  );
  if (paymentResult.rowCount) {
    const bookingPaymentStatus = status === 'paid' ? 'paid' : status === 'pending' ? 'pending' : status;
    const bookingStatusSql = status === 'paid' ? ", status = CASE WHEN status = 'cancelled' THEN status ELSE 'confirmed' END" : '';
    await query(
      `UPDATE bookings SET payment_status = $1${bookingStatusSql}, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [bookingPaymentStatus, paymentResult.rows[0].booking_id]
    );
  }
  return statusPayload;
}

async function getChat(chatId) {
  const chat = await query('SELECT * FROM chats WHERE id = $1', [chatId]);
  if (!chat.rowCount) return null;
  const messages = await query('SELECT * FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC', [chatId]);
  return {
    id: chat.rows[0].id,
    visitorName: chat.rows[0].visitor_name,
    visitorEmail: chat.rows[0].visitor_email,
    status: chat.rows[0].status,
    createdAt: chat.rows[0].created_at,
    updatedAt: chat.rows[0].updated_at,
    messages: messages.rows.map(mapChatMessage)
  };
}

function sanitizeContent(collection, body = {}) {
  if (collection === 'destinations') {
    const item = {
      name: cleanText(body.name), region: cleanText(body.region), summary: cleanText(body.summary),
      imageUrl: cleanText(body.imageUrl), featured: Boolean(body.featured)
    };
    requireFields(item, ['name', 'summary']);
    return item;
  }
  if (collection === 'trips') {
    const item = {
      title: cleanText(body.title), destination: cleanText(body.destination), category: cleanText(body.category),
      duration: cleanText(body.duration), days: clampInteger(body.days || parseDays(body.duration) || 1, 1, 365),
      price: Math.max(Number(body.price || 0), 0), currency: cleanCurrency(body.currency || 'USD'),
      summary: cleanText(body.summary), imageUrl: cleanText(body.imageUrl), featured: Boolean(body.featured), active: body.active !== false
    };
    requireFields(item, ['title', 'destination', 'summary']);
    return item;
  }
  if (collection === 'posts') {
    const item = {
      title: cleanText(body.title), author: cleanText(body.author || 'Explore Bloom & Beyond Team'),
      publishedAt: cleanDate(body.publishedAt), excerpt: cleanText(body.excerpt), imageUrl: cleanText(body.imageUrl), content: cleanText(body.content)
    };
    requireFields(item, ['title', 'excerpt']);
    return item;
  }
  if (collection === 'socials') {
    const item = { platform: cleanText(body.platform), handle: cleanText(body.handle), url: cleanText(body.url) };
    requireFields(item, ['platform', 'url']);
    return item;
  }
  throw Object.assign(new Error('Unknown collection.'), { statusCode: 404 });
}

async function insertContent(collection, id, item) {
  if (collection === 'destinations') {
    const r = await query(`INSERT INTO destinations (id, name, region, summary, image_url, featured) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [id,item.name,item.region,item.summary,item.imageUrl,item.featured]); return r.rows[0];
  }
  if (collection === 'trips') {
    const r = await query(`INSERT INTO trips (id,title,destination,category,duration,days,price,currency,summary,image_url,featured,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [id,item.title,item.destination,item.category,item.duration,item.days,item.price,item.currency,item.summary,item.imageUrl,item.featured,item.active]); return r.rows[0];
  }
  if (collection === 'posts') {
    const r = await query(`INSERT INTO posts (id,title,author,published_at,excerpt,image_url,content) VALUES ($1,$2,$3,$4::date,$5,$6,$7) RETURNING *`, [id,item.title,item.author,item.publishedAt || null,item.excerpt,item.imageUrl,item.content]); return r.rows[0];
  }
  const r = await query(`INSERT INTO socials (id,platform,handle,url) VALUES ($1,$2,$3,$4) RETURNING *`, [id,item.platform,item.handle,item.url]); return r.rows[0];
}

async function updateContent(collection, id, item) {
  let r;
  if (collection === 'destinations') r = await query(`UPDATE destinations SET name=$1,region=$2,summary=$3,image_url=$4,featured=$5,updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *`, [item.name,item.region,item.summary,item.imageUrl,item.featured,id]);
  else if (collection === 'trips') r = await query(`UPDATE trips SET title=$1,destination=$2,category=$3,duration=$4,days=$5,price=$6,currency=$7,summary=$8,image_url=$9,featured=$10,active=$11,updated_at=CURRENT_TIMESTAMP WHERE id=$12 RETURNING *`, [item.title,item.destination,item.category,item.duration,item.days,item.price,item.currency,item.summary,item.imageUrl,item.featured,item.active,id]);
  else if (collection === 'posts') r = await query(`UPDATE posts SET title=$1,author=$2,published_at=$3::date,excerpt=$4,image_url=$5,content=$6,updated_at=CURRENT_TIMESTAMP WHERE id=$7 RETURNING *`, [item.title,item.author,item.publishedAt || null,item.excerpt,item.imageUrl,item.content,id]);
  else r = await query(`UPDATE socials SET platform=$1,handle=$2,url=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$4 RETURNING *`, [item.platform,item.handle,item.url,id]);
  return r.rows[0] || null;
}

function mapDestination(row) {
  return { id: row.id, name: row.name, region: row.region, summary: row.summary, imageUrl: row.image_url, featured: row.featured };
}
function mapTrip(row) {
  return { id: row.id, title: row.title, destination: row.destination, category: row.category, duration: row.duration, days: Number(row.days), price: Number(row.price), currency: row.currency, summary: row.summary, imageUrl: row.image_url, featured: row.featured, active: row.active };
}
function mapPost(row) {
  return { id: row.id, title: row.title, author: row.author, publishedAt: row.published_at, excerpt: row.excerpt, imageUrl: row.image_url, content: row.content };
}
function mapSocial(row) {
  return { id: row.id, platform: row.platform, handle: row.handle, url: row.url };
}
function mapCollectionRow(collection, row) {
  if (collection === 'destinations') return mapDestination(row);
  if (collection === 'trips') return mapTrip(row);
  if (collection === 'posts') return mapPost(row);
  return mapSocial(row);
}
function mapBooking(row) {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    requestType: row.request_type,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    nationality: row.nationality,
    destination: row.destination,
    tripId: row.trip_id,
    tripTitle: row.trip_title,
    trip: row.trip_title,
    travelers: Number(row.travelers),
    days: Number(row.days),
    startDate: row.start_date,
    message: row.message,
    source: row.source,
    status: row.status,
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    paymentStatus: row.payment_status,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    payments: Array.isArray(row.payments) ? row.payments : []
  };
}
function mapPayment(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    provider: row.provider,
    merchantReference: row.merchant_reference,
    orderTrackingId: row.order_tracking_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    paymentMethod: row.payment_method,
    confirmationCode: row.confirmation_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapChatMessage(row) {
  return { id: row.id, sender: row.sender, text: row.text, createdAt: row.created_at };
}

function validateRegistration({ fullName, email, phone, password }) {
  if (fullName.length < 2) throw badRequest('Enter your full name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw badRequest('Enter a valid email address.');
  if (phone.length < 7) throw badRequest('Enter a valid phone number.');
  validatePassword(password);
}
function validatePassword(password) {
  if (password.length < 8) throw badRequest('Password must be at least 8 characters.');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) throw badRequest('Password must include a letter and a number.');
}
function requireFields(item, fields) {
  const missing = fields.filter((field) => !item[field]);
  if (missing.length) throw badRequest(`Missing required field(s): ${missing.join(', ')}`);
}
function badRequest(message) {
  const error = new Error(message); error.statusCode = 400; return error;
}
function cleanCurrency(value) {
  const currency = String(value || 'USD').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
}
function cleanDate(value) {
  const text = cleanText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}
function clampInteger(value, min, max) {
  const number = Math.round(Number(value || min));
  return Math.min(Math.max(Number.isFinite(number) ? number : min, min), max);
}
function parseDays(duration = '') {
  const match = String(duration).match(/\d+/); return match ? Number(match[0]) : 0;
}
function inferCountryCode(nationality = '') {
  const value = String(nationality).toLowerCase();
  if (value.includes('kenya')) return 'KE';
  if (value.includes('tanzania')) return 'TZ';
  if (value.includes('rwanda')) return 'RW';
  if (value.includes('burundi')) return 'BI';
  return 'UG';
}
function getPublicUrl(req) {
  return String(process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = { app, start };
