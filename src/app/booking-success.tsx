/**
 * Godabaya Tailor — Booking Success Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Button } from '@/components/ui/Button';

export default function BookingSuccessScreen() {
  const { bookingCode } = useLocalSearchParams<{ bookingCode: string }>();

  const copyToClipboard = async () => {
    if (bookingCode) {
      await Clipboard.setStringAsync(bookingCode);
      Alert.alert('Tersalin!', 'Kode booking berhasil disalin ke clipboard.');
    }
  };

  const handleCheckOrder = () => {
    // Langsung ke halaman Pesanan agar status terlihat di sana
    router.dismissAll();
    router.replace('/(customer)/pesanan');
  };

  const handleBackToHome = () => {
    router.dismissAll();
    router.replace('/(customer)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        
        <View style={styles.iconWrapper}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Booking Berhasil!</Text>
        <Text style={styles.subtitle}>
          Pesanan Anda telah kami terima dan sedang menunggu konfirmasi dari penjahit.
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Kode Booking Anda:</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{bookingCode}</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeNote}>
            Status pengerjaan pesanan Anda dapat dipantau di halaman Pesanan.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button 
            title="Cek Pesanan" 
            onPress={handleCheckOrder} 
            fullWidth 
            style={styles.actionBtn}
          />
          <Button 
            title="Kembali ke Beranda" 
            variant="outline"
            onPress={handleBackToHome} 
            fullWidth 
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  codeLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeText: {
    ...Typography.h3,
    color: Colors.primary,
    letterSpacing: 2,
    marginRight: 16,
  },
  copyBtn: {
    padding: 4,
  },
  codeNote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionBtn: {
    marginBottom: 12,
  }
});
