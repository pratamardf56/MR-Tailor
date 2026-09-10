/**
 * MR-Tailor — Booking Form Screen (Simple)
 *
 * Form booking sederhana: pilih jenis layanan, isi data, submit.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@/components/ui/DateTimePicker';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/auth/AuthContext';
import { formatDateFull } from '@/utils/format';

const DEFAULT_REQUESTED_DATE = new Date(Date.now() + 86400000 * 3);
const MIN_BOOKING_DATE = new Date(Date.now() + 86400000);

const SERVICE_TYPES = [
  { id: 'permak-celana',  label: 'Permak Celana',       icon: 'cut-outline' as const },
  { id: 'permak-baju',    label: 'Permak Baju / Kemeja', icon: 'shirt-outline' as const },
  { id: 'jahit-celana',   label: 'Jahit Celana Baru',    icon: 'layers-outline' as const },
  { id: 'jahit-kemeja',   label: 'Jahit Kemeja / Baju',  icon: 'construct-outline' as const },
  { id: 'jahit-jas',      label: 'Jahit Jas & Blazer',   icon: 'diamond-outline' as const },
  { id: 'jahit-gamis',    label: 'Jahit Gamis & Gaun',   icon: 'flower-outline' as const },
  { id: 'seragam',        label: 'Jahit Seragam',        icon: 'people-outline' as const },
  { id: 'lainnya',        label: 'Lainnya',              icon: 'ellipsis-horizontal-outline' as const },
];

export default function BookingScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { preselectedService, name: preName, phone: prePhone, date: preDate } =
    useLocalSearchParams<{ preselectedService?: string; name?: string; phone?: string; date?: string }>();

  const { createBooking } = useBookings();
  const { customer } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pilih jenis layanan
  const [selectedService, setSelectedService] = useState<string>(SERVICE_TYPES[0].id);

  // Form state
  const [name, setName]               = useState(customer?.name ?? preName ?? '');
  const [phone, setPhone]             = useState(customer?.whatsapp ?? prePhone ?? '');
  const [description, setDescription] = useState('');
  const [notes, setNotes]             = useState('');
  const [imageUri, setImageUri]       = useState<string | null>(null);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [date, setDate]               = useState<Date>(() => {
    if (preDate) {
      const parsed = new Date(preDate);
      if (!isNaN(parsed.getTime()) && parsed.getTime() >= MIN_BOOKING_DATE.getTime() - 86400000) {
        return parsed;
      }
    }
    return DEFAULT_REQUESTED_DATE;
  });

  // Prefill dari auth
  const [prefilledFor, setPrefilledFor] = useState<number | null>(customer?.id ?? null);
  if (customer && customer.id !== prefilledFor) {
    setPrefilledFor(customer.id);
    if (!name.trim()) setName(customer.name);
    if (!phone.trim()) setPhone(customer.whatsapp);
  }

  // Handle preselectedService param (dari halaman harga)
  useEffect(() => {
    if (preselectedService) {
      const match = SERVICE_TYPES.find(
        (s) => s.label.toLowerCase().includes(preselectedService.toLowerCase()) ||
               preselectedService.toLowerCase().includes(s.label.toLowerCase())
      );
      if (match) setSelectedService(match.id);
    }
  }, [preselectedService]);

  const activeService = SERVICE_TYPES.find((s) => s.id === selectedService) ?? SERVICE_TYPES[0];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim())        newErrors.name = 'Nama harus diisi';
    if (!phone.trim())       newErrors.phone = 'Nomor WhatsApp harus diisi';
    if (!description.trim()) newErrors.description = 'Detail pakaian harus diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin untuk mengakses galeri foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: Platform.OS === 'web',
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (Platform.OS === 'web' && asset.base64) {
        setImageUri(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
      } else {
        setImageUri(asset.uri);
      }
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Form Belum Lengkap', 'Mohon lengkapi semua field yang wajib diisi.');
      return;
    }
    try {
      setLoading(true);
      const bookingCode = await createBooking({
        customerName:   name.trim(),
        customerPhone:  phone.trim(),
        serviceType:    activeService.label,
        description:    `[${activeService.label}] ${description.trim()}`,
        requestedDate:  date,
        referencePhoto: imageUri,
        notes:          notes.trim(),
      });
      router.push({ pathname: '/booking-success', params: { bookingCode } });
    } catch (error: any) {
      Alert.alert('Gagal Booking', error.message || 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>BUAT PESANAN</Text>
            <Text style={styles.headerSub}>Pilih layanan & isi data pesanan</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(customer)')} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && { maxWidth: 600, alignSelf: 'center', width: '100%' },
        ]}
      >
        {/* ─── 1. Pilih Jenis Layanan ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionStep}>1</Text>
            <Text style={styles.sectionTitle}>Pilih Jenis Layanan</Text>
          </View>

          <View style={styles.serviceGrid}>
            {SERVICE_TYPES.map((svc) => {
              const active = selectedService === svc.id;
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.servicePill, active && styles.servicePillActive]}
                  onPress={() => setSelectedService(svc.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={svc.icon}
                    size={16}
                    color={active ? Colors.textOnPrimary : Colors.primary}
                  />
                  <Text style={[styles.servicePillText, active && styles.servicePillTextActive]}>
                    {svc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── 2. Data Pemesan ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionStep}>2</Text>
            <Text style={styles.sectionTitle}>Data Pemesan</Text>
          </View>

          <Input
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            value={name}
            onChangeText={setName}
            error={errors.name}
            required
          />

          <Input
            label="Nomor WhatsApp"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
            required
          />
          <Text style={styles.helperText}>
            Nomor ini digunakan penjahit untuk menghubungi Anda.
          </Text>

          {/* Tanggal */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tanggal Permintaan Selesai <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={19} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDateFull(date)}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                minimumDate={MIN_BOOKING_DATE}
                onChange={onDateChange}
              />
            )}
          </View>
        </View>

        {/* ─── 3. Detail Pakaian ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionStep}>3</Text>
            <Text style={styles.sectionTitle}>Detail Pakaian</Text>
          </View>

          <Input
            label="Deskripsi Model & Ukuran"
            placeholder={`Contoh: ${activeService.label} - ukuran pinggang 32, potong 3cm dari bawah, bahan katun...`}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            error={errors.description}
            required
          />

          <Input
            label="Catatan Khusus (Opsional)"
            placeholder="Permintaan khusus, warna benang, atau informasi tambahan lainnya."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />

          {/* Upload Foto */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Foto Referensi <Text style={styles.optional}>(Opsional)</Text>
            </Text>
            <TouchableOpacity style={styles.photoPicker} onPress={pickImage} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={28} color={Colors.textTertiary} />
                  <Text style={styles.photoPlaceholderText}>Tap untuk upload foto contoh pakaian</Text>
                </View>
              )}
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removePhoto}>
                <Ionicons name="trash-outline" size={13} color={Colors.error} />
                <Text style={styles.removePhotoText}>Hapus Foto</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ─── Submit ─── */}
        <View style={styles.submitSection}>
          <Button
            title={loading ? 'MEMPROSES...' : 'KIRIM PESANAN'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
          <Text style={styles.submitNote}>
            <Ionicons name="shield-checkmark-outline" size={12} color={Colors.textTertiary} />
            {' '}Pesanan masuk langsung ke dashboard penjahit untuk dikonfirmasi.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  /* Header */
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(74, 46, 34, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSub: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11 },
  closeBtn: { padding: 6 },

  /* Scroll */
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  /* Section */
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionStep: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    color: Colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  /* Service Pills */
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  servicePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  servicePillText: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  servicePillTextActive: { color: Colors.textOnPrimary },

  /* Form helpers */
  helperText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  inputGroup: { marginBottom: 14, gap: 6 },
  label: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  required: { color: Colors.error },
  optional: { color: Colors.textTertiary, fontWeight: '400' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.surfaceElevated,
  },
  dateText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 14,
    flex: 1,
  },

  /* Photo */
  photoPicker: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 100,
    backgroundColor: Colors.backgroundAlt,
  },
  photoPreview: { width: '100%', height: 160, resizeMode: 'cover' },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  photoPlaceholderText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
  },
  removePhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingLeft: 2,
  },
  removePhotoText: {
    ...Typography.caption,
    color: Colors.error,
    fontSize: 11,
    fontWeight: '600',
  },

  /* Submit */
  submitSection: { gap: 10, marginBottom: 8 },
  submitBtn: { borderRadius: 14 },
  submitNote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
  },
});
