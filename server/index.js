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
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
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

db.exec(SEED_SERVICES_SQL);
db.exec(SEED_SETTINGS_SQL);

// Akun penjahit default: pemegang nomor 0812-1438-6602 / PIN 9999
// (menggantikan akun lama 'penjahit')
(function seedTailor() {
  const DEFAULT_TAILOR = { username: '081214386602', pin: '9999', name: 'Penjahit' };
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
})();

// ============ Helpers ============
function all(sql, params) { return db.prepare(sql).all(...(params || [])); }
function get(sql, params) { return db.prepare(sql).get(...(params || [])); }
function run(sql, params) { return db.prepare(sql).run(...(params || [])); }

function hashPin(pin, salt, prefix) {
  return crypto.createHash('sha256').update(`${prefix}:${salt}:${pin.trim()}`).digest('hex');
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
  return { id: r.id, name: r.name, whatsapp: r.whatsapp, createdAt: r.created_at };
}

// ============ HTTP ============
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS });
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

// Autentikasi: validasi token; kembalikan session role 'customer' | 'tailor'
function requireRole(req, res, role) {
  const token = bearerToken(req);
  const s = token ? get('SELECT * FROM sessions WHERE token = ?', [token]) : null;
  if (!s || s.role !== role) {
    send(res, 401, { error: 'Akses ditolak. Silakan login terlebih dahulu.' });
    return null;
  }
  return { token, session: s };
}

function createSession(role, refId) {
  const token = newToken();
  run('INSERT INTO sessions (token, role, ref_id) VALUES (?, ?, ?)', [token, role, refId]);
  return token;
}

