/**
 * Godabaya Tailor — Daftar Harga
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
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
      padding={18}
      onPress={() => router.push({ pathname: '/service-detail', params: { serviceId: item.id.toString() } })}
    >
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIconBox}>
          <Ionicons name="cut-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.serviceHeaderText}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.servicePrice}>
            {item.priceStart > 0 ? `Mulai dari ${formatCurrency(item.priceStart)}` : 'Hubungi untuk harga'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </View>
      <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.estimationBadge}>
        <Ionicons name="time-outline" size={13} color={Colors.primary} />
        <Text style={styles.estimationText}>Estimasi: {item.estimation}</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Ionicons name="pricetag-outline" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Daftar Harga & Layanan</Text>
            <Text style={styles.subtitle}>Pilih layanan yang Anda butuhkan</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(customer)')} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="pricetags-outline" size={36} color={Colors.accent} />
          </View>
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
              <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 46, 34, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h4,
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(200, 149, 108, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  serviceCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  serviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 46, 34, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  serviceHeaderText: {
    flex: 1,
  },
  serviceName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  servicePrice: {
    ...Typography.bodySm,
    color: Colors.accent,
    fontWeight: '600',
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
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  estimationText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundAlt,
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
