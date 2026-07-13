CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  nationality VARCHAR(80) NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS destinations (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  region VARCHAR(120) NOT NULL DEFAULT '',
  summary TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  destination VARCHAR(180) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT '',
  duration VARCHAR(80) NOT NULL DEFAULT '',
  days INTEGER NOT NULL DEFAULT 1 CHECK (days >= 1),
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  summary TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  author VARCHAR(160) NOT NULL DEFAULT 'Explore Bloom & Beyond Team',
  published_at DATE,
  excerpt TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS socials (
  id VARCHAR(100) PRIMARY KEY,
  platform VARCHAR(80) NOT NULL,
  handle VARCHAR(160) NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  reference VARCHAR(32) NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_type VARCHAR(20) NOT NULL DEFAULT 'inquiry' CHECK (request_type IN ('inquiry', 'booking')),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  nationality VARCHAR(80) NOT NULL DEFAULT '',
  destination VARCHAR(180) NOT NULL DEFAULT '',
  trip_id VARCHAR(100) REFERENCES trips(id) ON DELETE SET NULL,
  trip_title VARCHAR(220) NOT NULL DEFAULT '',
  travelers INTEGER NOT NULL DEFAULT 1 CHECK (travelers >= 1),
  days INTEGER NOT NULL DEFAULT 1 CHECK (days >= 1),
  start_date DATE,
  message TEXT NOT NULL DEFAULT '',
  source VARCHAR(100) NOT NULL DEFAULT 'website',
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'confirmed', 'completed', 'cancelled')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  payment_status VARCHAR(24) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'reversed')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider VARCHAR(40) NOT NULL DEFAULT 'pesapal',
  merchant_reference VARCHAR(80) NOT NULL UNIQUE,
  order_tracking_id VARCHAR(120),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'reversed')),
  payment_method VARCHAR(80) NOT NULL DEFAULT '',
  confirmation_code VARCHAR(120) NOT NULL DEFAULT '',
  raw_response JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visitor_name VARCHAR(120) NOT NULL,
  visitor_email VARCHAR(254) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('visitor', 'admin')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL DEFAULT '',
  entity_id VARCHAR(120) NOT NULL DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_submitted_at ON bookings(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_tracking_id ON payments(order_tracking_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
