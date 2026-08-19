/**
 * Godabaya Tailor — Dashboard Tailor
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBookings } from '@/hooks/useBookings';
import { useTailorAuth } from '@/auth/TailorAuthContext';
import { Booking } from '@/types';
import { formatDateShort } from '@/utils/format';

export default function TailorDashboardScreen() {
  const { tailor, logoutTailor } = useTailorAuth();
  const { getBookingStats, getAllBookings } = useBookings();
  
  const [stats, setStats] = useState({ newBookings: 0, today: 0, inProgress: 0, completed: 0, total: 0 });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadData = useCallback(async () => {
    try {
      const statsData = await getBookingStats();
      setStats(statsData);

      const all = await getAllBookings();
      setRecentBookings(all.slice(0, 5)); // Get 5 most recent
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, [getBookingStats, getAllBookings]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderStatCard = (title: string, value: number, icon: any, color: string, isLarge = false) => (
    <Card 
      style={[styles.statCard, isLarge && styles.statCardLarge] as any} 
      padding={isLarge ? 20 : 16}
    >
      <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={isLarge ? 28 : 24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.avatarBadge}>
            <Ionicons name="cut" size={20} color={Colors.textOnPrimary} />
          </View>
          <View>
            <Text style={styles.greeting}>Dashboard Penjahit</Text>
            <Text style={styles.title}>{tailor?.name ?? 'Godabaya Tailor'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            {renderStatCard('Booking Baru', stats.newBookings, 'mail-unread-outline', Colors.statusPending, true)}
            {renderStatCard('Pesanan Hari Ini', stats.today, 'today-outline', Colors.primary, true)}
          </View>
          <View style={styles.statsRow}>
            {renderStatCard('Dikerjakan', stats.inProgress, 'cut-outline', Colors.statusInProgress)}
            {renderStatCard('Selesai', stats.completed, 'checkmark-done-outline', Colors.success)}
            {renderStatCard('Total Pesanan', stats.total, 'layers-outline', Colors.textSecondary)}
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Booking Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/(tailor)/bookings')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {recentBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada booking.</Text>
            </View>
          ) : (
            <View style={styles.bookingList}>
              {recentBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  style={styles.bookingCard}
                  padding={16}
                  onPress={() => router.push({ pathname: '/tailor-booking-detail', params: { bookingId: booking.id.toString() } })}
                >
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingCode}>{booking.code}</Text>
                    <StatusBadge status={booking.status} size="sm" />
                  </View>
                  <View style={styles.bookingBody}>
                    <Text style={styles.customerName}>{booking.customerName}</Text>
                    <Text style={styles.serviceType}>{booking.serviceType}</Text>
                  </View>
                  <View style={styles.bookingFooter}>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
                      <Text style={styles.dateText}>{formatDateShort(booking.requestedDate)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // slightly darker background for dashboard
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greeting: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  title: {
    ...Typography.h3,
    color: Colors.primary,
    fontSize: 18,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsSection: {
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statCardLarge: {
    flex: 1,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {
    alignItems: 'flex-start',
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
  section: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  seeAll: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '600',
  },
  bookingList: {
    gap: 12,
  },
  bookingCard: {
    marginBottom: 0,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingCode: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bookingBody: {
    marginBottom: 12,
  },
  customerName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 4,
  },
  serviceType: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
