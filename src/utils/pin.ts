/**
 * Godabaya Tailor — PIN Hashing Utilities
 *
 * PIN di-hash (SHA-256 + salt) sebelum disimpan. Fallback deterministik
 * dipakai bila WebCrypto tidak tersedia (mis. HTTP non-localhost).
 */

import * as Crypto from 'expo-crypto';

export function randomHex(length: number): string {
  try {
    const bytes = Crypto.getRandomBytes(length);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    let out = '';
    for (let i = 0; i < length; i++) {
      out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }
    return out;
  }
}

function fallbackHash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export async function hashPin(pin: string, salt: string, prefix = 'godabaya-pin'): Promise<string> {
  try {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${prefix}:${salt}:${pin.trim()}`
    );
    return digest;
  } catch {
    return fallbackHash(`${prefix}:${salt}:${pin.trim()}`);
  }
}
