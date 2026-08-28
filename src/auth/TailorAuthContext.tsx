/**
 * Godabaya Tailor — Tailor (Admin) Auth Provider
 *
 * Akun penjahit terpisah dari customer: Username (nomor WhatsApp) + PIN.
 * Autentikasi kini melalui backend REST bersama (server/index.js). Token
 * sesi disimpan sementara (hanya selama tab/aplikasi terbuka); saat keluar
 * atau menutup aplikasi, penjahit harus login lagi.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSession, saveSession, clearSession } from '@/utils/session';
import { apiRequest, setToken } from '@/utils/api';

const SESSION_KEY = 'session_tailor_token';
export const TAILOR_PIN_PREFIX = 'godabaya-tailor-pin';

// Kredensial default penjahit (dibuat/di-seed oleh backend jika belum ada)
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

export function TailorAuthProvider({ children }: { children: React.ReactNode }) {
  const [tailor, setTailor] = useState<TailorAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pulihkan sesi penjahit dari token tersimpan (selama tab/aplikasi terbuka)
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const storedToken = await getSession(SESSION_KEY);
        if (!storedToken) return;
        setToken('tailor', storedToken);
        const res = await apiRequest<{ tailor: TailorAccount | null }>('/api/tailor/me', { role: 'tailor' });
        if (active && res.tailor) {
          setTailor(res.tailor);
        } else if (active) {
          setToken('tailor', null);
          await clearSession(SESSION_KEY);
        }
      } catch {
        setToken('tailor', null);
        await clearSession(SESSION_KEY);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, []);

  const loginTailor = useCallback(async (username: string, pin: string): Promise<TailorAccount> => {
    // Bersihkan format penulisan (tanda hubung/spasi) agar cocok di backend
    const user = username.trim().replace(/[\s-]/g, '').toLowerCase();
    if (!user) throw new Error('Username harus diisi');

    const res = await apiRequest<{ token: string; tailor: TailorAccount }>(
      '/api/tailor/login',
      { method: 'POST', body: { username: user, pin: pin.trim() } }
    );
    setToken('tailor', res.token);
    await saveSession(SESSION_KEY, res.token);
    setTailor(res.tailor);
    return res.tailor;
  }, []);

  const logoutTailor = useCallback(async () => {
    try {
      await apiRequest('/api/tailor/logout', { method: 'POST', role: 'tailor' });
    } catch {
      // abaikan kegagalan jaringan saat logout
    }
    setToken('tailor', null);
    setTailor(null);
    await clearSession(SESSION_KEY);
  }, []);

  return (
    <TailorAuthContext.Provider value={{ tailor, isLoading, loginTailor, logoutTailor }}>
      {children}
    </TailorAuthContext.Provider>
  );
}
