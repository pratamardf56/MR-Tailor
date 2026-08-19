/**
 * Godabaya Tailor — Auth Provider (Akun Customer)
 *
 * Akun customer memakai Nomor WhatsApp + PIN (tanpa OTP/email).
 * PIN di-hash (SHA-256 + salt) sebelum disimpan. Session bersifat
 * sementara (hanya selama tab/browser terbuka); saat keluar atau
 * menutup website, customer harus login lagi.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/database/provider';
import { Customer } from '@/types';
import { normalizeWhatsApp, whatsAppVariants } from '@/utils/phone';
import { hashPin, randomHex } from '@/utils/pin';
import { getSession, saveSession, clearSession } from '@/utils/session';

const SESSION_KEY = 'session_customer_id';
const PIN_PREFIX = 'godabaya-customer-pin';

interface AuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  register: (name: string, whatsapp: string, pin: string) => Promise<Customer>;
  login: (whatsapp: string, pin: string) => Promise<Customer>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  customer: null,
  isLoading: true,
  register: async () => { throw new Error('Auth tidak siap'); },
  login: async () => { throw new Error('Auth tidak siap'); },
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface CustomerRow {
  id: number;
  name: string;
  whatsapp: string;
  pin_hash: string;
  pin_salt: string;
  created_at: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { db, isReady } = useDatabase();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pulihkan session (hanya berlaku selama tab/browser masih terbuka)
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!db || !isReady) return;
      try {
        // Bersihkan sisa session lama yang pernah tersimpan di database
        await db.runAsync('DELETE FROM settings WHERE key = ?', [SESSION_KEY]);

        const storedId = await getSession(SESSION_KEY);
        if (!storedId) return;
        const saved = await db.getFirstAsync<CustomerRow>(
          'SELECT * FROM customers WHERE id = ?',
          [parseInt(storedId, 10)]
        );
        if (active && saved) {
          setCustomer({ id: saved.id, name: saved.name, whatsapp: saved.whatsapp, createdAt: saved.created_at });
        } else if (active) {
          await clearSession(SESSION_KEY);
        }
      } catch (error) {
        console.error('Gagal memulihkan session:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, [db, isReady]);

  const persistSession = useCallback(async (id: number) => {
    await saveSession(SESSION_KEY, String(id));
  }, []);

  const linkLegacyBookings = useCallback(async (customerId: number, wa: string) => {
    if (!db) return;
    const variants = whatsAppVariants(wa);
    if (variants.length === 0) return;
    const placeholders = variants.map(() => '?').join(', ');
    await db.runAsync(
      `UPDATE bookings SET customer_id = ? WHERE customer_id IS NULL AND customer_phone IN (${placeholders})`,
      [customerId, ...variants]
    );
  }, [db]);

  const register = useCallback(async (name: string, whatsapp: string, pin: string): Promise<Customer> => {
    if (!db) throw new Error('Database tidak siap');
    const wa = normalizeWhatsApp(whatsapp);
    if (!wa) throw new Error('Nomor WhatsApp harus diisi');
    const variants = whatsAppVariants(wa);
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM customers WHERE whatsapp IN (${variants.map(() => '?').join(', ')})`,
      variants
    );
    if (existing) {
      throw new Error('Nomor WhatsApp sudah terdaftar. Silakan masuk.');
    }

    const salt = randomHex(16);
    const hash = await hashPin(pin, salt, PIN_PREFIX);
    const result = await db.runAsync(
      'INSERT INTO customers (name, whatsapp, pin_hash, pin_salt) VALUES (?, ?, ?, ?)',
      [name.trim(), wa, hash, salt]
    );
    const id = Number(result.lastInsertRowId);

    await linkLegacyBookings(id, wa);
    await persistSession(id);
    setCustomer({ id, name: name.trim(), whatsapp: wa });
    return { id, name: name.trim(), whatsapp: wa };
  }, [db, linkLegacyBookings, persistSession]);

  const login = useCallback(async (whatsapp: string, pin: string): Promise<Customer> => {
    if (!db) throw new Error('Database tidak siap');
    const wa = normalizeWhatsApp(whatsapp);
    if (!wa) throw new Error('Nomor WhatsApp harus diisi');
    const variants = whatsAppVariants(wa);
    const row = await db.getFirstAsync<CustomerRow>(
      `SELECT * FROM customers WHERE whatsapp IN (${variants.map(() => '?').join(', ')})`,
      variants
    );
    if (!row) throw new Error('Akun tidak ditemukan. Silakan daftar terlebih dahulu.');

    const hash = await hashPin(pin, row.pin_salt, PIN_PREFIX);
    if (hash !== row.pin_hash) {
      throw new Error('PIN salah.');
    }

    await linkLegacyBookings(row.id, row.whatsapp);
    await persistSession(row.id);
    setCustomer({ id: row.id, name: row.name, whatsapp: row.whatsapp, createdAt: row.created_at });
    return { id: row.id, name: row.name, whatsapp: row.whatsapp, createdAt: row.created_at };
  }, [db, linkLegacyBookings, persistSession]);

  const logout = useCallback(async () => {
    setCustomer(null);
    await clearSession(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ customer, isLoading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
