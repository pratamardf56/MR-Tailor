/**
 * Godabaya Tailor — Service Detail
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Button } from '@/components/ui/Button';
import { useServices } from '@/hooks/useServices';
import { Service } from '@/types';
import { formatCurrency } from '@/utils/format';

export default function ServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { getServiceById } = useServices();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const loadService = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const data = await getServiceById(id);
      setService(data);
    } catch (error) {
      console.error('Failed to load service detail:', error);
    } finally {
      setLoading(false);
    }
  }, [getServiceById]);

  useEffect(() => {
    if (serviceId) {
      // Data fetching effect with internal loading state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadService(parseInt(serviceId, 10));
    }
  }, [serviceId, loadService]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Layanan tidak ditemukan.</Text>
        <Button title="Kembali" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons 
          name="arrow-back" 
          size={24} 
          color={Colors.text} 
          onPress={() => router.back()} 
          style={styles.backBtn}
        />
        <Text style={styles.headerTitle}>Detail Layanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.heroSection}>
          <View style={styles.iconBox}>
            <Ionicons name="cut-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.categoryBadge}>{service.category}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Harga Estimasi</Text>
            <Text style={styles.priceValue}>
              {service.priceStart > 0 ? `Mulai dari ${formatCurrency(service.priceStart)}` : 'Hubungi untuk harga'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={24} color={Colors.accent} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Estimasi Pengerjaan</Text>
              <Text style={styles.detailValue}>{service.estimation}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Deskripsi Layanan</Text>
            <Text style={styles.description}>{service.description}</Text>
          </View>
          
          <View style={styles.noteBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.noteText}>
              Harga akhir dapat menyesuaikan dengan tingkat kerumitan model, jenis bahan, dan tambahan aksesoris lainnya. Konsultasikan keinginan Anda untuk detail lebih lanjut.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button 
          title="Booking Layanan Ini" 
          onPress={() => router.push({ pathname: '/(customer)/booking', params: { preselectedService: service.category } })} 
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom bar
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  serviceName: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  categoryBadge: {
    ...Typography.caption,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    color: Colors.textSecondary,
    overflow: 'hidden',
  },
  infoSection: {
    padding: 24,
  },
  priceContainer: {
    marginBottom: 8,
  },
  priceLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    ...Typography.h3,
    color: Colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTextContainer: {
    marginLeft: 16,
  },
  detailLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  detailContent: {
    marginBottom: 24,
  },
  description: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
    marginTop: 8,
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(27, 42, 74, 0.05)', // light primary
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  noteText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
});
