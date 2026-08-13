/**
 * Godabaya Tailor — Deep Linking Utilities
 * WhatsApp, Google Maps, Phone
 */

import { Linking, Alert } from 'react-native';
import { AppConfig } from '@/constants/config';

/**
 * Open WhatsApp with pre-filled message
 */
export async function openWhatsApp(phoneNumber?: string, message?: string): Promise<void> {
  const phone = phoneNumber || '';
  const msg = message || AppConfig.whatsappMessage;
  
  // Convert 08xx to 628xx for international format
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1);
  }
  
  const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
  const webUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
  
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
  const url = `geo:0,0?q=${encodeURIComponent(searchQuery)}`;
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  
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
