/**
 * Godabaya Tailor — Auth Provider (Akun Customer)
 *
 * Akun customer memakai Nomor WhatsApp + PIN (tanpa OTP/email).
 * Autentikasi kini melalui backend REST bersama (server/index.js) sehingga
 * data customer & pesanan dibagikan antara website customer dan aplikasi admin.
 * Token sesi disimpan sementara (selama tab/aplikasi terbuka).
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Customer } from '@/types';
import { normalizeWhatsApp } from '@/utils/phone';
import { getSession, saveSession, clearSession } from '@/utils/session';
import { apiRequest, setToken } from '@/utils/api';

const SESSION_KEY = 'session_customer_token';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pulihkan sesi dari token tersimpan (berlaku selama tab/aplikasi terbuka)
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const storedToken = await getSession(SESSION_KEY);
        if (!storedToken) return;
        setToken('customer', storedToken);
        const res = await apiRequest<{ customer: Customer | null }>('/api/me', { role: 'customer' });
        if (active && res.customer) {
          setCustomer(res.customer);
        } else if (active) {
          setToken('customer', null);
          await clearSession(SESSION_KEY);
        }
      } catch {
        setToken('customer', null);
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

  const register = useCallback(async (name: string, whatsapp: string, pin: string): Promise<Customer> => {
    const wa = normalizeWhatsApp(whatsapp);
    if (!wa) throw new Error('Nomor WhatsApp harus diisi');

    const res = await apiRequest<{ token: string; customer: Customer }>(
      '/api/customer/register',
      { method: 'POST', body: { name: name.trim(), whatsapp: wa, pin: pin.trim() } }
    );
    setToken('customer', res.token);
    await saveSession(SESSION_KEY, res.token);
    setCustomer(res.customer);
    return res.customer;
  }, []);

  const login = useCallback(async (whatsapp: string, pin: string): Promise<Customer> => {
    const wa = normalizeWhatsApp(whatsapp);
    if (!wa) throw new Error('Nomor WhatsApp harus diisi');

    const res = await apiRequest<{ token: string; customer: Customer }>(
      '/api/customer/login',
      { method: 'POST', body: { whatsapp: wa, pin: pin.trim() } }
    );
    setToken('customer', res.token);
    await saveSession(SESSION_KEY, res.token);
    setCustomer(res.customer);
    return res.customer;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/customer/logout', { method: 'POST', role: 'customer' });
    } catch {
      // abaikan kegagalan jaringan saat logout
    }
    setToken('customer', null);
    setCustomer(null);
    await clearSession(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ customer, isLoading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
