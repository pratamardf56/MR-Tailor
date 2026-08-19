/**
 * Godabaya Tailor — Reset Akun
 *
 * Menghapus semua akun customer (nomor WhatsApp + PIN) dan mereset ulang
 * akun admin penjahit ke kredensial default. Pesanan, portofolio, harga,
 * dan pengaturan bisnis tetap tersimpan.
 */

import { useCallback } from 'react';
import { useDatabase } from '@/database/provider';
import { hashPin, randomHex } from '@/utils/pin';
import { clearSession } from '@/utils/session';
import { DEFAULT_TAILOR, TAILOR_PIN_PREFIX } from '@/auth/TailorAuthContext';

const CUSTOMER_SESSION = 'session_customer_id';
const TAILOR_SESSION = 'session_tailor_id';

export function useAccountReset() {
  const { db } = useDatabase();

  const resetAccounts = useCallback(async (): Promise<void> => {
    if (!db) throw new Error('Database tidak siap');

    // Hapus semua akun customer
    await db.runAsync('DELETE FROM customers;');

    // Lepaskan relasi booking lama agar bisa ter-link ulang saat customer baru daftar
    await db.runAsync('UPDATE bookings SET customer_id = NULL;');

    // Reset akun admin penjahit ke default (username + PIN bawaan)
    await db.runAsync('DELETE FROM tailor_accounts;');
    const salt = randomHex(16);
    const hash = await hashPin(DEFAULT_TAILOR.pin, salt, TAILOR_PIN_PREFIX);
    await db.runAsync(
      'INSERT INTO tailor_accounts (username, pin_hash, pin_salt, name) VALUES (?, ?, ?, ?)',
      [DEFAULT_TAILOR.username, hash, salt, DEFAULT_TAILOR.name]
    );

    // Bersihkan sesi login (customer & penjahit)
    await db.runAsync('DELETE FROM settings WHERE key IN (?, ?);', [CUSTOMER_SESSION, TAILOR_SESSION]);
    await clearSession(CUSTOMER_SESSION);
    await clearSession(TAILOR_SESSION);
  }, [db]);

  return { resetAccounts };
}