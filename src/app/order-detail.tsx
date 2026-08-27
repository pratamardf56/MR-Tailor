/**
 * Godabaya Tailor — Order Detail
 * Redesigned to match the reference UI in Image 2
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TextInput, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { BookingStatus } from '@/constants/config';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/auth/AuthContext';
import { Booking } from '@/types';
import { formatDateFull, formatDateShort, formatTime, formatPhone } from '@/utils/format';
import { openWhatsApp } from '@/utils/linking';
import { whatsAppVariants } from '@/utils/phone';

export default function OrderDetailScreen() {
  const { bookingCode } = useLocalSearchParams<{ bookingCode: string }>();
  const { getBookingByCode, customerAcceptDate, customerRejectDate, getBookingsByCustomer } = useBookings();
  const { customer, login } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Quick lookup state
  const [cekWhatsapp, setCekWhatsapp] = useState(customer?.whatsapp || '');
  const [cekPin, setCekPin] = useState('');
  const [cekShowPin, setCekShowPin] = useState(false);
  const [cekLoading, setCekLoading] = useState(false);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadBooking(bookingCode);
    }
  }, [bookingCode, loadBooking]);

  const handleQuickLookup = async () => {
    if (!cekWhatsapp.trim() || !cekPin.trim()) {
      Alert.alert('Error', 'Mohon isi nomor WhatsApp dan PIN.');
      return;
    }
    try {
      setCekLoading(true);
      const loggedInCustomer = await login(cekWhatsapp, cekPin);
      
      // Load current customer's latest booking
      const list = await getBookingsByCustomer(loggedInCustomer.id, loggedInCustomer.whatsapp);
      if (list && list.length > 0) {
        // Clear PIN input after successful lookup
        setCekPin('');
        router.setParams({ bookingCode: list[0].code });
        loadBooking(list[0].code);
      } else {
        Alert.alert('Info', 'Pelanggan ini belum memiliki pesanan.');
      }
    } catch {
      Alert.alert('Gagal', 'Data yang dimasukkan tidak sesuai.');
    } finally {
      setCekLoading(false);
    }
  };

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

  const formatDateTimeWIB = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${formatDateShort(d)}\n${formatTime(d)} WIB`;
    } catch {
      return dateStr;
    }
  };

  // Helper to determine active step
  const isStepActive = (step: number, status: string) => {
    if (step === 1) return true; // Diterima is always active if created
    if (step === 2) {
      return [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.PICKED_UP].includes(status as any);
    }
    if (step === 3) {
      return [BookingStatus.COMPLETED, BookingStatus.PICKED_UP].includes(status as any);
    }
    if (step === 4) {
      return status === BookingStatus.PICKED_UP;
    }
    return false;
  };

  // Timeline date labels helper
  const getTimelineDate = (step: number, b: Booking) => {
    try {
      const createdDate = new Date(b.createdAt);
      const targetDate = new Date(b.proposedDate || b.requestedDate);
      
      if (step === 1) {
        return formatDateTimeWIB(b.createdAt);
      }
      if (step === 2) {
        if (isStepActive(2, b.status)) {
          return formatDateTimeWIB(b.updatedAt);
        } else {
          const estDate = new Date(createdDate.getTime() + 86400000);
          return `Estimasi\n${formatDateShort(estDate)}`;
        }
      }
      if (step === 3) {
        if (isStepActive(3, b.status)) {
          return formatDateTimeWIB(b.updatedAt);
        } else {
          let estTime = targetDate.getTime() - 86400000;
          if (estTime <= createdDate.getTime() + 86400000) {
            estTime = targetDate.getTime();
          }
          return `Estimasi\n${formatDateShort(new Date(estTime))}`;
        }
      }
      if (step === 4) {
        if (isStepActive(4, b.status)) {
          return formatDateTimeWIB(b.updatedAt);
        } else {
          return `Estimasi\n${formatDateShort(targetDate)}`;
        }
      }
    } catch {
      return '-';
    }
    return '-';
  };

  // Dynamic Info Box Message
  const getStatusInfoMessage = (status: string) => {
    switch (status) {
      case BookingStatus.PENDING:
        return 'Pesanan Anda menunggu konfirmasi penjahit. Kami akan memverifikasi jadwal dan detail pengerjaan pesanan Anda segera.';
      case BookingStatus.ACCEPTED:
        return 'Pesanan Anda telah diterima oleh penjahit kami. Pekerjaan Anda sedang dimasukkan ke dalam daftar antrean pengerjaan.';
      case BookingStatus.DATE_PROPOSED:
        return 'Penjahit mengusulkan tanggal alternatif penyelesaian. Silakan periksa usulan tanggal dan lakukan konfirmasi persetujuan di bawah ini.';
      case BookingStatus.REJECTED:
        return 'Mohon maaf, pesanan Anda tidak dapat kami proses saat ini. Silakan periksa catatan alasan penolakan di atas.';
      case BookingStatus.WAITING_WORK:
        return 'Pesanan Anda sudah disetujui dan saat ini sedang menunggu giliran pengerjaan sesuai antrean penjahit.';
      case BookingStatus.IN_PROGRESS:
        return 'Pesanan Anda sedang diproses. Penjahit kami sedang mengerjakan pesanan Anda dengan teliti. Kami akan memberitahu Anda jika pesanan sudah selesai.';
      case BookingStatus.COMPLETED:
        return 'Selesai jahit! Pakaian Anda sudah selesai dikerjakan dengan rapi dan saat ini siap untuk diambil di workshop kami.';
      case BookingStatus.PICKED_UP:
        return 'Pesanan Anda sudah berhasil diambil. Terima kasih banyak telah mempercayai layanan jahit dari Godabaya Tailor!';
      default:
        return 'Status pesanan Anda sedang diperbarui. Silakan pantau perkembangan pengerjaan secara berkala.';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons 
          name="arrow-back" 
          size={22} 
          color={Colors.text} 
          onPress={() => router.back()} 
          style={styles.backBtn}
        />
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ═══ BOX 1: QUICK LOOKUP BAR ("Cek Pesanan Anda") ═══ */}
        <View style={styles.lookupSection}>
          <Text style={styles.lookupTitle}>Cek Pesanan Anda</Text>
          <Text style={styles.lookupSubtitle}>Masukkan nomor WhatsApp dan PIN Anda untuk melihat detail pesanan.</Text>
          
          <View style={styles.lookupForm}>
            {/* WhatsApp Input */}
            <View style={styles.lookupField}>
              <Text style={styles.lookupLabel}>Nomor WhatsApp</Text>
              <View style={styles.lookupInputBox}>
                <Ionicons name="logo-whatsapp" size={16} color={Colors.textTertiary} style={styles.lookupInputIcon} />
                <TextInput
                  placeholder="Contoh: 081234567890"
                  placeholderTextColor={Colors.textTertiary}
                  value={cekWhatsapp}
                  onChangeText={setCekWhatsapp}
                  keyboardType="phone-pad"
                  style={styles.lookupTextInput}
                />
              </View>
            </View>

            {/* PIN Input with show/hide eye toggle */}
            <View style={styles.lookupField}>
              <Text style={styles.lookupLabel}>PIN</Text>
              <View style={styles.lookupInputBox}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.textTertiary} style={styles.lookupInputIcon} />
                <TextInput
                  placeholder="Masukkan PIN Anda"
                  placeholderTextColor={Colors.textTertiary}
                  value={cekPin}
                  onChangeText={setCekPin}
                  secureTextEntry={!cekShowPin}
                  keyboardType="numeric"
                  maxLength={6}
                  style={[styles.lookupTextInput, { paddingRight: 32 }]}
                />
                <TouchableOpacity 
                  onPress={() => setCekShowPin(!cekShowPin)} 
                  style={styles.lookupEyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={cekShowPin ? "eye-off-outline" : "eye-outline"} 
                    size={16} 
                    color={Colors.textTertiary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={styles.lookupSubmitBtn}
              onPress={handleQuickLookup}
              activeOpacity={0.85}
              disabled={cekLoading}
            >
              <Text style={styles.lookupSubmitText}>
                {cekLoading ? 'MEMUAT...' : 'LIHAT PESANAN'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lookupPrivacy}>
            <Ionicons name="shield-checkmark-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.lookupPrivacyText}>Data Anda aman dan tidak akan dibagikan ke pihak lain.</Text>
          </View>
        </View>

        {!booking ? (
          <View style={styles.emptyDetailContainer}>
            <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.errorText}>Pesanan tidak ditemukan.</Text>
            <Text style={styles.errorSubText}>Silakan gunakan kolom di atas untuk mencari pesanan Anda.</Text>
          </View>
        ) : accessDenied ? (
          <View style={styles.emptyDetailContainer}>
            <Ionicons name="lock-closed-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.errorText}>Akses Ditolak</Text>
            <Text style={styles.errorSubText}>Pesanan ini bukan milik akun Anda. Silakan login kembali.</Text>
          </View>
        ) : (
          <View style={styles.detailContainer}>
            
            {/* ═══ BOX 3: STATUS PESANAN (TIMELINE & BADGE) ═══ */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Status Pesanan</Text>
                <StatusBadge status={booking.status} />
              </View>

              {/* Order Meta Info */}
              <View style={styles.orderMetaContainer}>
                <Text style={styles.metaValue}>Kode Pesanan: #{booking.code}</Text>
                <Text style={styles.metaDate}>
                  Dipesan pada {formatDateFull(booking.createdAt)}
                </Text>
              </View>

              {/* Connecting progress timeline */}
              <View style={styles.timelineWrapper}>
                {/* Connecting lines */}
                <View style={styles.timelineLinesContainer}>
                  <View style={[styles.timelineLine, isStepActive(2, booking.status) && styles.timelineLineActive]} />
                  <View style={[styles.timelineLine, isStepActive(3, booking.status) && styles.timelineLineActive]} />
                  <View style={[styles.timelineLine, isStepActive(4, booking.status) && styles.timelineLineActive]} />
                </View>

                {/* Timeline Nodes */}
                <View style={styles.timelineNodesRow}>
                  {/* Step 1: Diterima */}
                  <View style={styles.timelineNode}>
                    <View style={[styles.timelineNodeCircle, styles.timelineNodeCircleActive]}>
                      <Ionicons name="checkmark-sharp" size={14} color={Colors.textOnPrimary} />
                    </View>
                    <Text style={[styles.timelineNodeLabel, styles.timelineNodeLabelActive]}>Diterima</Text>
                    <Text style={styles.timelineNodeDate}>{getTimelineDate(1, booking)}</Text>
                  </View>

                  {/* Step 2: Diproses */}
                  <View style={styles.timelineNode}>
                    <View style={[styles.timelineNodeCircle, isStepActive(2, booking.status) && styles.timelineNodeCircleActive]}>
                      <Ionicons name="cut-outline" size={14} color={isStepActive(2, booking.status) ? Colors.textOnPrimary : Colors.textTertiary} />
                    </View>
                    <Text style={[styles.timelineNodeLabel, isStepActive(2, booking.status) && styles.timelineNodeLabelActive]}>Diproses</Text>
                    <Text style={styles.timelineNodeDate}>{getTimelineDate(2, booking)}</Text>
                  </View>

                  {/* Step 3: Selesai Jahit */}
                  <View style={styles.timelineNode}>
                    <View style={[styles.timelineNodeCircle, isStepActive(3, booking.status) && styles.timelineNodeCircleActive]}>
                      <Ionicons name="shirt-outline" size={14} color={isStepActive(3, booking.status) ? Colors.textOnPrimary : Colors.textTertiary} />
                    </View>
                    <Text style={[styles.timelineNodeLabel, isStepActive(3, booking.status) && styles.timelineNodeLabelActive]}>Selesai Jahit</Text>
                    <Text style={styles.timelineNodeDate}>{getTimelineDate(3, booking)}</Text>
                  </View>

                  {/* Step 4: Siap Diambil */}
                  <View style={styles.timelineNode}>
                    <View style={[styles.timelineNodeCircle, isStepActive(4, booking.status) && styles.timelineNodeCircleActive]}>
                      <Ionicons name="gift-outline" size={14} color={isStepActive(4, booking.status) ? Colors.textOnPrimary : Colors.textTertiary} />
                    </View>
                    <Text style={[styles.timelineNodeLabel, isStepActive(4, booking.status) && styles.timelineNodeLabelActive]}>Siap Diambil</Text>
                    <Text style={styles.timelineNodeDate}>{getTimelineDate(4, booking)}</Text>
                  </View>
                </View>
              </View>

              {/* Status explanation notice box */}
              <View style={styles.statusInfoBox}>
                <Ionicons name="information-circle" size={18} color={Colors.primary} style={styles.statusInfoIcon} />
                <Text style={styles.statusInfoText}>
                  {getStatusInfoMessage(booking.status)}
                </Text>
              </View>

              {/* Rejected Rejection Reason alert */}
              {booking.status === BookingStatus.REJECTED && booking.rejectionReason && (
                <View style={styles.alertBox}>
                  <Ionicons name="alert-circle" size={18} color={Colors.error} />
                  <Text style={styles.alertText}>
                    Alasan Penolakan: &quot;{booking.rejectionReason}&quot;
                  </Text>
                </View>
              )}

              {/* DATE_PROPOSED actions */}
              {booking.status === BookingStatus.DATE_PROPOSED && (
                <View style={styles.proposedBox}>
                  <View style={styles.proposedHeader}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.statusProposed} />
                    <Text style={styles.proposedTitle}>Penjahit Mengusulkan Tanggal Lain</Text>
                  </View>
                  <Text style={styles.proposedDesc}>
                    Kami tidak dapat menyelesaikan pesanan pada tanggal yang diminta. Kami mengusulkan tanggal selesai baru:
                  </Text>
                  <Text style={styles.proposedDateValue}>
                    {booking.proposedDate ? formatDateFull(booking.proposedDate) : '-'}
                  </Text>
                  
                  {booking.tailorNotes && (
                    <Text style={styles.proposedNotes}>Catatan: &quot;{booking.tailorNotes}&quot;</Text>
                  )}

                  <View style={styles.proposedActions}>
                    <TouchableOpacity 
                      style={styles.btnAccept}
                      onPress={handleAcceptDate}
                      disabled={actionLoading}
                    >
                      <Text style={styles.btnAcceptText}>Setujui Tanggal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.btnReject}
                      onPress={handleRejectDate}
                      disabled={actionLoading}
                    >
                      <Text style={styles.btnRejectText}>Tolak (Batal)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* ═══ BOX 2: DETAIL PESANAN ANDA ═══ */}
            <View style={styles.sectionContainer}>
              <View style={styles.detailCardHeader}>
                <Ionicons name="clipboard-outline" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Detail Pesanan Anda</Text>
              </View>

              <Card padding={0} style={styles.detailCard}>
                {/* 1. Nama Pemesan */}
                <View style={styles.detailItemRow}>
                  <Ionicons name="person-outline" size={16} color={Colors.textTertiary} style={styles.detailItemIcon} />
                  <View style={styles.detailItemContent}>
                    <Text style={styles.detailItemLabel}>Nama Pemesan</Text>
                    <Text style={styles.detailItemValue}>{booking.customerName}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />

                {/* 2. Nomor WhatsApp */}
                <View style={styles.detailItemRow}>
                  <Ionicons name="logo-whatsapp" size={16} color={Colors.textTertiary} style={styles.detailItemIcon} />
                  <View style={styles.detailItemContent}>
                    <Text style={styles.detailItemLabel}>Nomor WhatsApp</Text>
                    <Text style={styles.detailItemValue}>{formatPhone(booking.customerPhone)}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />

                {/* 3. Layanan */}
                <View style={styles.detailItemRow}>
                  <Ionicons name="cut-outline" size={16} color={Colors.textTertiary} style={styles.detailItemIcon} />
                  <View style={styles.detailItemContent}>
                    <Text style={styles.detailItemLabel}>Layanan</Text>
                    <Text style={styles.detailItemValue}>{booking.serviceType}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />

                {/* 4. Detail Pesanan */}
                <View style={styles.detailItemRow}>
                  <Ionicons name="shirt-outline" size={16} color={Colors.textTertiary} style={styles.detailItemIcon} />
                  <View style={styles.detailItemContent}>
                    <Text style={styles.detailItemLabel}>Detail Pesanan</Text>
                    <Text style={[styles.detailItemValue, styles.detailItemTextWrap]}>{booking.description}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />

                {/* 5. Tanggal Ambil */}
                <View style={styles.detailItemRow}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.textTertiary} style={styles.detailItemIcon} />
                  <View style={styles.detailItemContent}>
                    <Text style={styles.detailItemLabel}>Tanggal Ambil</Text>
                    <Text style={styles.detailItemValue}>
                      {formatDateFull(booking.proposedDate || booking.requestedDate)}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />

                {/* 6. Catatan */}
                <View style={[styles.detailItemRow, { borderBottomWidth: 0 }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.textTertiary} style={styles.detailItemIcon} />
                  <View style={styles.detailItemContent}>
                    <Text style={styles.detailItemLabel}>Catatan</Text>
                    <Text style={[styles.detailItemValue, styles.detailItemTextWrap]}>
                      {booking.notes || 'Tidak ada catatan.'}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Photo Reference (If Uploaded) */}
            {booking.referencePhoto && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Foto Referensi Pakaian</Text>
                <Card padding={0} style={styles.photoCard}>
                  <Image source={{ uri: booking.referencePhoto }} style={styles.photo} />
                </Card>
              </View>
            )}

            {/* ═══ HELP BANNER / WHATSAPP CONTACT ═══ */}
            <View style={styles.helpSection}>
              <View style={styles.helpLeft}>
                <View style={styles.helpIconBox}>
                  <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpTitle}>Butuh bantuan?</Text>
                  <Text style={styles.helpSubtitle}>Hubungi kami melalui WhatsApp jika ada pertanyaan.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.helpBtn}
                onPress={() => openWhatsApp('081214386602', `Halo Godabaya Tailor, saya ingin bertanya terkait pesanan saya dengan kode ${booking.code}.`)}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={14} color={Colors.text} style={{ marginRight: 4 }} />
                <Text style={styles.helpBtnText}>Hubungi Kami</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background, // Cream base background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  emptyDetailContainer: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 6,
    fontWeight: '800',
  },
  errorSubText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.bodyMedium,
    fontWeight: '800',
    color: Colors.text,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ─── BOX 1: QUICK LOOKUP BAR ──────────────────────
  lookupSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 16,
  },
  lookupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  lookupSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
    marginBottom: 14,
  },
  lookupForm: {
    gap: 12,
  },
  lookupField: {
    gap: 4,
  },
  lookupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  lookupInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    position: 'relative',
  },
  lookupInputIcon: {
    marginRight: 6,
  },
  lookupTextInput: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
    height: '100%',
    padding: 0,
  },
  lookupEyeBtn: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  lookupSubmitBtn: {
    backgroundColor: Colors.primary, // Dark brown solid background
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  lookupSubmitText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  lookupPrivacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  lookupPrivacyText: {
    fontSize: 9,
    color: Colors.textTertiary,
  },

  // Detail screen content container
  detailContainer: {
    gap: 16,
  },

  // ─── SECTION BOX WRAPPER ───────────────────────────
  sectionContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Meta info
  orderMetaContainer: {
    flexDirection: 'column',
    gap: 3,
    marginBottom: 20,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  metaDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // ─── TIMELINE COMPONENT ─────────────────────────────
  timelineWrapper: {
    position: 'relative',
    marginVertical: 10,
    paddingBottom: 8,
  },
  timelineLinesContainer: {
    position: 'absolute',
    left: '12.5%',
    right: '12.5%',
    top: 17, // aligned to circle center
    height: 3,
    backgroundColor: Colors.borderLight,
    flexDirection: 'row',
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    height: '100%',
    backgroundColor: Colors.borderLight,
  },
  timelineLineActive: {
    backgroundColor: Colors.success,
  },
  timelineNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  timelineNode: {
    width: '25%',
    alignItems: 'center',
  },
  timelineNodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineNodeCircleActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  timelineNodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 26,
  },
  timelineNodeLabelActive: {
    color: Colors.text,
  },
  timelineNodeDate: {
    fontSize: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 10,
  },

  // Info status box
  statusInfoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.background, // Light cream box
    padding: 12,
    borderRadius: 10,
    alignItems: 'flex-start',
    marginTop: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusInfoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  statusInfoText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },

  // Alert rejection
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  alertText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
    flex: 1,
  },

  // Date proposed alternative box
  proposedBox: {
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginTop: 14,
    gap: 8,
  },
  proposedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proposedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.statusProposed,
  },
  proposedDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  proposedDateValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.statusProposed,
  },
  proposedNotes: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  proposedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnAccept: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAcceptText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textOnPrimary,
  },
  btnReject: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRejectText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },

  // ─── BOX 2: DETAIL PESANAN CARD ────────────────────
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailCard: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  detailItemRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
  },
  detailItemIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  detailItemContent: {
    flex: 1,
  },
  detailItemLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  detailItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 19,
  },
  detailItemTextWrap: {
    fontStyle: 'italic',
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  // Photo Reference
  photoCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  photo: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },

  // ─── HELP BANNER CARD ──────────────────────────────
  helpSection: {
    backgroundColor: Colors.backgroundAlt, // light beige background
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  helpIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 46, 34, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
  },
  helpSubtitle: {
    fontSize: 9,
    color: Colors.textSecondary,
    lineHeight: 12,
    marginTop: 1,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  helpBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text,
  },
});
