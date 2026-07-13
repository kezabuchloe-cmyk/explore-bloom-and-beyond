# Railway Deployment Guide

## 1. Upload the project to GitHub

1. Extract the ZIP.
2. Create a new GitHub repository.
3. Upload every extracted file and folder. Do not upload only the ZIP.
4. Keep `.env` private. Only `.env.example` should be committed.

## 2. Create the Railway project

1. Sign in to Railway.
2. Choose **New Project**.
3. Choose **Deploy from GitHub repo**.
4. Select the repository containing this project.

Railway should detect the Node.js application and use `npm start` from `package.json`.

## 3. Add PostgreSQL

1. In the same Railway project, select **Create** or **New**.
2. Choose **Database → PostgreSQL**.
3. Open the application service variables.
4. Add:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

The application creates its tables and seeds the destination, trip, blog, and social content during startup.

## 4. Add required variables

```env
NODE_ENV=production
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_NAME=Explore Bloom Administrator
PAYMENTS_MODE=disabled
```

Start with `PAYMENTS_MODE=disabled` until the website and administrator login work.

## 5. Generate the free Railway address

1. Open the application service.
2. Open **Settings → Networking**.
3. Select **Generate Domain**.
4. Copy the full HTTPS address.
5. Add it as:

```env
PUBLIC_URL=https://your-generated-address.up.railway.app
```

Redeploy after changing variables.

## 6. Test the deployment

Open:

- `/` for the website
- `/api/health` for the server and database check
- `/login.html` for traveler login
- `/admin.html` for administration

The administrator account uses `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## 7. Test payments safely

For an internal test checkout, temporarily set:

```env
PAYMENTS_MODE=mock
```

Create a customer account, submit a booking package, open the dashboard, and choose **Pay Now**. The test page clearly states that it does not charge real money.

Never leave mock mode enabled when accepting real payments.

## 8. Configure Pesapal sandbox

Create or obtain Pesapal API 3.0 sandbox credentials, then set:

```env
PAYMENTS_MODE=pesapal
PESAPAL_ENV=sandbox
PESAPAL_CONSUMER_KEY=your-sandbox-key
PESAPAL_CONSUMER_SECRET=your-sandbox-secret
```

The app uses these endpoints automatically:

- Authentication
- IPN registration
- Submit order
- Get transaction status

The callback page is:

```text
https://your-domain/payment-result.html
```

The IPN endpoint is:

```text
https://your-domain/api/payments/pesapal/ipn
```

`PESAPAL_IPN_ID` may be added manually, but it is optional because the application can register the IPN URL.

## 9. Switch to live payments

Only after sandbox testing and merchant approval:

```env
PESAPAL_ENV=live
```

Replace the sandbox key and secret with live credentials. Complete a small controlled payment and confirm that:

- Pesapal redirects to the payment result page.
- The payment appears in the admin dashboard.
- The customer dashboard changes to **paid**.
- The booking changes to **confirmed**.

## 10. Configure email

Add SMTP variables from `.env.example` to enable password-reset emails and new-booking notifications.

## Troubleshooting

### Deployment fails with `DATABASE_URL is required`

Add PostgreSQL to the same Railway project and reference `${{Postgres.DATABASE_URL}}` on the application service.

### Login page works but admin login fails

Confirm `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set on the application service, then redeploy. The first administrator is created during startup.

### Payment button says payments are not enabled

Set `PAYMENTS_MODE=mock` for testing or configure all Pesapal variables and set `PAYMENTS_MODE=pesapal`.

### Pesapal checkout opens but status does not update

Confirm `PUBLIC_URL` exactly matches the public HTTPS domain, then check Railway logs for IPN and transaction-status errors.
