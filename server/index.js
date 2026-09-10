/**
 * Godabaya Tailor — Backend Server (REST API + SQLite bersama)
 *
 * Server tanpa dependency (Node >= 22.5) memakai node:sqlite + node:http.
 * Database tunggal yang dipakai bersama seluruh device (web & HP).
 *
 * Jalankan: node server/index.js   (default port 3001)
 */

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MAX_BODY_BYTES = 40 * 1024 * 1024; // 40MB (foto reference/portfolio base64)

// Daftar origin yang diizinkan (dipisah koma). Kosong / '*' = izinkan semua
// (hanya untuk pengembangan). Untuk produksi, isi domain website customer.
// Contoh: ALLOWED_ORIGINS=https://godabaya-tailor.vercel.app
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOW_ALL_ORIGINS = ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes('*');

// Kredensial admin penjahit (dari env agar tidak hardcode di produksi).
// Ganti ADMIN_PIN dengan PIN kuat sebelum go-public.
const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || 'admin').replace(/[\s-]/g, '');
const ADMIN_PIN = String(process.env.ADMIN_PIN || '9999');
const ADMIN_NAME = String(process.env.ADMIN_NAME || 'Penjahit');

// Rate limit login (anti brute-force): maks percobaan per window per IP.
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 8;
const LOGIN_WINDOW_MS = Number(process.env.LOGIN_WINDOW_MS) || 15 * 60 * 1000; // 15 menit

// Umur maksimal sesi (hari). Sesi lebih tua dianggap kedaluwarsa.
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS) || 30;

// Panjang minimal password akun customer.
const MIN_PASSWORD_LENGTH = 6;

fs.mkdirSync(DATA_DIR, { recursive: true });

// ============ Database ============
const db = new DatabaseSync(path.join(DATA_DIR, 'godabaya_tailor.db'));
db.exec('PRAGMA journal_mode = WAL;');

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_start INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  estimation TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL DEFAULT '',
  pin_salt TEXT NOT NULL DEFAULT '',
  email TEXT,
  password_hash TEXT,
  password_salt TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tailor_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  customer_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  requested_date TEXT NOT NULL,
  proposed_date TEXT,
  reference_photo TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  tailor_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_uri TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Lainnya',
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  target TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  ref_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const SEED_SERVICES_SQL = `
INSERT OR IGNORE INTO services (id, name, category, price_start, description, estimation) VALUES
  (1, 'Jahit Baju', 'Jahit Baju', 75000, 'Pembuatan baju baru sesuai model dan ukuran yang diinginkan pelanggan.', '3-5 hari'),
  (2, 'Jahit Celana', 'Jahit Celana', 80000, 'Pembuatan celana baru dengan ukuran dan model sesuai keinginan.', '3-5 hari'),
  (3, 'Permak Baju', 'Permak Baju', 20000, 'Penyesuaian ukuran baju agar lebih pas dan nyaman dipakai.', '1-2 hari'),
  (4, 'Permak Celana', 'Permak Celana', 20000, 'Penyesuaian ukuran celana sesuai kebutuhan pelanggan.', '1-2 hari'),
  (5, 'Jahit Seragam', 'Seragam', 100000, 'Pembuatan seragam sekolah, kantor, atau organisasi dalam jumlah satuan maupun banyak.', '5-7 hari'),
  (6, 'Custom Pakaian', 'Custom', 0, 'Pembuatan pakaian dengan desain khusus sesuai permintaan. Hubungi kami untuk konsultasi dan harga.', 'Konsultasi');
`;

const SEED_SETTINGS_SQL = `
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('business_name', 'Godabaya Tailor'),
  ('whatsapp', ''),
  ('address', 'Godabaya, Sukadana, Malausma, Majalengka, Jawa Barat, Indonesia'),
  ('open_hour', '08:00'),
  ('close_hour', '17:00'),
  ('booking_counter', '0');
`;

db.exec(CREATE_TABLES_SQL);

// Migrasi additive: kolom customer_id (aman bila sudah ada)
try {
  db.exec('ALTER TABLE bookings ADD COLUMN customer_id INTEGER;');
} catch {
  // sudah ada
}

// Migrasi additive akun customer (email + password).
// Data lama (whatsapp + pin_hash/pin_salt) TIDAK dihapus agar booking lama tetap utuh.
for (const sql of [
  'ALTER TABLE customers ADD COLUMN email TEXT;',
  'ALTER TABLE customers ADD COLUMN password_hash TEXT;',
  'ALTER TABLE customers ADD COLUMN password_salt TEXT;',
]) {
  try {
    db.exec(sql);
  } catch {
    // kolom sudah ada
  }
}

// Email unik (case-insensitive), tetapi customer lama tanpa email tetap diizinkan.
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email ON customers (lower(email)) WHERE email IS NOT NULL;');
} catch {
  // index sudah ada / tidak didukung
}

db.exec(SEED_SERVICES_SQL);
db.exec(SEED_SETTINGS_SQL);

// Akun penjahit default (dari env ADMIN_USERNAME / ADMIN_PIN / ADMIN_NAME).
// Menggantikan akun lama 'penjahit'.
(function seedTailor() {
  const DEFAULT_TAILOR = { username: ADMIN_USERNAME, pin: ADMIN_PIN, name: ADMIN_NAME };
  const PIN_PREFIX = 'godabaya-tailor-pin';

  function hashPin(pin, salt, prefix) {
    return crypto.createHash('sha256').update(`${prefix}:${salt}:${pin.trim()}`).digest('hex');
  }

  const existing = db.prepare('SELECT * FROM tailor_accounts WHERE username = ?').get(DEFAULT_TAILOR.username);
  if (existing) {
    if (hashPin(DEFAULT_TAILOR.pin, existing.pin_salt, PIN_PREFIX) !== existing.pin_hash) {
      const salt = crypto.randomBytes(16).toString('hex');
      db.prepare('UPDATE tailor_accounts SET pin_hash = ?, pin_salt = ?, name = ? WHERE id = ?')
        .run(hashPin(DEFAULT_TAILOR.pin, salt, PIN_PREFIX), salt, DEFAULT_TAILOR.name, existing.id);
    }
  } else {
    const salt = crypto.randomBytes(16).toString('hex');
    db.prepare('INSERT INTO tailor_accounts (username, pin_hash, pin_salt, name) VALUES (?, ?, ?, ?)')
      .run(DEFAULT_TAILOR.username, hashPin(DEFAULT_TAILOR.pin, salt, PIN_PREFIX), salt, DEFAULT_TAILOR.name);
  }
  db.prepare('DELETE FROM tailor_accounts WHERE username = ?').run('penjahit');
  // Migrasi username lama -> hapus jika sudah diganti via .env (mis. 081214386602 -> admin)
  if (DEFAULT_TAILOR.username !== '081214386602') {
    db.prepare('DELETE FROM tailor_accounts WHERE username = ?').run('081214386602');
  }
})();

