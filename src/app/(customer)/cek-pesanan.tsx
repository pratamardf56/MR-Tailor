/**
 * Godabaya Tailor — Cek Pesanan Screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/auth/AuthContext';
import { Alert } from '@/utils/alert';

export default function CekPesananScreen() {
  const { login, customer } = useAuth();
  
  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState('');
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
    } catch (error: any) {
      // Menyesuaikan pesan error agar tidak membocorkan apakah nomor terdaftar atau tidak
      Alert.alert('Gagal', 'Data yang dimasukkan tidak sesuai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Cek Pesanan</Text>
            <Text style={styles.subtitle}>Masukkan nomor WhatsApp dan PIN yang Anda gunakan saat booking.</Text>
          </View>
          
          <Card style={styles.card} padding={24}>
            <Input
              label="Nomor WhatsApp"
              placeholder="Contoh: 081234567890"
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
              error={errors.whatsapp}
            />
            
            <View style={styles.spacer} />
            
            <Input
              label="PIN"
              placeholder="••••"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              error={errors.pin}
            />
            
            <View style={styles.buttonContainer}>
              <Button 
                title="LIHAT PESANAN" 
                onPress={handleCekPesanan} 
                loading={loading}
                fullWidth
                size="lg"
                style={styles.submitBtn}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Cream / beige background
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    color: '#3E2723',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  spacer: {
    height: 16,
  },
  buttonContainer: {
    marginTop: 32,
  },
  submitBtn: {
    backgroundColor: '#3E2723',
  }
});
