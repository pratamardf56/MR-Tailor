/**
 * Godabaya Tailor — Cek Pesanan Screen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Card } from '@/components/ui/Card';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/auth/AuthContext';
import { BookingStatus } from '@/constants/config';
import { Booking } from '@/types';
import { formatDateShort } from '@/utils/format';

export default function PesananScreen() {
  const { getBookingsByCustomer } = useBookings();
  const { customer } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      if (!customer) {
        setBookings([]);
        return;
      }
      // Hanya tampilkan pesanan milik customer yang login
      const data = await getBookingsByCustomer(customer.id, customer.whatsapp);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [getBookingsByCustomer, customer]);

  useFocusEffect(
    useCallback(() => {
      if (!customer) {
        router.replace('/(customer)/cek-pesanan');
      } else {
        loadBookings();
      }
    }, [customer, loadBookings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <Card 
      style={styles.bookingCard}
      padding={0}
      onPress={() => router.push({ pathname: '/order-detail', params: { bookingCode: item.code } })}
    >
      <View style={styles.bookingBody}>
        <View style={styles.bookingHeader}>
          <View style={styles.serviceInfo}>
            <View style={styles.iconBox}>
              <Ionicons name="shirt-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfoText}>
              <Text style={styles.serviceType}>{item.serviceType}</Text>
              <Text style={styles.dateText}>
                Tgl Pesan: {formatDateShort(item.createdAt || item.requestedDate)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </View>
      </View>
      {item.status === BookingStatus.REJECTED && item.rejectionReason ? (
        <View style={styles.rejectBox}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={styles.rejectText} numberOfLines={2}>
            {item.rejectionReason}
          </Text>
        </View>
      ) : null}
      <StatusBanner status={item.status} />
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.title}>Pesanan Saya</Text>
            <Text style={styles.subtitle}>Pantau status pengerjaan pesanan Anda</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.bookNowBtn}
            onPress={() => router.push('/(customer)/booking')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={Colors.textOnPrimary} />
            <Text style={styles.bookNowText}>Baru</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(customer)')} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="receipt-outline" size={40} color={Colors.accent} />
                </View>
                <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
                <Text style={styles.emptyText}>Anda belum membuat pesanan apapun.</Text>
                <TouchableOpacity 
                  style={styles.bookBtn} 
                  onPress={() => router.push('/(customer)/booking')}
                  activeOpacity={0.82}
                >
                  <Ionicons name="cut-outline" size={16} color={Colors.textOnPrimary} />
                  <Text style={styles.bookBtnText}>Buat Pesanan Sekarang</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,  // Cream
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 19,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookNowText: {
    ...Typography.buttonSm,
    color: Colors.textOnPrimary,
    fontSize: 13,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCard: {
    marginBottom: 0,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    backgroundColor: Colors.surface,
  },
  rejectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(220, 38, 38, 0.1)',
  },
  rejectText: {
    ...Typography.bodySm,
    color: Colors.error,
    flex: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingBody: {
    padding: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceInfoText: {
    flex: 1,
    paddingRight: 8,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 46, 34, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceType: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 2,
    fontWeight: '600',
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(200, 149, 108, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 24,
  },
  bookBtnText: {
    ...Typography.buttonSm,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
});
