/**
 * Godabaya Tailor — Tailor Bookings List
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { BookingStatus, BookingStatusType } from '@/constants/config';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBookings } from '@/hooks/useBookings';
import { Booking } from '@/types';
import { formatDateShort } from '@/utils/format';

const TABS: { label: string; value: BookingStatusType | 'all' }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Menunggu', value: BookingStatus.PENDING },
  { label: 'Diterima', value: BookingStatus.ACCEPTED },
  { label: 'Dikerjakan', value: BookingStatus.IN_PROGRESS },
  { label: 'Selesai', value: BookingStatus.COMPLETED },
  { label: 'Ditolak', value: BookingStatus.REJECTED },
];

export default function TailorBookingsScreen() {
  const { getAllBookings } = useBookings();
  
  const [activeTab, setActiveTab] = useState<BookingStatusType | 'all'>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllBookings(activeTab === 'all' ? undefined : activeTab);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [getAllBookings, activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <Card 
      style={styles.bookingCard}
      padding={16}
      onPress={() => router.push({ pathname: '/tailor-booking-detail', params: { bookingId: item.id.toString() } })}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingCode}>{item.code}</Text>
        <StatusBadge status={item.status} size="sm" />
      </View>
      <View style={styles.bookingBody}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.serviceType}>{item.serviceType}</Text>
      </View>
      <View style={styles.bookingFooter}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.dateText}>
            Diminta: {formatDateShort(item.requestedDate)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Daftar Booking</Text>
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === item.value && styles.tabBtnActive]}
              onPress={() => setActiveTab(item.value)}
            >
              <Text style={[styles.tabText, activeTab === item.value && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Tidak ada pesanan ditemukan.</Text>
              </View>
            ) : null
          }
        />
      </View>
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
  },
  title: {
    ...Typography.h3,
    color: Colors.primary,
  },
  tabsContainer: {
    backgroundColor: Colors.surface,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(27, 42, 74, 0.05)',
    borderColor: Colors.primary,
  },
  tabText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
