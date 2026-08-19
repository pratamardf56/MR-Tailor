/**
 * Godabaya Tailor — Daftar Harga
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Card } from '@/components/ui/Card';
import { useServices } from '@/hooks/useServices';
import { Service } from '@/types';
import { formatCurrency } from '@/utils/format';

export default function HargaScreen() {
  const { getServices } = useServices();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getServices(true);
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  }, [getServices]);

  useEffect(() => {
    // Data fetching effect with internal loading state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadServices();
  }, [loadServices]);

  const renderItem = ({ item }: { item: Service }) => (
    <Card 
      style={styles.serviceCard} 
      padding={16}
      onPress={() => router.push({ pathname: '/service-detail', params: { serviceId: item.id.toString() } })}
    >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
      </View>
      <Text style={styles.servicePrice}>
        {item.priceStart > 0 ? `Mulai dari ${formatCurrency(item.priceStart)}` : 'Hubungi untuk harga'}
      </Text>
      <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.estimationBadge}>
        <Ionicons name="time-outline" size={14} color={Colors.primary} />
        <Text style={styles.estimationText}>Estimasi: {item.estimation}</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Daftar Harga & Layanan</Text>
        <Text style={styles.subtitle}>Pilih layanan yang Anda butuhkan</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="pricetags-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Belum ada layanan tersedia.</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.disclaimerText}>
                Harga dapat berubah tergantung model, bahan, dan tingkat kesulitan jahitan.
              </Text>
            </View>
          }
        />
      )}
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
  },
  title: {
    ...Typography.h3,
    color: Colors.primary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  serviceCard: {
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    ...Typography.h4,
    color: Colors.text,
  },
  servicePrice: {
    ...Typography.bodyMedium,
    color: Colors.accent,
    marginBottom: 8,
  },
  serviceDesc: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  estimationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  estimationText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});
