/**
 * Godabaya Tailor — Deep Linking Utilities
 * WhatsApp, Google Maps, Phone
 * 
 * Di web, skema kustom (whatsapp://, geo:) tidak dapat dibuka lewat window.open,
 * jadi dipakai URL web yang setara (wa.me, google maps web).
 */

import { Linking, Platform } from 'react-native';
import { AppConfig } from '@/constants/config';
import { Alert } from '@/utils/alert';

function formatPhoneForLink(phone: string): string {
  let formatted = phone.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substring(1);
  }
  return formatted;
}

/**
 * Open WhatsApp with pre-filled message
 */
export async function openWhatsApp(phoneNumber?: string, message?: string): Promise<void> {
  const phone = phoneNumber || '';
  const msg = message || AppConfig.whatsappMessage;
  const formattedPhone = formatPhoneForLink(phone);
  const webUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;

  if (Platform.OS === 'web') {
    window.open(webUrl, '_blank', 'noopener');
    return;
  }

  const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    Alert.alert('Gagal Membuka WhatsApp', 'Pastikan WhatsApp sudah terinstall di perangkat Anda.');
  }
}

/**
 * Open Google Maps with search query
 */
export async function openGoogleMaps(query?: string): Promise<void> {
  const searchQuery = query || AppConfig.mapsQuery;
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;

  if (Platform.OS === 'web') {
    window.open(webUrl, '_blank', 'noopener');
    return;
  }

  const url = `geo:0,0?q=${encodeURIComponent(searchQuery)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    Alert.alert('Gagal Membuka Maps', 'Tidak dapat membuka aplikasi peta.');
  }
}

/**
 * Make a phone call
 */
export async function makePhoneCall(phoneNumber: string): Promise<void> {
  const url = `tel:${phoneNumber}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Gagal', 'Tidak dapat melakukan panggilan dari perangkat ini.');
    }
  } catch {
    Alert.alert('Gagal', 'Tidak dapat melakukan panggilan.');
  }
}