// ============ Server ============
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
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
    if (method === 'POST' && parts[1] === 'customer' && parts[2] === 'register') {
      const name = String(body.name || '').trim();
      const wa = normalizeWa(body.whatsapp);
      const pin = String(body.pin || '').trim();
      if (!name || !wa || !/^\d{4,6}$/.test(pin)) {
        return send(res, 400, { error: 'Data tidak lengkap (nama, nomor WhatsApp, PIN 4-6 angka).' });
      }
      const variants = waVariants(wa);
      const existing = get(
        `SELECT id FROM customers WHERE whatsapp IN (${variants.map(() => '?').join(', ')})`,
        variants
      );
      if (existing) return send(res, 400, { error: 'Nomor WhatsApp sudah terdaftar. Silakan masuk.' });

      const salt = crypto.randomBytes(16).toString('hex');
      const result = run(
        'INSERT INTO customers (name, whatsapp, pin_hash, pin_salt) VALUES (?, ?, ?, ?)',
        [name, wa, hashPin(pin, salt, 'godabaya-customer-pin'), salt]
      );
      const id = Number(result.lastInsertRowid);

      // Link booking lama tanpa akun (08xx vs 628xx)
      if (variants.length > 0) {
        run(
          `UPDATE bookings SET customer_id = ? WHERE customer_id IS NULL AND customer_phone IN (${variants.map(() => '?').join(', ')})`,
          [id, ...variants]
        );
      }

      const token = createSession('customer', id);
      return send(res, 201, { token, customer: rowToCustomer(get('SELECT * FROM customers WHERE id = ?', [id])) });
    }

    if (method === 'POST' && parts[1] === 'customer' && parts[2] === 'login') {
      const wa = normalizeWa(body.whatsapp);
      const pin = String(body.pin || '').trim();
      if (!wa) return send(res, 400, { error: 'Nomor WhatsApp harus diisi' });
      const variants = waVariants(wa);
      const row = get(
        `SELECT * FROM customers WHERE whatsapp IN (${variants.map(() => '?').join(', ')})`,
        variants
      );
      if (!row) return send(res, 400, { error: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' });
      if (hashPin(pin, row.pin_salt, 'godabaya-customer-pin') !== row.pin_hash) {
        return send(res, 400, { error: 'PIN salah.' });
      }
      if (variants.length > 0) {
        run(
          `UPDATE bookings SET customer_id = ? WHERE customer_id IS NULL AND customer_phone IN (${variants.map(() => '?').join(', ')})`,
          [row.id, ...variants]
        );
      }
      const token = createSession('customer', row.id);
      return send(res, 200, { token, customer: rowToCustomer(row) });
    }

    if (method === 'POST' && parts[1] === 'customer' && parts[2] === 'logout') {
      const token = bearerToken(req);
      if (token) run('DELETE FROM sessions WHERE token = ?', [token]);
      return send(res, 200, { ok: true });
    }

    if (method === 'GET' && parts[1] === 'me') {
      const auth = requireRole(req, res, 'customer');
      if (!auth) return;
      const c = get('SELECT * FROM customers WHERE id = ?', [auth.session.ref_id]);
      return send(res, 200, { customer: rowToCustomer(c) });
    }

    // ---------- Tailor auth ----------
    if (method === 'POST' && parts[1] === 'tailor' && parts[2] === 'login') {
      const user = String(body.username || '').trim().replace(/[\s-]/g, '').toLowerCase();
      const pin = String(body.pin || '').trim();
      if (!user) return send(res, 400, { error: 'Username harus diisi' });
      const row = get('SELECT * FROM tailor_accounts WHERE lower(username) = ?', [user]);
      if (!row) return send(res, 400, { error: 'Akun penjahit tidak ditemukan.' });
      if (hashPin(pin, row.pin_salt, 'godabaya-tailor-pin') !== row.pin_hash) {
        return send(res, 400, { error: 'PIN salah.' });
      }
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
        const customer = requireRole(req, res, 'customer');
        if (customer) {
          if (!body.key) return send(res, 400, { error: 'key diperlukan' });
          run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [String(body.key), String(body.value ?? '')]);
          return send(res, 200, { ok: true });
        }
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
      // Buat booking (customer)
      if (method === 'POST' && parts.length === 2) {
        const data = body;
        if (!data.customerName || !data.customerPhone || !data.pin || !data.serviceType || !data.requestedDate) {
          return send(res, 400, { error: 'Data booking tidak lengkap.' });
        }

        const wa = normalizeWa(data.customerPhone);
        if (!wa) return send(res, 400, { error: 'Nomor WhatsApp tidak valid.' });
        const pin = String(data.pin || '').trim();
        if (!/^\d{4,6}$/.test(pin)) return send(res, 400, { error: 'PIN harus 4-6 angka.' });

        const variants = waVariants(wa);
        const existing = get(
          `SELECT * FROM customers WHERE whatsapp IN (${variants.map(() => '?').join(', ')})`,
          variants
        );

        let customerId;
        if (existing) {
          if (hashPin(pin, existing.pin_salt, 'godabaya-customer-pin') !== existing.pin_hash) {
            return send(res, 400, { error: 'Nomor WhatsApp sudah terdaftar dengan PIN berbeda.' });
          }
          customerId = existing.id;
        } else {
          const salt = crypto.randomBytes(16).toString('hex');
          const result = run(
            'INSERT INTO customers (name, whatsapp, pin_hash, pin_salt) VALUES (?, ?, ?, ?)',
            [String(data.customerName), wa, hashPin(pin, salt, 'godabaya-customer-pin'), salt]
          );
          customerId = Number(result.lastInsertRowid);
          
          if (variants.length > 0) {
            run(
              `UPDATE bookings SET customer_id = ? WHERE customer_id IS NULL AND customer_phone IN (${variants.map(() => '?').join(', ')})`,
              [customerId, ...variants]
            );
          }
        }

        const counter = get('SELECT value FROM settings WHERE key = ?', ['booking_counter']);
        const next = (counter ? parseInt(counter.value, 10) : 0) + 1;
        run('UPDATE settings SET value = ? WHERE key = ?', [String(next), 'booking_counter']);
        const code = bookingCode(next);
        run(
          `INSERT INTO bookings (code, customer_id, customer_name, customer_phone, service_type, description, requested_date, reference_photo, notes, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            code,
            customerId,
            String(data.customerName),
            String(data.customerPhone),
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
          [code, `Pesanan baru dari ${data.customerName} — ${data.serviceType}`]
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

      // By code (publik, untuk pelacakan)
      if (method === 'GET' && parts.length === 3 && !/^\d+$/.test(parts[2])) {
        const row = get('SELECT * FROM bookings WHERE code = ?', [parts[2].trim().toUpperCase()]);
        return send(res, 200, { booking: rowToBooking(row) });
      }

      // By id (penjahit / pemilik)
      if (method === 'GET' && parts.length === 3 && /^\d+$/.test(parts[2])) {
        const row = get('SELECT * FROM bookings WHERE id = ?', [parts[2]]);
        if (!row) return send(res, 404, { error: 'Booking tidak ditemukan' });
        const customer = requireRole(req, res, 'customer');
        if (customer) {
          if (row.customer_id === customer.session.ref_id) return send(res, 200, { booking: rowToBooking(row) });
          return send(res, 403, { error: 'Akses ditolak' });
        }
        const tailor = requireRole(req, res, 'tailor');
        if (!tailor) return;
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
        const anyAuth = requireRole(req, res, 'customer') || requireRole(req, res, 'tailor');
        if (!anyAuth) return;
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
    if (method === 'GET' && parts[1] === 'customers') {
      const auth = requireRole(req, res, 'tailor');
      if (!auth) return;
      const rows = all(
        `SELECT c.id, c.name, c.whatsapp, c.created_at,
                (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) AS booking_count
         FROM customers c
         ORDER BY c.created_at DESC`
      );
      return send(res, 200, { customers: rows });
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
