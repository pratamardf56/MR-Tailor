/**
 * Godabaya Tailor — Daftar Customer (Penjahit)
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Card } from '@/components/ui/Card';
import { apiRequest } from '@/utils/api';
import { formatDateShort } from '@/utils/format';

interface CustomerSummary {
  id: number;
  name: string;
  whatsapp: string;
  created_at: string;
  booking_count: number;
}

export default function TailorCustomersScreen() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ customers: CustomerSummary[] }>('/api/customers', { role: 'tailor' });
      setCustomers(res.customers ?? []);
    } catch (error) {
      console.error('Gagal memuat customer:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer</Text>
        <Text style={styles.subtitle}>Semua customer yang terdaftar</Text>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <Ionicons name="hourglass-outline" size={40} color={Colors.textTertiary} />
            ) : (
              <>
                <Ionicons name="people-outline" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Belum ada customer terdaftar.</Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.customerCard} padding={16}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.whatsapp}</Text>
              <Text style={styles.joined}>Bergabung {formatDateShort(item.created_at)}</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countValue}>{item.booking_count}</Text>
              <Text style={styles.countLabel}>Pesanan</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
  subtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...Typography.h4,
    color: Colors.textOnPrimary,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  phone: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  joined: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  countBox: {
    alignItems: 'center',
    paddingLeft: 12,
  },
  countValue: {
    ...Typography.h4,
    color: Colors.primary,
  },
  countLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
