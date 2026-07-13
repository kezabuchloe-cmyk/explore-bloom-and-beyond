require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { initializeDatabase, query, normalizeEmail, closePool } = require('../src/db');

(async () => {
  const email = normalizeEmail(process.env.ADMIN_EMAIL || process.argv[2] || '');
  const password = String(process.env.ADMIN_PASSWORD || process.argv[3] || '');
  const fullName = String(process.env.ADMIN_NAME || process.argv[4] || 'Explore Bloom Administrator').trim();

  if (!email || password.length < 10) {
    console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 10 characters, or run: npm run create-admin -- email password "Full Name"');
    process.exit(1);
  }

  try {
    await initializeDatabase();
    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount) {
      await query("UPDATE users SET full_name=$1, password_hash=$2, role='admin', status='active', updated_at=CURRENT_TIMESTAMP WHERE email=$3", [fullName, passwordHash, email]);
      console.log(`Administrator updated: ${email}`);
    } else {
      await query("INSERT INTO users (id, full_name, email, password_hash, role) VALUES ($1,$2,$3,$4,'admin')", [crypto.randomUUID(), fullName, email, passwordHash]);
      console.log(`Administrator created: ${email}`);
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();
