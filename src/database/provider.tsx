/**
 * Godabaya Tailor — Database Provider
 * Uses expo-sqlite for local persistence
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'godabaya_tailor.db';

interface DatabaseContextType {
  db: SQLite.SQLiteDatabase | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isReady: false,
});

export function useDatabase() {
  return useContext(DatabaseContext);
}

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

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    let dbInstance: SQLite.SQLiteDatabase | null = null;

    async function initDatabase() {
      try {
        const database = await SQLite.openDatabaseAsync(DB_NAME);

        if (!active) {
          await database.closeAsync();
          return;
        }
        dbInstance = database;

        // Enable WAL mode for better performance (not supported on web/OPFS)
        if (Platform.OS !== 'web') {
          await database.execAsync('PRAGMA journal_mode = WAL;');
        }

        // Create tables
        await database.execAsync(CREATE_TABLES_SQL);

        // Migrasi additive: tambahkan kolom customer_id ke tabel bookings lama (jika belum ada)
        try {
          await database.execAsync('ALTER TABLE bookings ADD COLUMN customer_id INTEGER;');
        } catch {
          // Kolom sudah ada — aman dilewati
        }

        // Seed initial data
        await database.execAsync(SEED_SERVICES_SQL);
        await database.execAsync(SEED_SETTINGS_SQL);

        setDb(database);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }

    initDatabase();

    return () => {
      active = false;
      if (dbInstance) {
        dbInstance.closeAsync().catch(() => {});
      }
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}
