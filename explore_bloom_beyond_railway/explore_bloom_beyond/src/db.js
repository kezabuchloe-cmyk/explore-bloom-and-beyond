const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pool: PgPool } = require('pg');

let pool;
let usingMemoryDatabase = false;

function getPool() {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    const useSsl = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true';
    pool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    });
    pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error:', error));
    return pool;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production. Add a Railway PostgreSQL service and reference its DATABASE_URL.');
  }

  // Local zero-setup preview. Data is intentionally temporary and resets on restart.
  const { newDb } = require('pg-mem');
  const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = memoryDb.adapters.createPg();
  pool = new adapter.Pool();
  usingMemoryDatabase = true;
  console.warn('DATABASE_URL is not set. Using a temporary in-memory PostgreSQL database for local testing.');
  return pool;
}

async function query(text, params = []) {
  return getPool().query(text, params);
}

async function withTransaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function initializeDatabase() {
  const sql = await fs.readFile(path.join(__dirname, '..', 'migrations', '001_init.sql'), 'utf8');
  await query(sql);
  await seedContent();
  await ensureInitialAdmin();
}

async function seedContent() {
  const raw = await fs.readFile(path.join(__dirname, '..', 'seed', 'content.json'), 'utf8');
  const content = JSON.parse(raw);

  await withTransaction(async (client) => {
    for (const item of content.destinations || []) {
      await client.query(
        `INSERT INTO destinations (id, name, region, summary, image_url, featured)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.name, item.region || '', item.summary, item.imageUrl || '', Boolean(item.featured)]
      );
    }

    for (const item of content.trips || []) {
      await client.query(
        `INSERT INTO trips (id, title, destination, category, duration, days, price, currency, summary, image_url, featured, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
         ON CONFLICT (id) DO NOTHING`,
        [
          item.id,
          item.title,
          item.destination,
          item.category || '',
          item.duration || '',
          Math.max(Number(item.days || parseDays(item.duration) || 1), 1),
          Math.max(Number(item.price || 0), 0),
          String(item.currency || 'USD').toUpperCase().slice(0, 3),
          item.summary,
          item.imageUrl || '',
          Boolean(item.featured)
        ]
      );
    }

    for (const item of content.posts || []) {
      await client.query(
        `INSERT INTO posts (id, title, author, published_at, excerpt, image_url, content)
         VALUES ($1, $2, $3, $4::date, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.title, item.author || 'Explore Bloom & Beyond Team', item.publishedAt || null, item.excerpt, item.imageUrl || '', item.content || '']
      );
    }

    for (const item of content.socials || []) {
      await client.query(
        `INSERT INTO socials (id, platform, handle, url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.platform, item.handle || '', item.url]
      );
    }
  });
}

async function ensureInitialAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL || '');
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email || !password) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('ADMIN_EMAIL and ADMIN_PASSWORD are not both set. No initial admin account was created.');
    }
    return;
  }
  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
  }

  const existing = await query('SELECT id, role FROM users WHERE email = $1', [email]);
  if (existing.rowCount) {
    if (existing.rows[0].role !== 'admin') {
      await query("UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP WHERE email = $1", [email]);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (id, full_name, email, phone, nationality, password_hash, role)
     VALUES ($1, $2, $3, '', '', $4, 'admin')`,
    [crypto.randomUUID(), cleanText(process.env.ADMIN_NAME || 'Explore Bloom Administrator'), email, passwordHash]
  );
  console.log(`Initial administrator created for ${email}.`);
}

async function audit(actorUserId, action, entityType = '', entityId = '', details = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [crypto.randomUUID(), actorUserId || null, cleanText(action), cleanText(entityType), cleanText(entityId), JSON.stringify(details || {})]
    );
  } catch (error) {
    console.error('Could not write audit log:', error.message);
  }
}

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

function cleanText(value = '') {
  return String(value ?? '').trim();
}

function parseDays(duration = '') {
  const match = String(duration).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function isUsingMemoryDatabase() {
  return usingMemoryDatabase;
}

async function closePool() {
  if (pool) await pool.end();
}

module.exports = {
  query,
  withTransaction,
  initializeDatabase,
  audit,
  normalizeEmail,
  cleanText,
  isUsingMemoryDatabase,
  closePool
};
