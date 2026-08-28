/**
 * Godabaya Tailor — API Client
 *
 * Lapisan tunggal untuk berkomunikasi dengan backend REST (server/index.js).
 * Menggantikan akses SQLite lokal agar data dibagikan antara aplikasi admin
 * (APK) dan website customer.
 *
 * Base URL:
 * - Dapat di-override lewat env EXPO_PUBLIC_API_URL (mis. https://api.domain.com).
 * - Web  : memakai hostname halaman + port 3001 (uji lokal).
 * - Native: mencoba menurunkan IP dev-server Expo + port 3001, fallback localhost.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type ApiRole = 'customer' | 'tailor';

const DEFAULT_PORT = 3001;

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, '');
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_PORT}`;
    }
    return `http://localhost:${DEFAULT_PORT}`;
  }

  // Native: turunkan IP dari host dev-server Expo agar bisa diakses dari HP/emulator
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host) {
    return `http://${host}:${DEFAULT_PORT}`;
  }
  return `http://localhost:${DEFAULT_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

// Penyimpanan token per-peran (di memori). Persistensi sesi ditangani session.ts.
const tokens: Record<ApiRole, string | null> = { customer: null, tailor: null };

export function setToken(role: ApiRole, token: string | null): void {
  tokens[role] = token;
}

export function getToken(role: ApiRole): string | null {
  return tokens[role];
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Token peran yang dilampirkan. Bila kosong: tailor lalu customer (yang ada). */
  role?: ApiRole;
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, role } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = role ? tokens[role] : tokens.tailor ?? tokens.customer;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      'Tidak dapat terhubung ke server. Pastikan server berjalan dan alamat API benar.'
    );
  }

  const text = await response.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || `Permintaan gagal (${response.status}).`);
  }

  return data as T;
}
