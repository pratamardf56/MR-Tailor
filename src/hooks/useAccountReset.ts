/**
 * Godabaya Tailor — Reset Akun
 *
 * Menghapus semua akun customer (nomor WhatsApp + PIN) melalui backend
 * REST bersama (server/index.js). Pesanan, portofolio, harga, dan
 * pengaturan bisnis tetap tersimpan. Akun admin penjahit tidak dihapus.
 */

import { useCallback } from 'react';
import { apiRequest } from '@/utils/api';

export function useAccountReset() {
  const resetAccounts = useCallback(async (): Promise<void> => {
    await apiRequest('/api/admin/reset-accounts', { method: 'POST', role: 'tailor' });
  }, []);

  return { resetAccounts };
}
