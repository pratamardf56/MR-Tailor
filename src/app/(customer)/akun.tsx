/**
 * Godabaya Tailor — Halaman Profile Customer (redesain modern minimalis)
 *
 * Fokus HANYA UI — semua logic (updateProfile, changePassword, logout, routing)
 * tetap memakai fungsi yang sudah ada. Tidak menambah backend/API/route baru.
 *
 * Struktur:
 *  Header "Profile" minimalis
 *   ↓ Avatar tengah
 *   ↓ Nama
 *   ↓ Email / WhatsApp (abu-abu)
 *   ↓ [ Edit Profil ] pill
 *   ↓ Card Pesanan Saya → /(customer)/pesanan
 *   ↓ Card Alamat Saya → /alamat
 *   ↓ Card Ubah Password → toggle form existing
 *   ↓ [ Keluar dari Akun ]
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/auth/AuthContext';
import { Alert } from '@/utils/alert';

export default function AkunScreen() {
  const { customer, logout, updateProfile, changePassword } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer?.name ?? '');
  const [whatsapp, setWhatsapp] = useState(customer?.whatsapp ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const startEditing = () => {
    setName(customer?.name ?? '');
    setWhatsapp(customer?.whatsapp ?? '');
    setProfileErrors({});
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Nama harus diisi';
    if (!whatsapp.trim()) errors.whatsapp = 'Nomor WhatsApp harus diisi';
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setSavingProfile(true);
      await updateProfile({ name, whatsapp });
      setEditing(false);
      Alert.alert('Berhasil', 'Data akun berhasil diperbarui.');
    } catch (error: any) {
      Alert.alert('Gagal', error?.message || 'Gagal memperbarui data akun.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = 'Password saat ini harus diisi';
    if (newPassword.length < 6) errors.newPassword = 'Password baru minimal 6 karakter';
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Konfirmasi password tidak sama';
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setSavingPassword(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangingPassword(false);
      Alert.alert('Berhasil', 'Password berhasil diubah.');
    } catch (error: any) {
      Alert.alert('Gagal', error?.message || 'Gagal mengubah password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Keluar Akun', 'Apakah Anda yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const initial = (customer?.name ?? '?').charAt(0).toUpperCase();
  const contactText = customer?.email || customer?.whatsapp || '-';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header minimalis - kotak pill seperti Edit Profil, background transparan */}
      <View style={styles.header}>
        <View style={styles.headerPill}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          {/* ── Profile tengah ── */}
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.profileName} numberOfLines={1}>
              {customer?.name ?? '-'}
            </Text>
            <Text style={styles.profileContact} numberOfLines={1}>
              {contactText}
            </Text>

            <TouchableOpacity style={styles.editPill} onPress={startEditing} activeOpacity={0.75}>
              <Ionicons name="create-outline" size={14} color={Colors.primary} />
              <Text style={styles.editPillText}>Edit Profil</Text>
            </TouchableOpacity>
          </View>

          {/* ── Edit Profil form (reuse fungsi existing) ── */}
          {editing ? (
            <Card padding={16} style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Ubah Data Akun</Text>
                <TouchableOpacity onPress={() => setEditing(false)} hitSlop={8}>
                  <Ionicons name="close" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
              <Input
                label="Nama"
                value={name}
                onChangeText={setName}
                placeholder="Nama lengkap"
                error={profileErrors.name}
              />
              <Input
                label="Nomor WhatsApp"
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="08xxxxxxxxxx"
                keyboardType="phone-pad"
                error={profileErrors.whatsapp}
              />
              <Text style={styles.helperText}>
                Email tidak dapat diubah sendiri. Hubungi penjahit bila email perlu diperbarui.
              </Text>
              <Button
                title="SIMPAN PERUBAHAN"
                onPress={handleSaveProfile}
                loading={savingProfile}
                size="sm"
                fullWidth
              />
            </Card>
          ) : null}

          {/* ── Menu cards vertikal ── */}
          <View style={styles.menuList}>
            {/* Pesanan Saya → /(customer)/pesanan (existing) */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/(customer)/pesanan')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Pesanan Saya</Text>
                <Text style={styles.menuDesc}>Lihat riwayat pesanan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>

            {/* Alamat Saya → /alamat (existing) */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/alamat')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Alamat Saya</Text>
                <Text style={styles.menuDesc}>Kelola alamat</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>

            {/* Ubah Password → toggle form existing */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => setChangingPassword((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Ubah Password</Text>
                <Text style={styles.menuDesc}>Kelola keamanan akun</Text>
              </View>
              <Ionicons
                name={changingPassword ? 'chevron-up' : 'chevron-forward'}
                size={18}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {/* ── Ubah Password form (reuse fungsi existing) ── */}
          {changingPassword ? (
            <Card padding={16} style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Ubah Password</Text>
                <TouchableOpacity onPress={() => setChangingPassword(false)} hitSlop={8}>
                  <Ionicons name="close" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
              <Input
                label="Password Saat Ini"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Password saat ini"
                secureTextEntry
                autoCapitalize="none"
                error={passwordErrors.currentPassword}
              />
              <Input
                label="Password Baru"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Minimal 6 karakter"
                secureTextEntry
                autoCapitalize="none"
                error={passwordErrors.newPassword}
              />
              <Input
                label="Ulangi Password Baru"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Ulangi password baru"
                secureTextEntry
                autoCapitalize="none"
                error={passwordErrors.confirmPassword}
              />
              <Button
                title="SIMPAN PASSWORD"
                onPress={handleChangePassword}
                loading={savingPassword}
                size="sm"
                fullWidth
              />
            </Card>
          ) : null}

          {/* ── Logout ── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Header clean minimalis — background transparan, tulisan dalam kotak pill seperti Edit Profil
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 14,
  },
  containerDesktop: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },

  // Profile tengah
  profileSection: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 0,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 26,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  profileName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  profileContact: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 3,
  },
  profileContactSecondary: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  editPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },

  formCard: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  helperText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: -6,
    marginBottom: 12,
    lineHeight: 14,
  },

  // Menu vertikal - modern clean
  menuList: {
    gap: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    // shadow tipis
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(74,46,34,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.text,
  },
  menuDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 2,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
    letterSpacing: 0.2,
  },
});
