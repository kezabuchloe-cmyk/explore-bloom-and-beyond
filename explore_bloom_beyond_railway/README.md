# Explore Bloom & Beyond Booking Platform

A Railway-ready Node.js and PostgreSQL booking platform for Explore Bloom & Beyond.

## Included

- Existing travel website, hero slider, destinations, trips, blog, contact forms, logo, and phone number
- Customer registration, login, logout, profile updates, password resets, and booking dashboard
- Guest inquiries that are claimed automatically when the customer registers with the same email
- Booking references, package quotes, booking statuses, payment statuses, and customer cancellations
- Admin and staff dashboard for bookings, customers, payments, support chats, website content, and summary reports
- PostgreSQL storage instead of `data/db.json`
- Pesapal API 3.0 checkout, callback status checks, and IPN processing
- Safe mock checkout for local testing
- Railway-compatible `PORT` handling, health check, graceful shutdown, environment variables, and database initialization

## Local preview

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
```

For a zero-setup local test, edit `.env` and use:

```env
NODE_ENV=development
JWT_SECRET=0123456789012345678901234567890123456789
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongPass123!
PAYMENTS_MODE=mock
```

Then run:

```bash
npm start
```

Open `http://localhost:3000`.

When `DATABASE_URL` is absent in development, the application uses a temporary in-memory PostgreSQL-compatible database. It resets whenever the server restarts. Railway production must use PostgreSQL.

## Railway production variables

Set these on the application service:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PUBLIC_URL=https://your-project.up.railway.app
JWT_SECRET=use-a-long-random-secret-at-least-32-characters
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=use-a-strong-private-password
ADMIN_NAME=Explore Bloom Administrator
PAYMENTS_MODE=pesapal
PESAPAL_ENV=sandbox
PESAPAL_CONSUMER_KEY=your-key
PESAPAL_CONSUMER_SECRET=your-secret
```

`PESAPAL_IPN_ID` is optional. When omitted, the app registers `${PUBLIC_URL}/api/payments/pesapal/ipn` automatically and caches the returned IPN ID while the process is running.

## Payment modes

- `disabled`: payment buttons return a configuration message.
- `mock`: internal test checkout; never use it to represent real payment in production.
- `pesapal`: real Pesapal API integration. Use `PESAPAL_ENV=sandbox` during testing and `PESAPAL_ENV=live` after merchant approval.

The application never stores card or mobile-money credentials. Customers are redirected to Pesapal checkout.

## Email setup

Password reset email works when these values are configured:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=Explore Bloom & Beyond <bookings@example.com>
BOOKINGS_EMAIL=bookings@example.com
```

Without SMTP in development, the forgot-password API returns a development reset URL. In production it always returns a generic response and does not expose the token.

## Roles

- `customer`: sees only personal bookings and payments.
- `staff`: manages bookings and support conversations.
- `admin`: additionally manages users, roles, destinations, trips, posts, and social links.

## Useful commands

```bash
npm start
npm run check
npm test
npm audit
npm run migrate
npm run create-admin -- admin@example.com StrongPass123! "Admin Name"
```

## Important launch checks

1. Change the example administrator password.
2. Use a unique JWT secret.
3. Keep `PAYMENTS_MODE=pesapal` for real payments.
4. Test Pesapal sandbox checkout and IPN updates before switching to live.
5. Configure SMTP and test password resets.
6. Generate the Railway public domain and set the exact HTTPS address in `PUBLIC_URL`.
7. Back up PostgreSQL regularly.
