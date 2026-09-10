/**
 * Godabaya Tailor — Persistent storage (tetap login setelah tutup browser).
 * - Web  : memakai localStorage agar sesi tetap meski tab/browser ditutup
 * - Native: memakai AsyncStorage
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

const memoryStore = new Map<string, string>();

export async function getSession(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return (await AsyncStorage.getItem(key)) ?? memoryStore.get(key) ?? null;
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

export async function saveSession(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // abaikan
    }
    return;
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
  memoryStore.set(key, value);
}

export async function clearSession(key: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // abaikan
    }
    return;
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
  memoryStore.delete(key);
}
