/**
 * Godabaya Tailor — Dashboard Penjahit (Tahap 1)
 *
 * Hanya bisa diakses jika sudah login sebagai penjahit.
 * Jika belum login, dialihkan ke /penjahit.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Card } from '@/components/ui/Card';
import { useTailorAuth } from '@/auth/TailorAuthContext';
import { useBookings } from '@/hooks/useBookings';
import { ADMIN_ENABLED } from '@/constants/admin';

export default function TailorDashboardScreen() {
  const { tailor, logoutTailor } = useTailorAuth();
  const { getBookingStats } = useBookings();

  const [stats, setStats] = useState({ newBookings: 0, total: 0 });

  const loadStats = useCallback(async () => {
    try {
      const data = await getBookingStats();
      setStats({ newBookings: data.newBookings, total: data.total });
    } catch (error) {
      console.error('Gagal memuat statistik:', error);
    }
  }, [getBookingStats]);

  useFocusEffect(
    useCallback(() => {
      if (tailor) loadStats();
    }, [tailor, loadStats])
  );

  useEffect(() => {
    if (!ADMIN_ENABLED) {
      router.replace('/(customer)');
    } else if (!tailor) {
      router.replace('/penjahit');
    }
  }, [tailor]);

  if (!ADMIN_ENABLED) return null;

  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun Penjahit',
      'Apakah Anda yakin ingin keluar?',
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

  const menuItems = [
    {
      title: 'Booking Masuk',
      desc: 'Lihat pesanan yang menunggu konfirmasi',
      icon: 'mail-unread-outline' as const,
      color: Colors.statusPending,
      onPress: () => router.push('/(tailor)/bookings'),
    },
    {
      title: 'Semua Pesanan',
      desc: 'Kelola seluruh pesanan & statusnya',
      icon: 'list-outline' as const,
      color: Colors.primary,
      onPress: () => router.push('/(tailor)'),
    },
    {
      title: 'Customer',
      desc: 'Daftar customer yang terdaftar',
      icon: 'people-outline' as const,
      color: Colors.success,
      onPress: () => router.push('/(tailor)/customers'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Penjahit</Text>
        <Text style={styles.greeting}>Selamat datang, {tailor?.name ?? 'Penjahit'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Ringkasan */}
        <View style={styles.section}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard} padding={16}>
              <View style={[styles.statIconBox, { backgroundColor: `${Colors.statusPending}15` }]}>
                <Ionicons name="mail-unread-outline" size={22} color={Colors.statusPending} />
              </View>
              <Text style={styles.statValue}>{stats.newBookings}</Text>
              <Text style={styles.statTitle}>Booking Masuk</Text>
            </Card>
            <Card style={styles.statCard} padding={16}>
              <View style={[styles.statIconBox, { backgroundColor: `${Colors.primary}15` }]}>
                <Ionicons name="layers-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statTitle}>Total Pesanan</Text>
            </Card>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {menuItems.map((item, index) => (
            <Card
              key={index}
              style={styles.menuCard}
              padding={16}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconBox, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </Card>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
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
    paddingBottom: 20,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: 4,
  },
  greeting: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text,
    lineHeight: 32,
  },
  statTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuDesc: {
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
    paddingVertical: 14,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  logoutText: {
    ...Typography.button,
    color: Colors.error,
    fontWeight: '600',
  },
});
