/**
 * Godabaya Tailor — Cek Pesanan / Halaman Login
 * Redesigned to match Halaman Login in Reference Image 3
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/auth/AuthContext';
import { ADMIN_ENABLED } from '@/constants/admin';
import { Alert } from '@/utils/alert';

export default function CekPesananScreen() {
  const { login, customer } = useAuth();
  
  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      router.replace('/(customer)/pesanan');
    }
  }, [customer]);

  const handleCekPesanan = async () => {
    const newErrors: Record<string, string> = {};
    if (!whatsapp.trim()) newErrors.whatsapp = 'Nomor WhatsApp harus diisi';
    if (!pin.trim()) newErrors.pin = 'PIN harus diisi';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      await login(whatsapp, pin);
      router.replace('/(customer)/pesanan');
    } catch {
      Alert.alert('Gagal', 'Data yang dimasukkan tidak sesuai.');
    } finally {
      setLoading(false);
    }
  };

  // Split-screen banner image URL (Tailor/Suit theme)
  const stripeImage = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          
          {/* LEFT STRIPE COVER (Tailoring Visual - Split Screen Style) */}
          <View style={styles.leftStripe}>
            <Image source={{ uri: stripeImage }} style={styles.stripeImg} />
            <View style={styles.stripeOverlay} />
          </View>

          {/* RIGHT COLUMN (Login Form) */}
          <ScrollView 
            style={styles.rightColumn} 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Close Button */}
            <TouchableOpacity onPress={() => router.replace('/(customer)')} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>

            {/* Header / Brand info */}
            <View style={styles.brandContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="cut" size={24} color={Colors.textOnPrimary} />
              </View>
              <Text style={styles.brandName}>GODABAYA TAILOR</Text>
              <Text style={styles.brandTagline}>Jahit & Permak Pakaian Sesuai Kebutuhan Anda</Text>
            </View>

            {/* Title Block */}
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Masuk ke Akun Anda</Text>
              <Text style={styles.subtitle}>
                Masukkan nomor WhatsApp dan PIN Anda untuk melihat pesanan.
              </Text>
            </View>

            {/* Input fields */}
            <View style={styles.formContainer}>
              
              {/* WhatsApp Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
                <View style={[styles.inputBox, errors.whatsapp ? styles.inputBoxError : null]}>
                  <Ionicons name="logo-whatsapp" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Contoh: 081234567890"
                    placeholderTextColor={Colors.textTertiary}
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                    keyboardType="phone-pad"
                    style={styles.textInput}
                  />
                </View>
                {errors.whatsapp ? <Text style={styles.errorText}>{errors.whatsapp}</Text> : null}
              </View>

              {/* PIN Input with Eye Toggle */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>PIN (4-6 angka)</Text>
                <View style={[styles.inputBox, errors.pin ? styles.inputBoxError : null]}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Masukkan PIN Anda"
                    placeholderTextColor={Colors.textTertiary}
                    value={pin}
                    onChangeText={setPin}
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    maxLength={6}
                    style={[styles.textInput, { paddingRight: 40 }]}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPin(!showPin)} 
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showPin ? "eye-off-outline" : "eye-outline"} 
                      size={18} 
                      color={Colors.textTertiary} 
                    />
                  </TouchableOpacity>
                </View>
                {errors.pin ? <Text style={styles.errorText}>{errors.pin}</Text> : null}
              </View>

              {/* MASUK button (Solid Gold/Brown) */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCekPesanan}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? 'MEMUAT...' : 'MASUK'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ATAU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Fallback Admin button */}
            {ADMIN_ENABLED && (
            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => router.push('/penjahit')}
              activeOpacity={0.8}
            >
              <View style={styles.adminLeft}>
                <View style={styles.adminIconBox}>
                  <Ionicons name="person-outline" size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.adminTitle}>Akses Admin / Penjahit</Text>
                  <Text style={styles.adminSubtitle}>Kelola pesanan, harga & portofolio</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            )}

            {/* Description note */}
            <View style={styles.noteContainer}>
              <Ionicons name="shield-checkmark-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.noteText}>
                Tanpa OTP. Nomor WhatsApp sebagai identitas, PIN sebagai kunci masuk.
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2026 Godabaya Tailor. All rights reserved.</Text>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background, // Cream base background
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'row', // Grid/Row layout for mobile split-screen
  },

  // ─── LEFT COVER STRIPE (30% WIDTH) ─────────────────
  leftStripe: {
    width: '30%',
    height: '100%',
    position: 'relative',
    backgroundColor: Colors.primaryDark,
  },
  stripeImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stripeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(74, 46, 34, 0.45)', // matching the tailor theme overlay color
  },

  // ─── RIGHT FORM COLUMN (70% WIDTH) ────────────────
  rightColumn: {
    width: '70%',
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 40,
    flexGrow: 1,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },

  // Brand Info
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Title Block
  titleBlock: {
    marginBottom: 20,
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Forms
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    height: 48,
    position: 'relative',
  },
  inputBoxError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    ...Typography.bodySm,
    flex: 1,
    color: Colors.text,
    height: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 2,
  },

  submitBtn: {
    backgroundColor: Colors.accentDark, // Gold/Brown solid background
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    ...Typography.buttonSm,
    color: Colors.textOnPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '700',
  },

  // Fallback Admin
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 1,
  },
  adminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 46, 34, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  adminSubtitle: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Help Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 22,
    paddingHorizontal: 4,
  },
  noteText: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
    flex: 1,
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 36,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
});
