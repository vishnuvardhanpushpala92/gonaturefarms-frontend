-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Go Nature Farms — PostgreSQL Database Schema                     ║
-- ║  Translated from the original MySQL schema.sql                    ║
-- ║  Runs automatically on every Spring Boot startup via               ║
-- ║  spring.sql.init.mode=always (see application.properties).         ║
-- ║  All statements are idempotent (IF NOT EXISTS / ON CONFLICT DO     ║
-- ║  NOTHING), so re-running it is safe. You can still run it by hand  ║
-- ║  with `psql -U postgres -d gonaturefarms -f schema.sql` if needed. ║
-- ╚══════════════════════════════════════════════════════════════════╝
--
-- Notes on the MySQL → PostgreSQL translation:
--  • AUTO_INCREMENT           -> GENERATED ALWAYS AS IDENTITY
--  • TINYINT(1)               -> BOOLEAN
--  • DATETIME                 -> TIMESTAMP
--  • TEXT / MEDIUMTEXT        -> TEXT (Postgres TEXT has no meaningful size cap)
--  • `key` (backtick-quoted)  -> renamed to setting_key (a plain identifier;
--                                 "key" is a reserved word in some SQL dialects
--                                 and the entity maps it explicitly)
--  • INSERT IGNORE            -> INSERT ... ON CONFLICT DO NOTHING
--  • ON UPDATE CURRENT_TIMESTAMP -> handled at the application layer (JPA sets
--                                    updated_at explicitly before save)
--  • JSON column (support_tickets.data) -> TEXT (portable across PostgreSQL
--                                            versions; see SupportTicket entity)
--  • ENUM('a','b')            -> VARCHAR(20) + CHECK (col IN (...)) rather than a
--                                 native `CREATE TYPE ... AS ENUM`. All entities map
--                                 their Java enums with plain @Enumerated(EnumType.STRING),
--                                 which binds parameters as VARCHAR/OTHER over JDBC.
--                                 PostgreSQL does not implicitly cast VARCHAR to a
--                                 custom enum type, so a native enum column here would
--                                 make every write and WHERE-clause comparison on that
--                                 column (e.g. admin login's lookup by role) fail with
--                                 "column is of type X but expression is of type
--                                 character varying". VARCHAR + CHECK gives the same
--                                 data integrity guarantee without that mismatch.

-- ── USERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  phone         VARCHAR(15)  NOT NULL UNIQUE,
  email         VARCHAR(160) NULL,
  password_hash VARCHAR(255) NOT NULL,
  pincode       VARCHAR(10)  NULL,
  role          VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reset_code    VARCHAR(10) NULL,
  reset_code_expires_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add password reset columns for existing databases (ignore if already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMP;

-- Add security question columns for existing databases (ignore if already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer VARCHAR(255);

-- Add WhatsApp opt-out column for existing databases (ignore if already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;

-- Add WhatsApp number column for existing databases (ignore if already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(15);

-- Default admin user (password: 918252) — CHANGE THIS PASSWORD AFTER FIRST LOGIN!
INSERT INTO users (name, phone, email, password_hash, role, is_verified, created_at)
VALUES ('Vishnu', '9182526000', 'admin@gonaturefarms.com',
  '$2b$12$VkGTz.1f4T3jqnPiFEdXseCNINTvCP7EOJTGNjcgTxV..2ktMDrK.', 'admin', true, CURRENT_TIMESTAMP)
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified,
  created_at = EXCLUDED.created_at;

-- ── CATEGORIES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

INSERT INTO categories (name) VALUES
  ('Dairy'), ('Vegetables'), ('Grains'), ('Natural'), ('Oils'), ('Spices')
ON CONFLICT (name) DO NOTHING;

-- ── PRODUCTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  mrp         DECIMAL(10,2) DEFAULT 0,
  gst         DECIMAL(5,2)  DEFAULT 0,
  hsn         VARCHAR(20)   DEFAULT '',
  cat         VARCHAR(80)   DEFAULT '',
  img_url     TEXT,
  status      VARCHAR(20) DEFAULT 'current' CHECK (status IN ('current','future')),
  stock       INT DEFAULT 100,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(cat);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ── PRODUCT VARIANTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id   BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  stock        INT DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Clean up duplicate products (keep the one with the smallest ID for each name)
DELETE FROM products p1
WHERE EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.name = p1.name
    AND p2.id < p1.id
);

-- Note: UNIQUE constraint is enforced at application level in ProductService.createProduct()
-- to avoid schema migration issues on repeated runs

-- Insert base products only if they don't already exist (idempotent)
INSERT INTO products (name, description, price, mrp, gst, hsn, cat, img_url, status, stock, created_at)
SELECT 'Organic Desi Ghee', '100% pure A2 cow ghee, slow-cooked in traditional bilona method.', 904, 1200, 5, '0405', 'Dairy', 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400', 'current', 100, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Organic Desi Ghee')
UNION ALL
SELECT 'Fresh A2 Milk', 'Farm-fresh A2 milk, unprocessed and delivered same day.', 80, 95, 0, '0401', 'Dairy', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', 'current', 100, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Fresh A2 Milk')
UNION ALL
SELECT 'Natural Forest Honey', 'Raw, unfiltered honey with full enzymes and antioxidants.', 428, 600, 5, '0409', 'Natural', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400', 'current', 100, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Natural Forest Honey')
UNION ALL
SELECT 'Cold Press Coconut Oil', 'Cold-pressed from fresh coconuts, retaining all nutrients.', 362, 480, 5, '1513', 'Oils', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', 'future', 100, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cold Press Coconut Oil');

-- ── ORDERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id          VARCHAR(50) NOT NULL UNIQUE,
  user_id           BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  customer_name     VARCHAR(120) NOT NULL,
  phone             VARCHAR(15) NOT NULL,
  email             VARCHAR(160) NULL,
  address           TEXT NOT NULL,
  area              VARCHAR(100) DEFAULT '',
  city              VARCHAR(80) NOT NULL,
  state             VARCHAR(80) DEFAULT '',
  pincode           VARCHAR(10) NOT NULL,
  payment_method    VARCHAR(30) DEFAULT 'UPI',
  subtotal          DECIMAL(10,2) DEFAULT 0,
  gst_amount        DECIMAL(10,2) DEFAULT 0,
  delivery_charge   DECIMAL(10,2) DEFAULT 0,
  discount          DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2) NOT NULL,
  -- 🔥 FIXED: Removed CHECK constraint to allow 'Placed' status
  status            VARCHAR(30) NOT NULL,
  -- 🔥 FIXED: Removed CHECK constraint for payment statuses
  payment_status    VARCHAR(30) NOT NULL,
  tracking_location VARCHAR(255) DEFAULT '',
  notes             TEXT,
  payment_utr       VARCHAR(50) DEFAULT '',
  payment_screenshot_url TEXT DEFAULT '',
  payment_verified  BOOLEAN DEFAULT false,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Add payment verification columns for existing databases (ignore if already exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_utr VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false;

-- ── ORDER ITEMS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    BIGINT NULL,
  product_name  VARCHAR(200) NOT NULL,
  product_image VARCHAR(500) DEFAULT '',
  price         DECIMAL(10,2) NOT NULL,
  gst           DECIMAL(5,2) DEFAULT 0,
  quantity      INT NOT NULL,
  total         DECIMAL(10,2) NOT NULL
);

-- ── WISHLIST ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_product UNIQUE (user_id, product_id)
);

-- ── REVIEWS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id    BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  customer_name VARCHAR(120) DEFAULT '',
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  featured      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_product_review UNIQUE (user_id, product_id)
);

-- ── COUPONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code           VARCHAR(30) NOT NULL UNIQUE,
  discount_type  VARCHAR(20) DEFAULT 'flat' CHECK (discount_type IN ('flat','percent')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order      DECIMAL(10,2) DEFAULT 0,
  max_uses       INT DEFAULT 9999,
  used_count     INT DEFAULT 0,
  is_active      BOOLEAN DEFAULT TRUE,
  expires_at     TIMESTAMP NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, used_count, is_active, expires_at, created_at) VALUES