// ============ Helpers ============
function all(sql, params) { return db.prepare(sql).all(...(params || [])); }
function get(sql, params) { return db.prepare(sql).get(...(params || [])); }
function run(sql, params) { return db.prepare(sql).run(...(params || [])); }

function hashPin(pin, salt, prefix) {
  return crypto.createHash('sha256').update(`${prefix}:${salt}:${pin.trim()}`).digest('hex');
}

// ---- Password akun customer (email + password) ----
// Disimpan sebagai scrypt hash + salt acak. Password asli tidak pernah disimpan.
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), String(salt), 64).toString('hex');
}

function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(String(expectedHash), 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function newSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function normalizeWa(wa) { return String(wa || '').replace(/\D/g, ''); }

function waVariants(digits) {
  const clean = normalizeWa(digits);
  if (!clean) return [];
  const set = new Set([clean]);
  if (clean.startsWith('0')) {
    set.add('62' + clean.slice(1));
    set.add('+62' + clean.slice(1));
  } else if (clean.startsWith('62')) {
    set.add('0' + clean.slice(2));
    set.add('+' + clean);
  } else if (clean.startsWith('+62')) {
    set.add(clean.slice(1));
    set.add('0' + clean.slice(3));
  }
  return Array.from(set);
}

function newToken() { return crypto.randomBytes(32).toString('hex'); }

function bookingCode(seq) {
  const year = new Date().getFullYear();
  return `GDY-${year}-${String(seq).padStart(5, '0')}`;
}

function rowToBooking(r) {
  if (!r) return null;
  return {
    id: r.id,
    code: r.code,
    customerId: r.customer_id ?? null,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    serviceType: r.service_type,
    description: r.description,
    requestedDate: r.requested_date,
    proposedDate: r.proposed_date ?? null,
    referencePhoto: r.reference_photo ?? null,
    notes: r.notes ?? null,
    status: r.status,
    rejectionReason: r.rejection_reason ?? null,
    tailorNotes: r.tailor_notes ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToService(r) {
  return {
    id: r.id, name: r.name, category: r.category, priceStart: r.price_start,
    description: r.description, estimation: r.estimation, isActive: r.is_active === 1, createdAt: r.created_at,
  };
}

function rowToPortfolio(r) {
  return {
    id: r.id, imageUri: r.image_uri, category: r.category,
    description: r.description ?? null, createdAt: r.created_at,
  };
}

function rowToNotification(r) {
  return {
    id: r.id, bookingId: r.booking_id ?? null, type: r.type, title: r.title,
    message: r.message, isRead: r.is_read === 1, target: r.target, createdAt: r.created_at,
  };
}

function rowToCustomer(r) {
  if (!r) return null;
  // Password/PIN tidak pernah dikirim ke frontend.
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? null,
    whatsapp: r.whatsapp,
    createdAt: r.created_at,
  };
}

// ============ HTTP ============
// CORS dinamis: pantulkan origin bila diizinkan (mendukung kredensial/preflight).
function corsHeaders(req) {
  const origin = req.headers.origin;
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
  if (ALLOW_ALL_ORIGINS) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  // Bila origin tidak diizinkan: header Allow-Origin tidak dikirim → browser blokir.
  return headers;
}

function send(res, status, data, req) {
  const body = JSON.stringify(data);
  const cors = req ? corsHeaders(req) : (res._cors || {});
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...cors });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload terlalu besar'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) { resolve({}); return; }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Body JSON tidak valid'));
      }
    });
    req.on('error', reject);
  });
}

function bearerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

// Rate limiter sederhana in-memory untuk endpoint login (anti brute-force).
const loginAttempts = new Map(); // key -> { count, resetAt }

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkLoginRate(req) {
  const key = clientIp(req);
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= LOGIN_MAX_ATTEMPTS;
}

function resetLoginRate(req) {
  loginAttempts.delete(clientIp(req));
}

// Autentikasi: validasi token; kembalikan session role 'customer' | 'tailor'
function requireRole(req, res, role) {
  const token = bearerToken(req);
  const s = token ? get('SELECT * FROM sessions WHERE token = ?', [token]) : null;
  if (!s || s.role !== role) {
    send(res, 401, { error: 'Akses ditolak. Silakan login terlebih dahulu.' });
    return null;
  }
  // Sesi kedaluwarsa → hapus dan tolak.
  const expired = get(
    "SELECT 1 AS x FROM sessions WHERE token = ? AND created_at <= datetime('now', ?)",
    [token, `-${SESSION_TTL_DAYS} days`]
  );
  if (expired) {
    run('DELETE FROM sessions WHERE token = ?', [token]);
    send(res, 401, { error: 'Sesi berakhir. Silakan login kembali.' });
    return null;
  }
  return { token, session: s };
}

/**
 * Varian requireRole tanpa mengirim respons (untuk endpoint yang menerima
 * dua peran sekaligus, mis. customer ATAU tailor).
 */
function tryRole(req, role) {
  const token = bearerToken(req);
  if (!token) return null;
  const s = get('SELECT * FROM sessions WHERE token = ?', [token]);
  if (!s || s.role !== role) return null;
  const expired = get(
    "SELECT 1 AS x FROM sessions WHERE token = ? AND created_at <= datetime('now', ?)",
    [token, `-${SESSION_TTL_DAYS} days`]
  );
  if (expired) {
    run('DELETE FROM sessions WHERE token = ?', [token]);
    return null;
  }
  return { token, session: s };
}

