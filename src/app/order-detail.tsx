/**
 * Godabaya Tailor — Order Detail
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { BookingStatus } from '@/constants/config';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/auth/AuthContext';
import { Booking } from '@/types';
import { formatDateFull } from '@/utils/format';
import { whatsAppVariants } from '@/utils/phone';

export default function OrderDetailScreen() {
  const { bookingCode } = useLocalSearchParams<{ bookingCode: string }>();
  const { getBookingByCode, customerAcceptDate, customerRejectDate } = useBookings();
  const { customer } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!customer) {
      router.replace('/(customer)/cek-pesanan');
    }
  }, [customer]);

  const loadBooking = useCallback(async (code: string) => {
    try {
      setLoading(true);
      const data = await getBookingByCode(code);
      setBooking(data);

      if (data && customer) {
        const owned = data.customerId != null
          ? data.customerId === customer.id
          : whatsAppVariants(customer.whatsapp).some((v) => data.customerPhone === v.replace('+', ''));
        setAccessDenied(!owned);
      } else if (data && !customer) {
        setAccessDenied(true);
      }
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setLoading(false);
    }
  }, [getBookingByCode, customer]);

  useEffect(() => {
    if (bookingCode) {
      // Data fetching effect with internal loading state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadBooking(bookingCode);
    }
  }, [bookingCode, loadBooking]);

  const handleAcceptDate = async () => {
    if (!booking) return;
    try {
      setActionLoading(true);
      await customerAcceptDate(booking.id);
      Alert.alert('Berhasil', 'Tanggal alternatif telah Anda setujui.');
      loadBooking(booking.code);
    } catch {
      Alert.alert('Error', 'Gagal menyetujui tanggal.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDate = async () => {
    if (!booking) return;
    
    Alert.alert(
      'Tolak Tanggal',
      'Apakah Anda yakin ingin menolak tanggal ini? Pesanan akan dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Tolak', 
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await customerRejectDate(booking.id);
              Alert.alert('Berhasil', 'Pesanan telah dibatalkan.');
              loadBooking(booking.code);
            } catch {
              Alert.alert('Error', 'Gagal membatalkan pesanan.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="search" size={48} color={Colors.textTertiary} />
        <Text style={styles.errorText}>Pesanan tidak ditemukan.</Text>
        <Text style={styles.errorSubText}>Periksa kembali kode booking Anda.</Text>
        <Button title="Kembali" onPress={() => router.back()} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (accessDenied) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={48} color={Colors.textTertiary} />
        <Text style={styles.errorText}>Akses Ditolak</Text>
        <Text style={styles.errorSubText}>Pesanan ini bukan milik akun Anda.</Text>
        <Button title="Kembali" onPress={() => router.back()} style={{ marginTop: 24 }} />
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
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Status Header */}
        <View style={styles.statusSection}>
          <Text style={styles.codeText}>{booking.code}</Text>
          <View style={styles.statusWrapper}>
            <StatusBadge status={booking.status} />
          </View>
          
          {booking.status === BookingStatus.REJECTED && booking.rejectionReason && (
            <View style={styles.alertBox}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.alertText}>{booking.rejectionReason}</Text>
            </View>
          )}

          {booking.status === BookingStatus.DATE_PROPOSED && (
            <View style={styles.proposedBox}>
              <View style={styles.proposedHeader}>
                <Ionicons name="calendar-outline" size={20} color={Colors.statusProposed} />
                <Text style={styles.proposedTitle}>Penjahit Mengusulkan Tanggal Lain</Text>
              </View>
              <Text style={styles.proposedDesc}>
                Maaf, kami tidak dapat mengerjakan pada tanggal yang diminta. Kami mengusulkan:
              </Text>
              <Text style={styles.proposedDateValue}>
                {booking.proposedDate ? formatDateFull(booking.proposedDate) : '-'}
              </Text>
              
              {booking.tailorNotes && (
                <Text style={styles.tailorNotes}>Catatan: &quot;{booking.tailorNotes}&quot;</Text>
              )}

              <View style={styles.proposedActions}>
                <Button 
                  title="Terima Tanggal" 
                  onPress={handleAcceptDate} 
                  loading={actionLoading}
                  style={styles.flex1}
                />
                <Button 
                  title="Tolak (Batal)" 
                  variant="outline"
                  onPress={handleRejectDate} 
                  disabled={actionLoading}
                  style={styles.flex1}
                />
              </View>
            </View>
          )}
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
          
          <Card padding={16} style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Layanan</Text>
              <Text style={styles.detailValue}>{booking.serviceType}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nama Pemesan</Text>
              <Text style={styles.detailValue}>{booking.customerName}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tanggal Diminta</Text>
              <Text style={styles.detailValue}>{formatDateFull(booking.requestedDate)}</Text>
            </View>
            
            {booking.status !== BookingStatus.DATE_PROPOSED && booking.proposedDate && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal Disetujui</Text>
                  <Text style={[styles.detailValue, { color: Colors.primary }]}>
                    {formatDateFull(booking.proposedDate)}
                  </Text>
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi</Text>
          <Card padding={16}>
            <Text style={styles.descriptionText}>{booking.description}</Text>
          </Card>
        </View>

        {/* Photo Reference */}
        {booking.referencePhoto && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Foto Referensi</Text>
            <Card padding={0} style={styles.photoCard}>
              <Image source={{ uri: booking.referencePhoto }} style={styles.photo} />
            </Card>
          </View>
        )}

        {/* Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catatan Tambahan</Text>
            <Card padding={16}>
              <Text style={styles.descriptionText}>{booking.notes}</Text>
            </Card>
          </View>
        )}

      </ScrollView>
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
    padding: 24,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    paddingBottom: 40,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 24,
  },
  codeText: {
    ...Typography.h2,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  statusWrapper: {
    marginBottom: 16,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    width: '100%',
  },
  alertText: {
    ...Typography.bodySm,
    color: Colors.error,
    marginLeft: 8,
    flex: 1,
  },
  proposedBox: {
    width: '100%',
    backgroundColor: '#FFF7ED',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginTop: 8,
  },
  proposedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proposedTitle: {
    ...Typography.bodyMedium,
    color: Colors.statusProposed,
    fontWeight: '700',
    marginLeft: 8,
  },
  proposedDesc: {
    ...Typography.bodySm,
    color: Colors.text,
    marginBottom: 12,
  },
  proposedDateValue: {
    ...Typography.h4,
    color: Colors.statusProposed,
    marginBottom: 8,
  },
  tailorNotes: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  proposedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 16,
  },
  detailCard: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  photoCard: {
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
});
