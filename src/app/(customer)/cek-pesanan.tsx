/**
 * Godabaya Tailor — Rute lama "Cek Pesanan"
 *
 * Login/PIN tidak lagi diperlukan di sini. Customer yang sudah login
 * langsung diarahkan ke daftar pesanannya; yang belum login diarahkan
 * ke halaman Login. Rute ini dipertahankan agar tautan lama tidak rusak.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/auth/AuthContext';

export default function CekPesananRedirect() {
  const { customer, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(customer ? '/(customer)/pesanan' : '/login');
  }, [customer, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