function createSession(role, refId) {
  const token = newToken();
  run('INSERT INTO sessions (token, role, ref_id) VALUES (?, ?, ?)', [token, role, refId]);
  return token;
}

/**
 * Hubungkan booking lama tanpa customer_id ke akun ini berdasarkan nomor WA.
 * Dipakai saat login/registrasi oleh admin agar data lama tetap terlihat.
 */
function linkLegacyBookings(customerId, whatsapp) {
  const variants = waVariants(whatsapp);
  if (variants.length === 0) return;
  run(
    `UPDATE bookings SET customer_id = ? WHERE customer_id IS NULL AND customer_phone IN (${variants.map(() => '?').join(', ')})`,
    [customerId, ...variants]
  );
}

/** Ambil customer berdasarkan email (case-insensitive). */
function findCustomerByEmail(email) {
  return get('SELECT * FROM customers WHERE lower(email) = ?', [normalizeEmail(email)]);
}

// ============ Server ============
const server = http.createServer(async (req, res) => {
  try {
    // Simpan header CORS untuk request ini agar dipakai semua respons.
    res._cors = corsHeaders(req);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, res._cors);
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]

    // Kesehatan server
    if (req.method === 'GET' && url.pathname === '/health') {
      send(res, 200, { ok: true });
      return;
    }

    if (parts[0] !== 'api') {
      send(res, 404, { error: 'Not found' });
      return;
    }

    const method = req.method;
    const body = ['POST', 'PUT'].includes(method) ? await readBody(req) : {};

    // ---------- Customer auth ----------
    // Registrasi mandiri — publik bisa daftar sendiri dengan email berbeda
    if (method === 'POST' && parts[1] === 'customer' && parts[2] === 'register') {
      if (!checkLoginRate(req)) {
        return send(res, 429, { error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
      }
      const name = String(body.name || '').trim();
      const email = normalizeEmail(body.email);
      const wa = normalizeWa(body.whatsapp || body.phone || '');
      const password = String(body.password || '');
      if (!name) return send(res, 400, { error: 'Nama wajib diisi.' });
      if (!isValidEmail(email)) return send(res, 400, { error: 'Format email tidak valid.' });
      if (!wa) return send(res, 400, { error: 'Nomor WhatsApp wajib diisi.' });
      if (password.length < MIN_PASSWORD_LENGTH) {
        return send(res, 400, { error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.` });
      }
      if (findCustomerByEmail(email)) {
        return send(res, 400, { error: 'Email sudah terdaftar. Silakan login.' });
      }
      const variants = waVariants(wa);
      const existingWa = get(`SELECT * FROM customers WHERE whatsapp IN (${variants.map(() => '?').join(', ')})`, variants);
      if (existingWa) {
        return send(res, 400, { error: 'Nomor WhatsApp sudah dipakai akun lain.' });
      }
      const salt = newSalt();
      const hash = hashPassword(password, salt);
      const result = run(
        'INSERT INTO customers (name, whatsapp, email, password_hash, password_salt, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, wa, email, hash, salt, '', '']
      );
      const id = Number(result.lastInsertRowid);
      linkLegacyBookings(id, wa);
      resetLoginRate(req);
      const token = createSession('customer', id);
      const row = get('SELECT * FROM customers WHERE id = ?', [id]);
      return send(res, 201, { token, customer: rowToCustomer(row) });
    }

    // Login customer: email + password.
    if (method === 'POST' && parts[1] === 'customer' && parts[2] === 'login') {
      if (!checkLoginRate(req)) {
        return send(res, 429, { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' });
      }
      const email = normalizeEmail(body.email ?? body.username);
      const password = String(body.password ?? '');
      if (!email || !password) {
        return send(res, 400, { error: 'Email dan password harus diisi.' });
      }

      let row = findCustomerByEmail(email);
      // Auto-registrasi: jika email belum ada, buat akun otomatis langsung dari halaman login
      if (!row) {
        if (password.length < MIN_PASSWORD_LENGTH) {
          return send(res, 400, { error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.` });
        }
        // Nama dari email, WA dummy unik (bisa diubah nanti di profil)
        const baseName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() || 'Customer';
        const name = baseName.charAt(0).toUpperCase() + baseName.slice(1);
        let wa;
        for (let i = 0; i < 5; i++) {
          wa = '08' + String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 90) + 10);
          const dup = get('SELECT id FROM customers WHERE whatsapp = ?', [wa]);
          if (!dup) break;
        }
        const salt = newSalt();
        const hash = hashPassword(password, salt);
        const result = run(
          'INSERT INTO customers (name, whatsapp, email, password_hash, password_salt, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [name, wa, email, hash, salt, '', '']
        );
        const id = Number(result.lastInsertRowid);
        linkLegacyBookings(id, wa);
        resetLoginRate(req);
        const token = createSession('customer', id);
        const created = get('SELECT * FROM customers WHERE id = ?', [id]);
        return send(res, 201, { token, customer: rowToCustomer(created), autoRegistered: true });
      }
      if (!row.password_hash || !row.password_salt) {
        return send(res, 400, { error: 'Akun belum memiliki password. Hubungi penjahit.' });
      }
      if (!verifyPassword(password, row.password_salt, row.password_hash)) {
        return send(res, 400, { error: 'Email atau password salah.' });
      }

      resetLoginRate(req);
      linkLegacyBookings(row.id, row.whatsapp);
      const token = createSession('customer', row.id);
      return send(res, 200, { token, customer: rowToCustomer(row) });
    }

    // Unified login (admin or customer)
    if (method === 'POST' && parts[1] === 'login' && parts.length === 2) {
      if (!checkLoginRate(req)) {
        return send(res, 429, { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' });
      }
      const rawUser = String(body.username || body.email || '').trim();
      const password = String(body.password || '').trim();
      if (!rawUser || !password) {
        return send(res, 400, { error: 'Username/Email dan kata sandi harus diisi.' });
      }

      // 1. Try Tailor
      const tailorUser = rawUser.replace(/[\s-]/g, '').toLowerCase();
      const tailorRow = get('SELECT * FROM tailor_accounts WHERE lower(username) = ?', [tailorUser]);
      if (tailorRow && hashPin(password, tailorRow.pin_salt, 'godabaya-tailor-pin') === tailorRow.pin_hash) {
        resetLoginRate(req);
        const token = createSession('tailor', tailorRow.id);
        return send(res, 200, {
          token,
          role: 'tailor',
          user: { id: tailorRow.id, username: tailorRow.username, name: tailorRow.name },
        });
      }

      // 2. Try Customer (Login or Auto-Register for any email)
      const email = normalizeEmail(rawUser);
      if (email && email.includes('@')) {
        const customerRow = findCustomerByEmail(email);
        if (customerRow) {
          if (customerRow.password_hash && customerRow.password_salt) {
            if (verifyPassword(password, customerRow.password_salt, customerRow.password_hash)) {
              resetLoginRate(req);
              linkLegacyBookings(customerRow.id, customerRow.whatsapp);
              const token = createSession('customer', customerRow.id);
              return send(res, 200, { token, role: 'customer', user: rowToCustomer(customerRow) });
            }
            return send(res, 400, { error: 'Kata sandi salah.' });
          }
        } else {
          // Auto-create new customer account seamlessly
          if (password.length < 3) {
            return send(res, 400, { error: 'Kata sandi minimal 3 karakter.' });
          }
          const salt = newSalt();
          const hash = hashPassword(password, salt);
          const namePart = rawUser.split('@')[0];
          const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          const dummyWa = '08' + Math.floor(100000000 + Math.random() * 900000000);
          const dummyPinHash = hashPin('1234', salt, 'godabaya-tailor-pin');

          const resInsert = run(
            'INSERT INTO customers (name, whatsapp, email, password_hash, password_salt, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [formattedName, dummyWa, email, hash, salt, dummyPinHash, salt]
          );
          const id = Number(resInsert.lastInsertRowid);

          resetLoginRate(req);
          const token = createSession('customer', id);
          const created = get('SELECT * FROM customers WHERE id = ?', [id]);
          return send(res, 200, { token, role: 'customer', user: rowToCustomer(created) });
        }
      }

      return send(res, 400, { error: 'Email/Username atau kata sandi salah.' });
    }

    if (method === 'POST' && parts[1] === 'customer' && parts[2] === 'logout') {
      const token = bearerToken(req);
      if (token) run('DELETE FROM sessions WHERE token = ?', [token]);
      return send(res, 200, { ok: true });
    }

    // Profil customer yang sedang login (/api/customer/me & /api/me).
    if (
      method === 'GET' &&
      ((parts[1] === 'customer' && parts[2] === 'me') || (parts[1] === 'me' && parts.length === 2))
    ) {
      const auth = requireRole(req, res, 'customer');
      if (!auth) return;
      const c = get('SELECT * FROM customers WHERE id = ?', [auth.session.ref_id]);
      return send(res, 200, { customer: rowToCustomer(c) });
    }

    // Ubah data profil sendiri (nama & nomor WhatsApp).
    if (method === 'PUT' && parts[1] === 'customer' && parts[2] === 'me' && parts.length === 3) {
      const auth = requireRole(req, res, 'customer');
      if (!auth) return;
      const current = get('SELECT * FROM customers WHERE id = ?', [auth.session.ref_id]);
      if (!current) return send(res, 401, { error: 'Akun tidak ditemukan' });

      const fields = [];
      const values = [];
      if (body.name !== undefined) {
        const name = String(body.name).trim();
        if (!name) return send(res, 400, { error: 'Nama tidak boleh kosong.' });
        fields.push('name = ?');
        values.push(name);
      }
      if (body.whatsapp !== undefined) {
        const wa = normalizeWa(body.whatsapp);
        if (!wa) return send(res, 400, { error: 'Nomor WhatsApp tidak valid.' });
        const dup = get('SELECT id FROM customers WHERE whatsapp = ? AND id != ?', [wa, current.id]);
        if (dup) return send(res, 400, { error: 'Nomor WhatsApp sudah dipakai akun lain.' });
        fields.push('whatsapp = ?');
        values.push(wa);
      }
      if (fields.length === 0) return send(res, 200, { customer: rowToCustomer(current) });

      values.push(current.id);
      run(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
      const updated = get('SELECT * FROM customers WHERE id = ?', [current.id]);
      linkLegacyBookings(updated.id, updated.whatsapp);
      return send(res, 200, { customer: rowToCustomer(updated) });
    }

    // Ubah password sendiri (wajib menyertakan password lama).
    if (method === 'POST' && parts[1] === 'customer' && parts[2] === 'change-password') {
      const auth = requireRole(req, res, 'customer');
      if (!auth) return;
      const row = get('SELECT * FROM customers WHERE id = ?', [auth.session.ref_id]);
      if (!row) return send(res, 401, { error: 'Akun tidak ditemukan' });

      const currentPassword = String(body.currentPassword ?? '');
      const newPassword = String(body.newPassword ?? '');
      if (!verifyPassword(currentPassword, row.password_salt, row.password_hash)) {
        return send(res, 400, { error: 'Password saat ini salah.' });
      }
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return send(res, 400, { error: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.` });
      }
      const salt = newSalt();
      run('UPDATE customers SET password_hash = ?, password_salt = ? WHERE id = ?', [
        hashPassword(newPassword, salt),
        salt,
        row.id,
      ]);
      // Sesi lain milik akun ini dicabut; sesi saat ini tetap berlaku.
      run("DELETE FROM sessions WHERE role = 'customer' AND ref_id = ? AND token != ?", [row.id, auth.token]);
      return send(res, 200, { ok: true });
    }

    // ---------- Tailor auth ----------
    if (method === 'POST' && parts[1] === 'tailor' && parts[2] === 'login') {
      if (!checkLoginRate(req)) {
        return send(res, 429, { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' });
      }
      const user = String(body.username || '').trim().replace(/[\s-]/g, '').toLowerCase();
      const pin = String(body.pin || '').trim();
      if (!user) return send(res, 400, { error: 'Username harus diisi' });
      const row = get('SELECT * FROM tailor_accounts WHERE lower(username) = ?', [user]);
      if (!row) return send(res, 400, { error: 'Akun penjahit tidak ditemukan.' });
      if (hashPin(pin, row.pin_salt, 'godabaya-tailor-pin') !== row.pin_hash) {
        return send(res, 400, { error: 'PIN salah.' });
      }
      resetLoginRate(req);
      const token = createSession('tailor', row.id);
      return send(res, 200, {
        token,
        tailor: { id: row.id, username: row.username, name: row.name },
      });
    }

    if (method === 'POST' && parts[1] === 'tailor' && parts[2] === 'logout') {
      const token = bearerToken(req);
      if (token) run('DELETE FROM sessions WHERE token = ?', [token]);
      return send(res, 200, { ok: true });
    }

    if (method === 'GET' && parts[1] === 'tailor' && parts[2] === 'me') {
      const auth = requireRole(req, res, 'tailor');
      if (!auth) return;
      const t = get('SELECT * FROM tailor_accounts WHERE id = ?', [auth.session.ref_id]);
      return send(res, 200, { tailor: t ? { id: t.id, username: t.username, name: t.name } : null });
    }

    // ---------- Settings ----------
    if (parts[1] === 'settings') {
      if (method === 'GET' && parts.length === 2) {
        const rows = all('SELECT key, value FROM settings');
        const obj = {};
        rows.forEach((r) => { obj[r.key] = r.value; });
        return send(res, 200, obj);
      }
      if (method === 'GET' && parts.length === 3) {
        const row = get('SELECT value FROM settings WHERE key = ?', [parts[2]]);
        return send(res, 200, { value: row ? row.value : '' });
      }
      if (method === 'POST' && parts.length === 2) {
        // Pengaturan bisnis hanya boleh diubah oleh penjahit.
        const tailor = requireRole(req, res, 'tailor');
        if (!tailor) return;
        if (!body.key) return send(res, 400, { error: 'key diperlukan' });
        run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [String(body.key), String(body.value ?? '')]);
        return send(res, 200, { ok: true });
      }
    }

    // ---------- Services ----------
    if (parts[1] === 'services') {
      if (method === 'GET' && parts.length === 2) {
        const activeOnly = url.searchParams.get('active') !== '0';
        const rows = activeOnly
          ? all('SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC')
          : all('SELECT * FROM services ORDER BY id ASC');
        return send(res, 200, { services: rows.map(rowToService) });
      }
      if (method === 'GET' && parts.length === 3) {
        const row = get('SELECT * FROM services WHERE id = ?', [parts[2]]);
        return send(res, 200, { service: row ? rowToService(row) : null });
      }
      const auth = requireRole(req, res, 'tailor');
      if (!auth) return;
      if (method === 'POST' && parts.length === 2) {
        if (!body.name) return send(res, 400, { error: 'Nama layanan wajib diisi' });
        run(
          'INSERT INTO services (name, category, price_start, description, estimation) VALUES (?, ?, ?, ?, ?)',
          [String(body.name), String(body.category || 'Lainnya'), Number(body.priceStart) || 0, String(body.description || ''), String(body.estimation || '')]
        );
        return send(res, 201, { ok: true });
      }
      if (method === 'PUT' && parts.length === 3) {
        const fields = [];
        const values = [];
        if (body.name !== undefined) { fields.push('name = ?'); values.push(String(body.name)); }
        if (body.category !== undefined) { fields.push('category = ?'); values.push(String(body.category)); }
        if (body.priceStart !== undefined) { fields.push('price_start = ?'); values.push(Number(body.priceStart)); }
        if (body.description !== undefined) { fields.push('description = ?'); values.push(String(body.description)); }
        if (body.estimation !== undefined) { fields.push('estimation = ?'); values.push(String(body.estimation)); }
        if (fields.length === 0) return send(res, 200, { ok: true });
        values.push(parts[2]);
        run(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);
        return send(res, 200, { ok: true });
      }
      if (method === 'DELETE' && parts.length === 3) {
        run('UPDATE services SET is_active = 0 WHERE id = ?', [parts[2]]);
        return send(res, 200, { ok: true });
      }
      if (method === 'POST' && parts.length === 4 && parts[3] === 'restore') {
        run('UPDATE services SET is_active = 1 WHERE id = ?', [parts[2]]);
        return send(res, 200, { ok: true });
      }
    }

    // ---------- Portfolio ----------
    if (parts[1] === 'portfolio') {
      if (method === 'GET' && parts.length === 2) {
        const category = url.searchParams.get('category');
        const rows = category && category !== 'Semua'
          ? all('SELECT * FROM portfolio WHERE category = ? ORDER BY created_at DESC', [category])
          : all('SELECT * FROM portfolio ORDER BY created_at DESC');
        return send(res, 200, { portfolio: rows.map(rowToPortfolio) });
      }
      const auth = requireRole(req, res, 'tailor');
      if (!auth) return;
      if (method === 'POST' && parts.length === 2) {
        if (!body.imageUri) return send(res, 400, { error: 'Gambar wajib diisi' });
        run(
          'INSERT INTO portfolio (image_uri, category, description) VALUES (?, ?, ?)',
          [String(body.imageUri), String(body.category || 'Lainnya'), body.description != null ? String(body.description) : null]
        );
        return send(res, 201, { ok: true });
      }
      if (method === 'PUT' && parts.length === 3) {
        const fields = [];
        const values = [];
        if (body.category !== undefined) { fields.push('category = ?'); values.push(String(body.category)); }
        if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description != null ? String(body.description) : null); }
        if (fields.length === 0) return send(res, 200, { ok: true });
        values.push(parts[2]);
        run(`UPDATE portfolio SET ${fields.join(', ')} WHERE id = ?`, values);
        return send(res, 200, { ok: true });
      }
      if (method === 'DELETE' && parts.length === 3) {
        run('DELETE FROM portfolio WHERE id = ?', [parts[2]]);
        return send(res, 200, { ok: true });
      }
    }

    // ---------- Bookings ----------
    if (parts[1] === 'bookings') {
      // Buat booking (wajib login sebagai customer; tanpa PIN)
      if (method === 'POST' && parts.length === 2) {
        const auth = requireRole(req, res, 'customer');
        if (!auth) return;

        // Identitas pemilik booking diambil dari sesi, BUKAN dari body request.
        const account = get('SELECT * FROM customers WHERE id = ?', [auth.session.ref_id]);
        if (!account) return send(res, 401, { error: 'Akun tidak ditemukan' });

        const data = body;
        if (!data.serviceType || !data.requestedDate) {
          return send(res, 400, { error: 'Data booking tidak lengkap.' });
        }

        const customerName = String(data.customerName || account.name).trim() || account.name;
        const phoneInput = normalizeWa(data.customerPhone || account.whatsapp);
        if (!phoneInput) return send(res, 400, { error: 'Nomor WhatsApp tidak valid.' });

        const counter = get('SELECT value FROM settings WHERE key = ?', ['booking_counter']);
        const next = (counter ? parseInt(counter.value, 10) : 0) + 1;
        run('UPDATE settings SET value = ? WHERE key = ?', [String(next), 'booking_counter']);
        const code = bookingCode(next);
        run(
          `INSERT INTO bookings (code, customer_id, customer_name, customer_phone, service_type, description, requested_date, reference_photo, notes, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            code,
            account.id,
            customerName,
            phoneInput,
            String(data.serviceType),
            String(data.description || ''),
            String(data.requestedDate),
            data.referencePhoto != null ? String(data.referencePhoto) : null,
            data.notes != null ? String(data.notes) : null,
          ]
        );
        run(
          `INSERT INTO notifications (booking_id, type, title, message, target)
           VALUES ((SELECT id FROM bookings WHERE code = ?), 'new_booking', 'Booking Baru', ?, 'tailor')`,
          [code, `Pesanan baru dari ${customerName} — ${data.serviceType}`]
        );
        return send(res, 201, { code });
      }

      // Statistik (penjahit)
      if (method === 'GET' && parts.length === 3 && parts[2] === 'stats') {
        const auth = requireRole(req, res, 'tailor');
        if (!auth) return;
        const pending = get("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'");
        const today = get("SELECT COUNT(*) as c FROM bookings WHERE date(created_at) = date('now')");
        const inProgress = get("SELECT COUNT(*) as c FROM bookings WHERE status = 'in_progress'");
        const done = get("SELECT COUNT(*) as c FROM bookings WHERE status IN ('completed', 'picked_up')");
        const total = get('SELECT COUNT(*) as c FROM bookings');
        return send(res, 200, {
          newBookings: pending.c, today: today.c, inProgress: inProgress.c,
          completed: done.c, total: total.c,
        });
      }

      // Booking milik customer
      if (method === 'GET' && parts.length === 3 && parts[2] === 'mine') {
        const auth = requireRole(req, res, 'customer');
        if (!auth) return;
        const c = get('SELECT * FROM customers WHERE id = ?', [auth.session.ref_id]);
        if (!c) return send(res, 401, { error: 'Akun tidak ditemukan' });
        const variants = waVariants(c.whatsapp);
        const placeholders = variants.map(() => '?').join(', ');
        const rows = variants.length > 0
          ? all(
              `SELECT * FROM bookings
               WHERE customer_id = ? OR (customer_id IS NULL AND customer_phone IN (${placeholders}))
               ORDER BY created_at DESC`,
              [c.id, ...variants]
            )
          : all('SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC', [c.id]);
        return send(res, 200, { bookings: rows.map(rowToBooking) });
      }

      // Semua booking (penjahit), opsional filter status
      if (method === 'GET' && parts.length === 2) {
        const auth = requireRole(req, res, 'tailor');
        if (!auth) return;
        const status = url.searchParams.get('status');
        const rows = status
          ? all('SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC', [status])
          : all('SELECT * FROM bookings ORDER BY created_at DESC');
        return send(res, 200, { bookings: rows.map(rowToBooking) });
      }

      // By code (butuh login; customer hanya boleh melihat miliknya sendiri)
      if (method === 'GET' && parts.length === 3 && !/^\d+$/.test(parts[2])) {
        const row = get('SELECT * FROM bookings WHERE code = ?', [parts[2].trim().toUpperCase()]);
        const tailor = tryRole(req, 'tailor');
        if (tailor) return send(res, 200, { booking: rowToBooking(row) });

        const auth = requireRole(req, res, 'customer');
        if (!auth) return;
        if (!row) return send(res, 200, { booking: null });
        if (row.customer_id !== auth.session.ref_id) {
          return send(res, 403, { error: 'Akses ditolak' });
        }
        return send(res, 200, { booking: rowToBooking(row) });
      }

      // By id (penjahit / pemilik)
      if (method === 'GET' && parts.length === 3 && /^\d+$/.test(parts[2])) {
        const row = get('SELECT * FROM bookings WHERE id = ?', [parts[2]]);
        if (!row) return send(res, 404, { error: 'Booking tidak ditemukan' });
        const tailor = tryRole(req, 'tailor');
        if (tailor) return send(res, 200, { booking: rowToBooking(row) });

        const auth = requireRole(req, res, 'customer');
        if (!auth) return;
        if (row.customer_id !== auth.session.ref_id) return send(res, 403, { error: 'Akses ditolak' });
        return send(res, 200, { booking: rowToBooking(row) });
      }

      // Aksi status booking
      if (method === 'POST' && parts.length === 4) {
        const id = parts[2];
        const action = parts[3];
        const row = get('SELECT * FROM bookings WHERE id = ?', [id]);
        if (!row) return send(res, 404, { error: 'Booking tidak ditemukan' });

        if (action === 'accept-date' || action === 'reject-date') {
          const auth = requireRole(req, res, 'customer');
          if (!auth) return;
          if (row.customer_id !== auth.session.ref_id) return send(res, 403, { error: 'Akses ditolak' });
          if (action === 'accept-date') {
            run("UPDATE bookings SET status = 'accepted', updated_at = datetime('now') WHERE id = ?", [id]);
            run(
              `INSERT INTO notifications (booking_id, type, title, message, target)
               VALUES (?, 'customer_accepted_date', 'Tanggal Diterima', 'Pelanggan menerima tanggal alternatif yang diusulkan.', 'tailor')`,
              [id]
            );
          } else {
            run("UPDATE bookings SET status = 'rejected', rejection_reason = 'Pelanggan menolak tanggal alternatif', updated_at = datetime('now') WHERE id = ?", [id]);
          }
          return send(res, 200, { ok: true });
        }

        const auth = requireRole(req, res, 'tailor');
        if (!auth) return;

        if (action === 'accept') {
          run("UPDATE bookings SET status = 'accepted', updated_at = datetime('now') WHERE id = ?", [id]);
          run(
            `INSERT INTO notifications (booking_id, type, title, message, target)
             VALUES (?, 'booking_accepted', 'Pesanan Diterima', 'Pesanan Anda telah diterima oleh penjahit.', 'customer')`,
            [id]
          );
          return send(res, 200, { ok: true });
        }
        if (action === 'propose-date') {
          if (!body.proposedDate) return send(res, 400, { error: 'Tanggal alternatif diperlukan' });
          run(
            "UPDATE bookings SET status = 'date_proposed', proposed_date = ?, tailor_notes = ?, updated_at = datetime('now') WHERE id = ?",
            [String(body.proposedDate), body.notes != null ? String(body.notes) : null, id]
          );
          run(
            `INSERT INTO notifications (booking_id, type, title, message, target)
             VALUES (?, 'date_proposed', 'Tanggal Alternatif', 'Penjahit mengusulkan tanggal lain untuk pesanan Anda.', 'customer')`,
            [id]
          );
          return send(res, 200, { ok: true });
        }
        if (action === 'reject') {
          const reason = String(body.reason || '');
          run(
            "UPDATE bookings SET status = 'rejected', rejection_reason = ?, updated_at = datetime('now') WHERE id = ?",
            [reason, id]
          );
          run(
            `INSERT INTO notifications (booking_id, type, title, message, target)
             VALUES (?, 'booking_rejected', 'Pesanan Ditolak', ?, 'customer')`,
            [id, `Pesanan ditolak. Alasan: ${reason}`]
          );
          return send(res, 200, { ok: true });
        }
        if (action === 'status') {
          const status = String(body.status || '');
          if (!status) return send(res, 400, { error: 'Status diperlukan' });
          run("UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id]);
          let notifType = null;
          let notifTitle = null;
          let notifMessage = null;
          if (status === 'in_progress') {
            notifType = 'work_started'; notifTitle = 'Pesanan Sedang Dikerjakan'; notifMessage = 'Pesanan Anda sedang dalam proses pengerjaan.';
          } else if (status === 'completed') {
            notifType = 'work_completed'; notifTitle = 'Pesanan Selesai'; notifMessage = 'Pesanan Anda telah selesai! Silakan ambil di tempat kami.';
          }
          if (notifType) {
            run(
              `INSERT INTO notifications (booking_id, type, title, message, target)
               VALUES (?, ?, ?, ?, 'customer')`,
              [id, notifType, notifTitle, notifMessage]
            );
          }
          return send(res, 200, { ok: true });
        }
        return send(res, 404, { error: 'Aksi tidak dikenal' });
      }
    }

    // ---------- Notifications ----------
    if (parts[1] === 'notifications') {
      if (method === 'GET' && parts.length === 2) {
        const target = url.searchParams.get('target') || 'customer';
        const auth = requireRole(req, res, target === 'tailor' ? 'tailor' : 'customer');
        if (!auth) return;
        const rows = all(
          'SELECT * FROM notifications WHERE target = ? ORDER BY created_at DESC LIMIT 50',
          [target]
        );
        return send(res, 200, { notifications: rows.map(rowToNotification) });
      }
      if (method === 'GET' && parts.length === 3 && parts[2] === 'unread') {
        const target = url.searchParams.get('target') || 'customer';
        const auth = requireRole(req, res, target === 'tailor' ? 'tailor' : 'customer');
        if (!auth) return;
        const row = get('SELECT COUNT(*) as c FROM notifications WHERE target = ? AND is_read = 0', [target]);
        return send(res, 200, { count: row.c });
      }
      if (method === 'POST' && parts.length === 4 && parts[3] === 'read') {
        const anyAuth = tryRole(req, 'customer') || tryRole(req, 'tailor');
        if (!anyAuth) return send(res, 401, { error: 'Akses ditolak. Silakan login terlebih dahulu.' });
        run('UPDATE notifications SET is_read = 1 WHERE id = ?', [parts[2]]);
        return send(res, 200, { ok: true });
      }
      if (method === 'POST' && parts.length === 3 && parts[2] === 'read-all') {
        const target = String(body.target || 'customer');
        const auth = requireRole(req, res, target === 'tailor' ? 'tailor' : 'customer');
        if (!auth) return;
        run('UPDATE notifications SET is_read = 1 WHERE target = ?', [target]);
        return send(res, 200, { ok: true });
      }
    }

    // ---------- Customers (penjahit) ----------
    if (parts[1] === 'customers') {
      // Daftar customer
      if (method === 'GET' && parts.length === 2) {
        const auth = requireRole(req, res, 'tailor');
        if (!auth) return;
        const rows = all(
          `SELECT c.id, c.name, c.email, c.whatsapp, c.created_at,
                  (c.password_hash IS NOT NULL AND c.password_hash != '') AS has_password,
                  (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) AS booking_count
           FROM customers c
           ORDER BY c.created_at DESC`
        );
        return send(res, 200, {
          customers: rows.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email ?? null,
            whatsapp: r.whatsapp,
            created_at: r.created_at,
            has_password: r.has_password === 1,
            booking_count: r.booking_count,
          })),
        });
      }

      // Tambah akun customer (hanya admin/penjahit)
      if (method === 'POST' && parts.length === 2) {
        const auth = requireRole(req, res, 'tailor');
        if (!auth) return;

        const name = String(body.name || '').trim();
        const email = normalizeEmail(body.email);
        const wa = normalizeWa(body.whatsapp);
        const password = String(body.password ?? '');

        if (!name) return send(res, 400, { error: 'Nama wajib diisi.' });
        if (!isValidEmail(email)) return send(res, 400, { error: 'Format email tidak valid.' });
        if (!wa) return send(res, 400, { error: 'Nomor WhatsApp wajib diisi.' });
        if (password.length < MIN_PASSWORD_LENGTH) {
          return send(res, 400, { error: `Password sementara minimal ${MIN_PASSWORD_LENGTH} karakter.` });
        }
        if (findCustomerByEmail(email)) {
          return send(res, 400, { error: 'Email sudah dipakai akun customer lain.' });
        }

        // Nomor WA sudah pernah dipakai (mis. customer lama tanpa email):
        // lengkapi akun lama, jangan buat duplikat & jangan hapus data.
        const variants = waVariants(wa);
        const existing = get(
          `SELECT * FROM customers WHERE whatsapp IN (${variants.map(() => '?').join(', ')})`,
          variants
        );

        const salt = newSalt();
        const hash = hashPassword(password, salt);

        if (existing) {
          if (existing.email && normalizeEmail(existing.email) !== email) {
            return send(res, 400, {
              error: `Nomor WhatsApp ini sudah terdaftar dengan email ${existing.email}.`,
            });
          }
          run('UPDATE customers SET name = ?, email = ?, password_hash = ?, password_salt = ? WHERE id = ?', [
            name,
            email,
            hash,
            salt,
            existing.id,
          ]);
          linkLegacyBookings(existing.id, existing.whatsapp);
          const updated = get('SELECT * FROM customers WHERE id = ?', [existing.id]);
          return send(res, 200, { customer: rowToCustomer(updated), linkedExisting: true });
        }

        const result = run(
          'INSERT INTO customers (name, whatsapp, email, password_hash, password_salt, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [name, wa, email, hash, salt, '', '']
        );
        const id = Number(result.lastInsertRowid);
        linkLegacyBookings(id, wa);
        return send(res, 201, { customer: rowToCustomer(get('SELECT * FROM customers WHERE id = ?', [id])) });
      }

      // Ubah akun customer / reset password (hanya admin/penjahit)
      if (method === 'PUT' && parts.length === 3 && /^\d+$/.test(parts[2])) {
        const auth = requireRole(req, res, 'tailor');
        if (!auth) return;
        const target = get('SELECT * FROM customers WHERE id = ?', [parts[2]]);
        if (!target) return send(res, 404, { error: 'Customer tidak ditemukan' });

        const fields = [];
        const values = [];

        if (body.name !== undefined) {
          const name = String(body.name).trim();
          if (!name) return send(res, 400, { error: 'Nama tidak boleh kosong.' });
          fields.push('name = ?');
          values.push(name);
        }
        if (body.email !== undefined) {
          const email = normalizeEmail(body.email);
          if (!isValidEmail(email)) return send(res, 400, { error: 'Format email tidak valid.' });
          const dup = findCustomerByEmail(email);
          if (dup && dup.id !== target.id) {
            return send(res, 400, { error: 'Email sudah dipakai akun customer lain.' });
          }
          fields.push('email = ?');
          values.push(email);
        }
        if (body.whatsapp !== undefined) {
          const wa = normalizeWa(body.whatsapp);
          if (!wa) return send(res, 400, { error: 'Nomor WhatsApp tidak valid.' });
          const dup = get('SELECT id FROM customers WHERE whatsapp = ? AND id != ?', [wa, target.id]);
          if (dup) return send(res, 400, { error: 'Nomor WhatsApp sudah dipakai akun lain.' });
          fields.push('whatsapp = ?');
          values.push(wa);
        }

        let passwordChanged = false;
        if (body.password !== undefined && String(body.password) !== '') {
          const password = String(body.password);
          if (password.length < MIN_PASSWORD_LENGTH) {
            return send(res, 400, { error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.` });
          }
          const salt = newSalt();
          fields.push('password_hash = ?', 'password_salt = ?');
          values.push(hashPassword(password, salt), salt);
          passwordChanged = true;
        }

        if (fields.length === 0) return send(res, 200, { customer: rowToCustomer(target) });

        values.push(target.id);
        run(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
        if (passwordChanged) {
          // Paksa login ulang setelah password direset admin.
          run("DELETE FROM sessions WHERE role = 'customer' AND ref_id = ?", [target.id]);
        }
        const updated = get('SELECT * FROM customers WHERE id = ?', [target.id]);
        linkLegacyBookings(updated.id, updated.whatsapp);
        return send(res, 200, { customer: rowToCustomer(updated) });
      }
    }

    // ---------- Reset akun (penjahit) ----------
    // Hapus semua customer + lepas relasi booking. Pesanan, layanan,
    // portofolio, dan pengaturan tetap tersimpan.
    if (method === 'POST' && parts[1] === 'admin' && parts[2] === 'reset-accounts') {
      const auth = requireRole(req, res, 'tailor');
      if (!auth) return;
      run('DELETE FROM customers;');
      run('UPDATE bookings SET customer_id = NULL;');
      // Hapus seluruh sesi customer yang masih aktif
      run("DELETE FROM sessions WHERE role = 'customer';");
      return send(res, 200, { ok: true });
    }

    send(res, 404, { error: 'Endpoint tidak ditemukan' });
  } catch (error) {
    console.error('Server error:', error);
    if (!res.headersSent) {
      send(res, 500, { error: 'Terjadi kesalahan server: ' + (error && error.message ? error.message : 'unknown') });
    }
  }
});

server.listen(PORT, () => {
  console.log(`Godabaya Tailor API berjalan di http://0.0.0.0:${PORT}`);
});
