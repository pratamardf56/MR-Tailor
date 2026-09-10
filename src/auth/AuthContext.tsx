/**
 * Godabaya Tailor — Auth Provider (Akun Customer)
 *
 * Akun customer memakai Email + Password. Customer TIDAK dapat mendaftar
 * sendiri: akun dibuat oleh admin/penjahit melalui dashboard.
 * Autentikasi melalui backend REST bersama (server/index.js) sehingga
 * data customer & pesanan dibagikan antara website customer dan aplikasi admin.
 * Token sesi disimpan sementara (selama tab/aplikasi terbuka).
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Customer } from '@/types';
import { normalizeWhatsApp } from '@/utils/phone';
import { getSession, saveSession, clearSession } from '@/utils/session';
import { apiRequest, setToken } from '@/utils/api';

const SESSION_KEY = 'session_customer_token';

interface UpdateProfileInput {
  name?: string;
  whatsapp?: string;
}

interface AuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Customer>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<Customer>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setCustomerSession: (token: string, customer: Customer) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  customer: null,
  isLoading: true,
  login: async () => { throw new Error('Auth tidak siap'); },
  logout: async () => {},
  updateProfile: async () => { throw new Error('Auth tidak siap'); },
  changePassword: async () => { throw new Error('Auth tidak siap'); },
  setCustomerSession: async () => { throw new Error('Auth tidak siap'); },
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
        const res = await apiRequest<{ customer: Customer | null }>('/api/customer/me', { role: 'customer' });
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

  const login = useCallback(async (email: string, password: string): Promise<Customer> => {
    const mail = email.trim().toLowerCase();
    if (!mail) throw new Error('Email harus diisi');
    if (!password) throw new Error('Password harus diisi');

    const res = await apiRequest<{ token: string; customer: Customer }>(
      '/api/customer/login',
      { method: 'POST', body: { email: mail, password } }
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

  const updateProfile = useCallback(async (data: UpdateProfileInput): Promise<Customer> => {
    const body: Record<string, string> = {};
    if (data.name !== undefined) body.name = data.name.trim();
    if (data.whatsapp !== undefined) body.whatsapp = normalizeWhatsApp(data.whatsapp);

    const res = await apiRequest<{ customer: Customer }>('/api/customer/me', {
      method: 'PUT',
      role: 'customer',
      body,
    });
    setCustomer(res.customer);
    return res.customer;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiRequest('/api/customer/change-password', {
      method: 'POST',
      role: 'customer',
      body: { currentPassword, newPassword },
    });
  }, []);

  const setCustomerSession = useCallback(async (token: string, newCustomer: Customer) => {
    setToken('customer', token);
    await saveSession(SESSION_KEY, token);
    setCustomer(newCustomer);
  }, []);

  return (
    <AuthContext.Provider value={{ customer, isLoading, login, logout, updateProfile, changePassword, setCustomerSession }}>
      {children}
    </AuthContext.Provider>
  );
}
