/**
 * Godabaya Tailor — Tailor (Admin) Auth Provider
 *
 * Akun penjahit terpisah dari customer: Username + PIN.
 * PIN di-hash (SHA-256 + salt). Session bersifat sementara (hanya
 * selama tab/browser terbuka); saat keluar atau menutup website,
 * penjahit harus login lagi.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDatabase } from '@/database/provider';
import { hashPin, randomHex } from '@/utils/pin';
import { getSession, saveSession, clearSession } from '@/utils/session';

const SESSION_KEY = 'session_tailor_id';
export const TAILOR_PIN_PREFIX = 'godabaya-tailor-pin';

// Akun penjahit default (pemegang: nomor WhatsApp + PIN), dibuat jika belum ada
export const DEFAULT_TAILOR = {
  username: '081214386602', // 0812-1438-6602 (diketik dengan atau tanpa tanda hubung)
  pin: '9999',
  name: 'Penjahit',
};

export interface TailorAccount {
  id: number;
  username: string;
  name: string;
}

interface TailorAuthContextType {
  tailor: TailorAccount | null;
  isLoading: boolean;
  loginTailor: (username: string, pin: string) => Promise<TailorAccount>;
  logoutTailor: () => Promise<void>;
}

const TailorAuthContext = createContext<TailorAuthContextType>({
  tailor: null,
  isLoading: true,
  loginTailor: async () => { throw new Error('Auth penjahit tidak siap'); },
  logoutTailor: async () => {},
});

export function useTailorAuth() {
  return useContext(TailorAuthContext);
}

interface TailorRow {
  id: number;
  username: string;
  pin_hash: string;
  pin_salt: string;
  name: string;
  created_at: string;
}

export function TailorAuthProvider({ children }: { children: React.ReactNode }) {
  const { db, isReady } = useDatabase();
  const [tailor, setTailor] = useState<TailorAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const seedDefaultAccount = useCallback(async () => {
    if (!db) return;
    const username = DEFAULT_TAILOR.username;
    const existing = await db.getFirstAsync<TailorRow>(
      'SELECT * FROM tailor_accounts WHERE username = ?',
      [username]
    );
    if (existing) {
      const currentHash = await hashPin(DEFAULT_TAILOR.pin, existing.pin_salt, TAILOR_PIN_PREFIX);
      if (currentHash !== existing.pin_hash) {
        const salt = randomHex(16);
        const hash = await hashPin(DEFAULT_TAILOR.pin, salt, TAILOR_PIN_PREFIX);
        await db.runAsync(
          'UPDATE tailor_accounts SET pin_hash = ?, pin_salt = ?, name = ? WHERE id = ?',
          [hash, salt, DEFAULT_TAILOR.name, existing.id]
        );
      }
    } else {
      const salt = randomHex(16);
      const hash = await hashPin(DEFAULT_TAILOR.pin, salt, TAILOR_PIN_PREFIX);
      await db.runAsync(
        'INSERT INTO tailor_accounts (username, pin_hash, pin_salt, name) VALUES (?, ?, ?, ?)',
        [username, hash, salt, DEFAULT_TAILOR.name]
      );
    }
    // Hapus akun default lama ('penjahit') agar hanya nomor pemegang yang berlaku
    await db.runAsync('DELETE FROM tailor_accounts WHERE username = ?', ['penjahit']);
  }, [db]);

  // Pulihkan sesi penjahit (hanya berlaku selama tab/browser terbuka)
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!db || !isReady) return;
      try {
        await seedDefaultAccount();
        // Bersihkan sisa sesi lama yang pernah tersimpan di database
        await db.runAsync('DELETE FROM settings WHERE key = ?', [SESSION_KEY]);

        const storedId = await getSession(SESSION_KEY);
        if (!storedId) return;
        const saved = await db.getFirstAsync<TailorRow>(
          'SELECT * FROM tailor_accounts WHERE id = ?',
          [parseInt(storedId, 10)]
        );
        if (active && saved) {
          setTailor({ id: saved.id, username: saved.username, name: saved.name });
        } else if (active) {
          await clearSession(SESSION_KEY);
        }
      } catch (error) {
        console.error('Gagal memulihkan sesi penjahit:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, [db, isReady, seedDefaultAccount]);

  const persistSession = useCallback(async (id: number) => {
    await saveSession(SESSION_KEY, String(id));
  }, []);

  const loginTailor = useCallback(async (username: string, pin: string): Promise<TailorAccount> => {
    if (!db) throw new Error('Database tidak siap');
    // Tolak format penulisan (tanda hubung/spasi) agar cocok dengan username tersimpan
    const user = username.trim().replace(/[\s-]/g, '').toLowerCase();
    if (!user) throw new Error('Username harus diisi');

    const row = await db.getFirstAsync<TailorRow>(
      'SELECT * FROM tailor_accounts WHERE lower(username) = ?',
      [user]
    );
    if (!row) throw new Error('Akun penjahit tidak ditemukan.');

    const hash = await hashPin(pin, row.pin_salt, TAILOR_PIN_PREFIX);
    if (hash !== row.pin_hash) {
      throw new Error('PIN salah.');
    }

    await persistSession(row.id);
    setTailor({ id: row.id, username: row.username, name: row.name });
    return { id: row.id, username: row.username, name: row.name };
  }, [db, persistSession]);

  const logoutTailor = useCallback(async () => {
    setTailor(null);
    await clearSession(SESSION_KEY);
  }, []);

  return (
    <TailorAuthContext.Provider value={{ tailor, isLoading, loginTailor, logoutTailor }}>
      {children}
    </TailorAuthContext.Provider>
  );
}
