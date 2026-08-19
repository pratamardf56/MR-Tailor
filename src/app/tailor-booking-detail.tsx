/**
 * Godabaya Tailor — Tailor Booking Detail Screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Platform, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@/components/ui/DateTimePicker';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { BookingStatus, BookingStatusType, RejectionReasons } from '@/constants/config';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useBookings } from '@/hooks/useBookings';
import { Booking } from '@/types';
import { formatDateFull } from '@/utils/format';
import { openWhatsApp, makePhoneCall } from '@/utils/linking';

export default function TailorBookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { getBookingById, acceptBooking, proposeAlternateDate, rejectBooking, updateBookingStatus } = useBookings();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Reject state
  const [rejectReason, setRejectReason] = useState<string>(RejectionReasons[0]);
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Propose Date state
  const [proposedDate, setProposedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tailorNotes, setTailorNotes] = useState('');

  const loadBooking = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const data = await getBookingById(id);
      setBooking(data);
      if (data) {
        setProposedDate(new Date(data.requestedDate));
      }
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setLoading(false);
    }
  }, [getBookingById]);

  useEffect(() => {
    if (bookingId) {
      // Data fetching effect with internal loading state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadBooking(parseInt(bookingId, 10));
    }
  }, [bookingId, loadBooking]);

  const handleAccept = async () => {
    if (!booking) return;
    try {
      setActionLoading(true);
      await acceptBooking(booking.id);
      Alert.alert('Berhasil', 'Pesanan telah diterima.');
      loadBooking(booking.id);
    } catch {
      Alert.alert('Error', 'Gagal menerima pesanan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!booking) return;
    const finalReason = rejectReason === 'Lainnya' ? customRejectReason : rejectReason;
    
    if (rejectReason === 'Lainnya' && !customRejectReason.trim()) {
      Alert.alert('Error', 'Mohon isi alasan penolakan.');
      return;
    }

    try {
      setActionLoading(true);
      await rejectBooking(booking.id, finalReason);
      setShowRejectModal(false);
      Alert.alert('Berhasil', 'Pesanan telah ditolak.');
      loadBooking(booking.id);
    } catch {
      Alert.alert('Error', 'Gagal menolak pesanan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeDate = async () => {
    if (!booking) return;
    try {
      setActionLoading(true);
      await proposeAlternateDate(booking.id, proposedDate, tailorNotes);
      setShowDateModal(false);
      Alert.alert('Berhasil', 'Tanggal alternatif telah diajukan ke pelanggan.');
      loadBooking(booking.id);
    } catch {
      Alert.alert('Error', 'Gagal mengajukan tanggal alternatif.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus: BookingStatusType) => {
    if (!booking) return;
    try {
      setActionLoading(true);
      await updateBookingStatus(booking.id, newStatus);
      setShowStatusModal(false);
      loadBooking(booking.id);
    } catch {
      Alert.alert('Error', 'Gagal mengubah status pesanan.');
    } finally {
      setActionLoading(false);
    }
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
        <Text style={styles.errorText}>Pesanan tidak ditemukan.</Text>
        <Button title="Kembali" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const renderStatusActions = () => {
    if (booking.status === BookingStatus.PENDING) {
      return (
        <View style={styles.actionRow}>
          <Button title="Terima" onPress={handleAccept} style={styles.flex1} />
          <Button title="Ubah Tanggal" variant="outline" onPress={() => setShowDateModal(true)} style={styles.flex1} />
          <Button title="Tolak" variant="danger" onPress={() => setShowRejectModal(true)} style={styles.flex1} />
        </View>
      );
    }

    if (booking.status === BookingStatus.ACCEPTED) {
      return (
        <Button 
          title="Mulai Kerjakan" 
          onPress={() => handleChangeStatus(BookingStatus.IN_PROGRESS)} 
          fullWidth 
        />
      );
    }

    if (booking.status === BookingStatus.IN_PROGRESS) {
      return (
        <Button 
          title="Tandai Selesai" 
          onPress={() => handleChangeStatus(BookingStatus.COMPLETED)} 
          fullWidth 
        />
      );
    }

    if (booking.status === BookingStatus.COMPLETED) {
      return (
        <Button 
          title="Tandai Sudah Diambil" 
          onPress={() => handleChangeStatus(BookingStatus.PICKED_UP)} 
          fullWidth 
          variant="outline"
        />
      );
    }

    return null;
  };

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
        <Text style={styles.headerTitle}>Detail Booking</Text>
        <TouchableOpacity onPress={() => setShowStatusModal(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Status */}
        <View style={styles.statusSection}>
          <Text style={styles.codeText}>{booking.code}</Text>
          <StatusBadge status={booking.status} />
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pemesan</Text>
          <Card padding={16}>
            <View style={styles.customerRow}>
              <View style={styles.customerIcon}>
                <Ionicons name="person" size={24} color={Colors.primary} />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{booking.customerName}</Text>
                <Text style={styles.customerPhone}>{booking.customerPhone}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity style={styles.contactBtn} onPress={() => makePhoneCall(booking.customerPhone)}>
                  <Ionicons name="call-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactBtn} onPress={() => openWhatsApp(booking.customerPhone, `Halo ${booking.customerName}, ini dari Godabaya Tailor terkait pesanan ${booking.code}.`)}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pesanan</Text>
          <Card padding={16} style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Layanan</Text>
              <Text style={styles.detailValue}>{booking.serviceType}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tanggal Diminta</Text>
              <Text style={styles.detailValue}>{formatDateFull(booking.requestedDate)}</Text>
            </View>
            
            {booking.proposedDate && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal Alternatif</Text>
                  <Text style={[styles.detailValue, { color: Colors.statusProposed }]}>
                    {formatDateFull(booking.proposedDate)}
                  </Text>
                </View>
              </>
            )}
            
            <View style={styles.divider} />
            <Text style={styles.detailLabel}>Deskripsi:</Text>
            <Text style={styles.descriptionText}>{booking.description}</Text>
            
            {booking.notes && (
              <>
                <View style={styles.divider} />
                <Text style={styles.detailLabel}>Catatan:</Text>
                <Text style={styles.descriptionText}>{booking.notes}</Text>
              </>
            )}
          </Card>
        </View>

        {/* Reference Photo */}
        {booking.referencePhoto && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Foto Referensi</Text>
            <Card padding={0} style={styles.photoCard}>
              <Image source={{ uri: booking.referencePhoto }} style={styles.photo} />
            </Card>
          </View>
        )}

      </ScrollView>

      {/* Action Footer */}
      {booking.status !== BookingStatus.REJECTED && booking.status !== BookingStatus.PICKED_UP && (
        <View style={styles.footer}>
          {renderStatusActions()}
        </View>
      )}

      {/* Reject Modal */}
      <Modal visible={showRejectModal} onClose={() => setShowRejectModal(false)} title="Tolak Pesanan">
        <Text style={styles.modalSub}>Pilih alasan penolakan untuk pesanan ini:</Text>
        
        {RejectionReasons.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[styles.radioItem, rejectReason === reason && styles.radioItemActive]}
            onPress={() => setRejectReason(reason)}
          >
            <Ionicons 
              name={rejectReason === reason ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={rejectReason === reason ? Colors.primary : Colors.textTertiary} 
            />
            <Text style={styles.radioText}>{reason}</Text>
          </TouchableOpacity>
        ))}

        {rejectReason === 'Lainnya' && (
          <Input
            placeholder="Ketik alasan penolakan..."
            value={customRejectReason}
            onChangeText={setCustomRejectReason}
            multiline
            numberOfLines={3}
            containerStyle={{ marginTop: 12 }}
          />
        )}

        <View style={styles.modalActions}>
          <Button title="Batal" variant="outline" onPress={() => setShowRejectModal(false)} style={styles.flex1} />
          <Button title="Tolak" variant="danger" onPress={handleReject} loading={actionLoading} style={styles.flex1} />
        </View>
      </Modal>

      {/* Propose Date Modal */}
      <Modal visible={showDateModal} onClose={() => setShowDateModal(false)} title="Usulkan Tanggal Lain">
        <Text style={styles.modalSub}>Pelanggan meminta tanggal {formatDateFull(booking.requestedDate)}.</Text>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Pilih Tanggal Baru</Text>
          <TouchableOpacity 
            style={styles.dateSelector} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.dateText}>{formatDateFull(proposedDate)}</Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={proposedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setProposedDate(date);
              }}
            />
          )}
        </View>

        <Input
          label="Catatan untuk Pelanggan (Opsional)"
          placeholder="Maaf, jadwal kami penuh pada tanggal tersebut..."
          value={tailorNotes}
          onChangeText={setTailorNotes}
          multiline
          numberOfLines={3}
        />

        <View style={styles.modalActions}>
          <Button title="Batal" variant="outline" onPress={() => setShowDateModal(false)} style={styles.flex1} />
          <Button title="Kirim Usulan" onPress={handleProposeDate} loading={actionLoading} style={styles.flex1} />
        </View>
      </Modal>

      {/* Status override Modal (for manual adjustments if needed) */}
      <Modal visible={showStatusModal} onClose={() => setShowStatusModal(false)} title="Ubah Status Manual">
        <Text style={styles.modalSub}>Status saat ini: {booking.status}</Text>
        
        {Object.entries(BookingStatus).map(([key, val]) => (
          <TouchableOpacity
            key={key}
            style={[styles.radioItem, booking.status === val && styles.radioItemActive]}
            onPress={() => handleChangeStatus(val as BookingStatusType)}
          >
            <Ionicons 
              name={booking.status === val ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={booking.status === val ? Colors.primary : Colors.textTertiary} 
            />
            <Text style={styles.radioText}>{val}</Text>
          </TouchableOpacity>
        ))}
      </Modal>

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
    padding: 24,
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
    paddingBottom: 40,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 16,
  },
  codeText: {
    ...Typography.h3,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(27, 42, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  customerPhone: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 4,
  },
  photoCard: {
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  footer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  modalSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundAlt,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  radioItemActive: {
    backgroundColor: 'rgba(27, 42, 74, 0.05)',
    borderColor: Colors.primary,
  },
  radioText: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  label: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateText: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: 10,
  },
});