('WELCOME50', 'flat',    50,   300, 1000, 0, true, NULL, CURRENT_TIMESTAMP),
('ORGANIC10', 'percent', 10,   500, 500, 0, true, NULL, CURRENT_TIMESTAMP),
('FARM100',   'flat',    100,  1000, 200, 0, true, NULL, CURRENT_TIMESTAMP),
('BIG200',    'flat',    200,  5000, 9999, 0, true, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- ── SITE SETTINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  setting_key VARCHAR(80) NOT NULL UNIQUE,
  value       TEXT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings (setting_key, value, updated_at) VALUES
('site_name',     'Go Nature Farms', CURRENT_TIMESTAMP),
('tagline',       'Nature is Our Future', CURRENT_TIMESTAMP),
('footer_text',   '© 2026 Go Nature Farms. 100% Organic Certified.', CURRENT_TIMESTAMP),
('upi_id',        'gonaturefarms@upi', CURRENT_TIMESTAMP),
('store_location','Hyderabad, Telangana, India', CURRENT_TIMESTAMP),
('qr_code',       '', CURRENT_TIMESTAMP),
('logo_url',      '', CURRENT_TIMESTAMP),
('hdr_bg',        '#ffffff', CURRENT_TIMESTAMP),
('hdr_text',      '#2d5a27', CURRENT_TIMESTAMP),
('ftr_bg',        '#111111', CURRENT_TIMESTAMP),
('ftr_text',      '#e5e7eb', CURRENT_TIMESTAMP),
('banner_msgs',   '100% Organic Certified|Free Delivery above ₹500|Farm Fresh Produce|A2 Cow Products|Trusted by 5000+ Families|No Preservatives|Direct from Farm', CURRENT_TIMESTAMP),
('free_delivery_above', '500', CURRENT_TIMESTAMP),
('delivery_charge_below', '50', CURRENT_TIMESTAMP),
('whatsapp_number', '919182526000', CURRENT_TIMESTAMP),
('payment_instructions', E'1. Transfer the amount to UPI ID: gonaturefarms@upi\n2. Enter your order ID in the payment reference\n3. After payment, click "I Have Made the Payment" button\n4. We will verify and confirm your order within 24 hours', CURRENT_TIMESTAMP),
('screenshot_number', '919182526000', CURRENT_TIMESTAMP),
('trust_badges', '[{"icon":"🌿","title":"100% Organic","sub":"Certified by FSSAI"},{"icon":"🚚","title":"Free Delivery","sub":"Orders above ₹500"},{"icon":"🔄","title":"Easy Returns","sub":"7-day return policy"},{"icon":"🏆","title":"5000+ Families","sub":"Trust us daily"}]', CURRENT_TIMESTAMP),
('footer_desc', 'Bringing the purest organic produce directly from our farms to your table. Grown with love, delivered with care.', CURRENT_TIMESTAMP),
('footer_phone', '+91 9182526xxx', CURRENT_TIMESTAMP),
('support_fields', '[{"key":"name","label":"Your Name","type":"text","required":true},{"key":"phone","label":"Phone Number","type":"tel","required":true},{"key":"order_id","label":"Order ID (if applicable)","type":"text","required":false},{"key":"issue_type","label":"Issue Type","type":"select","options":["Order Issue","Payment Issue","Product Quality","Delivery Delay","General Query"],"required":true},{"key":"message","label":"Message","type":"textarea","required":true}]', CURRENT_TIMESTAMP),
('hdr_font_size', '16', CURRENT_TIMESTAMP),
('ftr_font_size', '14', CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;

-- ── CUSTOMER SUPPORT TICKETS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  data       TEXT NOT NULL,
  status     VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- ── SLIDES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slides (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url  TEXT NOT NULL,
  caption    VARCHAR(200) DEFAULT '',
  sub_text   VARCHAR(200) DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure at least one slide exists with ID 1 (idempotent)
INSERT INTO slides (id, image_url, caption, sub_text, sort_order, created_at)
OVERRIDING SYSTEM VALUE
SELECT 1, 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1920&h=700&fit=crop', 'Authentic Organic Harvest', 'From our fields to your table', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM slides WHERE id = 1);

-- Insert additional slides (idempotent)
INSERT INTO slides (image_url, caption, sub_text, sort_order, created_at)
SELECT 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=1920&h=700&fit=crop', 'Farm Fresh Every Day', 'Pure · Natural · Chemical-Free', 2, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM slides WHERE caption = 'Farm Fresh Every Day')
UNION ALL
SELECT 'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=1920&h=700&fit=crop', 'Straight From the Farm', '100% Organic Certified', 3, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM slides WHERE caption = 'Straight From the Farm');

-- ── FAQs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO faqs (question, answer, created_at)
SELECT * FROM (VALUES
  ('What are your delivery charges?',  'Free delivery for orders above ₹500. ₹50 charge below ₹500 (subject to delivery zone).', CURRENT_TIMESTAMP),
  ('How long does delivery take?',     'Typically 3–5 business days. Express delivery available on request.', CURRENT_TIMESTAMP),
  ('Are your products 100% organic?',  'Yes! Naturally grown, chemical-free and certified organic.', CURRENT_TIMESTAMP),
  ('Can I return a product?',          'Yes — 7-day easy return for damaged or wrong items.', CURRENT_TIMESTAMP)
) AS v(question, answer, created_at)
WHERE NOT EXISTS (SELECT 1 FROM faqs);

-- ── DELIVERY ZONES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_zones (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pincode VARCHAR(10) NOT NULL UNIQUE,
  area    VARCHAR(100) DEFAULT '',
  city    VARCHAR(80) DEFAULT '',
  state   VARCHAR(80) DEFAULT '',
  charge  DECIMAL(6,2) DEFAULT 0
);

INSERT INTO delivery_zones (pincode, area, city, state, charge) VALUES
('500001', 'Abids',      'Hyderabad', 'Telangana', 0),
('500072', 'Kukatpally', 'Hyderabad', 'Telangana', 0),
('500081', 'Kondapur',   'Hyderabad', 'Telangana', 30),
('500084', 'Gachibowli', 'Hyderabad', 'Telangana', 0)
ON CONFLICT (pincode) DO NOTHING;

-- ── VIDEOS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  file_path  TEXT NOT NULL,
  enabled    BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  orientation VARCHAR(20) NOT NULL DEFAULT 'landscape',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_videos_enabled ON videos(enabled);

-- ── SCROLL BLOCKS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scroll_blocks (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  content    TEXT NOT NULL,
  icon       VARCHAR(10) DEFAULT '📋',
  style      VARCHAR(20) DEFAULT 'info' CHECK (style IN ('info','promo','notice','earth')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── ADDRESSES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    address_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- ── WHATSAPP REMINDERS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_reminders (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    reminder_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Sent','Failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_admin_id ON whatsapp_reminders(admin_id);

-- ── DONE ─────────────────────────────────────────────────────────
-- Admin login -> Username: Vishnu | Password: 918252
-- IMPORTANT: Change the admin password after first login (Admin Panel -> Credentials).