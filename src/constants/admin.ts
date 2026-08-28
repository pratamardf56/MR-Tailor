/**
 * Godabaya Tailor — Ketersediaan Fitur Admin
 *
 * Website customer bersifat PUBLIK, sehingga halaman admin (login penjahit
 * & dashboard) tidak boleh tersedia di web. Admin mengakses dashboard
 * hanya melalui aplikasi (APK/native).
 *
 * Override opsional: set EXPO_PUBLIC_ENABLE_ADMIN=true bila ingin
 * mengaktifkan akses admin di web (mis. build web khusus admin).
 */

import { Platform } from 'react-native';

export const ADMIN_ENABLED: boolean =
  Platform.OS !== 'web' || process.env.EXPO_PUBLIC_ENABLE_ADMIN === 'true';
