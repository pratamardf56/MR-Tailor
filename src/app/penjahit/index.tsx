/**
 * Godabaya Tailor — Login Penjahit / Admin
 *
 * Route khusus: /penjahit. Menggunakan Username + PIN (terpisah dari customer).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { AppConfig } from '@/constants/config';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTailorAuth } from '@/auth/TailorAuthContext';

export default function TailorLoginScreen() {
  const { loginTailor } = useTailorAuth();

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = 'Nomor WhatsApp harus diisi';
    if (!pin.trim()) e.pin = 'PIN harus diisi';
    else if (!/^\d{4,6}$/.test(pin.trim())) e.pin = 'PIN harus 4-6 angka';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await loginTailor(username, pin);
      router.replace('/penjahit/dashboard');
    } catch (error: any) {
      Alert.alert('Gagal Masuk', error?.message || 'Username atau PIN salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Akses Penjahit</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoWrap}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>✂️</Text>
              </View>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.textOnPrimary} />
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            </View>
            <Text style={styles.brandName}>{AppConfig.name}</Text>
            <Text style={styles.tagline}>Dashboard khusus pengelola</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Login Penjahit</Text>
            <Text style={styles.cardSubtitle}>
              Masuk untuk mengelola pesanan. Halaman ini khusus penjahit/admin.
            </Text>

            <Input
              label="Nomor WhatsApp"
              placeholder="Masukkan nomor WhatsApp penjahit"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="phone-pad"
              error={errors.username}
              required
            />

            <Input
              label="PIN"
              placeholder="Masukkan PIN (4-6 angka)"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              error={errors.pin}
              required
            />

            <View style={styles.infoBox}>
              <Ionicons name="lock-closed-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                Customer tidak dapat mengakses dashboard ini. Gunakan kredensial penjahit yang benar.
              </Text>
            </View>

            <Button
              title="MASUK"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrap: {
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 32,
  },
  adminBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  adminBadgeText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  brandName: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: 4,
  },
  tagline: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  submitBtn: {
    marginTop: 4,
  },
});
