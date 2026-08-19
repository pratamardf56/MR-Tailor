/**
 * Godabaya Tailor — Session-scoped storage.
 *
 * Login hanya berlaku selama tab/jendela website terbuka.
 * - Web  : memakai sessionStorage (otomatis terhapus saat tab ditutup,
 *          tetapi tetap bertahan saat halaman di-refresh).
 * - Native: memakai memori (terhapus saat aplikasi ditutup).
 */

import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const memoryStore = new Map<string, string>();

export async function getSession(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.sessionStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return memoryStore.get(key) ?? null;
}

export async function saveSession(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.sessionStorage?.setItem(key, value);
    } catch {
      // abaikan (mis. storage tidak tersedia)
    }
    return;
  }
  memoryStore.set(key, value);
}

export async function clearSession(key: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.sessionStorage?.removeItem(key);
    } catch {
      // abaikan
    }
    return;
  }
  memoryStore.delete(key);
}
