/**
 * Godabaya Tailor — Pengaturan Pemilik
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/hooks/useSettings';
import { useTailorAuth } from '@/auth/TailorAuthContext';
import { useAccountReset } from '@/hooks/useAccountReset';
import { AppConfig } from '@/constants/config';

export default function PengaturanScreen() {
  const { getAllSettings, updateSetting } = useSettings();
  const { tailor, logoutTailor } = useTailorAuth();
  const { resetAccounts } = useAccountReset();
  
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  // Settings state
  const [businessName, setBusinessName] = useState<string>(AppConfig.name);
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [address, setAddress] = useState<string>(AppConfig.address);
  const [openHour, setOpenHour] = useState<string>(AppConfig.defaultOpenHour);
  const [closeHour, setCloseHour] = useState<string>(AppConfig.defaultCloseHour);

  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun Penjahit',
      'Apakah Anda yakin ingin keluar dari dashboard admin?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logoutTailor();
            router.replace('/penjahit');
          },
        },
      ]
    );
  };

  const handleResetAccounts = () => {
    Alert.alert(
      'Reset Semua Akun',
      'Semua nomor WhatsApp customer akan dihapus dan PIN admin dikembalikan ke default (9999). Pesanan, harga, portofolio, dan pengaturan tetap aman. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset Akun',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetAccounts();
              await logoutTailor();
              router.replace('/penjahit');
            } catch {
              Alert.alert('Gagal', 'Terjadi kesalahan saat mereset akun. Coba lagi.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getAllSettings();
      
      if (settings.business_name) setBusinessName(settings.business_name);
      if (settings.whatsapp) setWhatsapp(settings.whatsapp);
      if (settings.address) setAddress(settings.address);
      if (settings.open_hour) setOpenHour(settings.open_hour);
      if (settings.close_hour) setCloseHour(settings.close_hour);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [getAllSettings]);

  useEffect(() => {
    // Load persisted settings into local form state on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSetting('business_name', businessName);
      await updateSetting('whatsapp', whatsapp);
      await updateSetting('address', address);
      await updateSetting('open_hour', openHour);
      await updateSetting('close_hour', closeHour);
      
      Alert.alert('Berhasil', 'Pengaturan berhasil disimpan.');
    } catch {
      Alert.alert('Error', 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pengaturan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil Usaha</Text>
          <Card padding={20}>
            <Input
              label="Nama Usaha"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Godabaya Tailor"
            />
            
            <Input
              label="Nomor WhatsApp"
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="Contoh: 081234567890"
              keyboardType="phone-pad"
            />
            
            <Input
              label="Alamat Lengkap"
              value={address}
              onChangeText={setAddress}
              placeholder="Alamat lengkap usaha Anda"
              multiline
              numberOfLines={3}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jam Operasional</Text>
          <Card padding={20}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Jam Buka"
                  value={openHour}
                  onChangeText={setOpenHour}
                  placeholder="08:00"
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.flex1}>
                <Input
                  label="Jam Tutup"
                  value={closeHour}
                  onChangeText={setCloseHour}
                  placeholder="17:00"
                />
              </View>
            </View>
            <Text style={styles.helpText}>
              Gunakan format HH:MM (contoh: 08:00)
            </Text>
          </Card>
        </View>

        <View style={styles.saveContainer}>
          <Button 
            title="Simpan Pengaturan" 
            onPress={handleSave} 
            loading={saving}
            size="lg"
            fullWidth
          />
        </View>

        <View style={styles.section}>
          <Card padding={16} style={styles.accountCard}>
            <View style={styles.accountRow}>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarText}>{tailor?.name.charAt(0).toUpperCase() ?? 'P'}</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{tailor?.name ?? 'Penjahit'}</Text>
                <Text style={styles.accountUser}>{tailor?.username ?? ''}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={18} color={Colors.error} />
              <Text style={styles.logoutText}>KELUAR DARI AKUN PENJAHIT</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>Zona Berbahaya</Text>
          <Card padding={16} style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <View style={styles.dangerIconBox}>
                <Ionicons name="refresh-circle-outline" size={22} color={Colors.error} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.dangerTitle}>Reset Semua Akun</Text>
                <Text style={styles.dangerDesc}>
                  Hapus seluruh customer (nomor WhatsApp & PIN) dan kembalikan PIN admin ke default.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.resetBtn, resetting && { opacity: 0.6 }]}
              onPress={handleResetAccounts}
              disabled={resetting}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.logoutText}>
                {resetting ? 'MENGATUR ULANG...' : 'RESET SEMUA AKUN'}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    ...Typography.h3,
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  helpText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: -8,
    marginBottom: 8,
  },
  saveContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  accountCard: {
    marginTop: 8,
  },
  dangerCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...Typography.h4,
    color: Colors.textOnPrimary,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountUser: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  logoutText: {
    ...Typography.buttonSm,
    color: Colors.error,
    fontWeight: '600',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dangerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  dangerDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
});
