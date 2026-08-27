/**
 * Godabaya Tailor — Booking Form Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, useWindowDimensions } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@/components/ui/DateTimePicker';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { ServiceCategories } from '@/constants/config';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/auth/AuthContext';
import { formatDateFull } from '@/utils/format';

const DEFAULT_REQUESTED_DATE = new Date(Date.now() + 86400000 * 3);
const MIN_BOOKING_DATE = new Date(Date.now() + 86400000);

export default function BookingScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const {
    preselectedService,
    name: preName,
    phone: prePhone,
    date: preDate,
  } = useLocalSearchParams<{ preselectedService?: string; name?: string; phone?: string; date?: string }>();
  const { createBooking } = useBookings();
  const { customer } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [name, setName] = useState(customer?.name ?? preName ?? '');
  const [phone, setPhone] = useState(customer?.whatsapp ?? prePhone ?? '');
  const [pin, setPin] = useState('');
  const [service, setService] = useState(
    preselectedService && ServiceCategories.includes(preselectedService as any)
      ? preselectedService
      : ServiceCategories[0]
  );
  const [prevPreselectedService, setPrevPreselectedService] = useState<string | undefined>(preselectedService);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(() => {
    if (preDate) {
      const parsed = new Date(preDate);
      if (!isNaN(parsed.getTime()) && parsed.getTime() >= MIN_BOOKING_DATE.getTime() - 86400000) {
        return parsed;
      }
    }
    return DEFAULT_REQUESTED_DATE;
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  
  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (preselectedService && preselectedService !== prevPreselectedService) {
    setPrevPreselectedService(preselectedService);
    if (ServiceCategories.includes(preselectedService as any)) {
      setService(preselectedService);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nama harus diisi';
    if (!phone.trim()) newErrors.phone = 'Nomor WhatsApp harus diisi';
    if (!pin.trim() || pin.trim().length < 4 || pin.trim().length > 6 || !/^\d+$/.test(pin.trim())) {
      newErrors.pin = 'PIN harus 4-6 angka';
    }
    if (!description.trim()) newErrors.description = 'Deskripsi pesanan harus diisi';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
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
        const mime = asset.mimeType || 'image/jpeg';
        setImageUri(`data:${mime};base64,${asset.base64}`);
      } else {
        setImageUri(asset.uri);
      }
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Mohon lengkapi semua field yang wajib diisi dengan benar.');
      return;
    }

    try {
      setLoading(true);
      const bookingCode = await createBooking({
        customerId: customer?.id ?? null,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        pin: pin.trim(),
        serviceType: service,
        description: description.trim(),
        requestedDate: date,
        referencePhoto: imageUri,
        notes: notes.trim(),
      });
      
      // Navigate to success screen
      router.push({ pathname: '/booking-success', params: { bookingCode } });
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      Alert.alert('Error', error.message || 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Page Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Ionicons name="cut-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>BOOKING JAHITAN</Text>
            <Text style={styles.subtitle}>Isi data pesanan Anda dengan lengkap agar kami dapat memproses kebutuhan jahitan Anda.</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(customer)')} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={isDesktop ? styles.desktopContainer : styles.mobileContainer}>
          
          {/* KOLOM KIRI — Form */}
          <View style={isDesktop ? styles.leftColumn : styles.fullColumn}>
            
            {/* Card: Data Pesanan */}
            <View style={[styles.formCard, isDesktop ? styles.formCardDesktop : styles.formCardMobile]}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>DATA PESANAN</Text>
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
                <Ionicons name="information-circle-outline" size={12} color={Colors.textTertiary} />
                {' '}Nomor ini digunakan untuk melihat pesanan Anda.
              </Text>
              
              <Input
                label="PIN"
                placeholder="Masukkan PIN 4–6 digit"
                value={pin}
                onChangeText={setPin}
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                error={errors.pin}
                required
              />
              <Text style={styles.helperText}>
                <Ionicons name="lock-closed-outline" size={12} color={Colors.textTertiary} />
                {' '}PIN digunakan untuk mengakses pesanan Anda.
              </Text>

              <View style={styles.divider} />

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Jenis Layanan <Text style={styles.required}>*</Text></Text>
                <View style={styles.serviceChips}>
                  {ServiceCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.serviceChip, service === cat && styles.serviceChipActive]}
                      onPress={() => setService(cat)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.serviceChipText, service === cat && styles.serviceChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tanggal Pengambilan / Selesai <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity 
                  style={styles.dateSelector} 
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
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

              <Input
                label="Detail Pakaian"
                placeholder="Contoh: Kemeja lengan panjang, bahan katun, ukuran L..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                error={errors.description}
                required
              />

              <Input
                label="Catatan Tambahan"
                placeholder="Tambahkan permintaan khusus jika ada."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />

              {/* Foto Referensi */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Foto Referensi <Text style={styles.optional}>(Opsional)</Text></Text>
                <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImage} activeOpacity={0.8}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color={Colors.textTertiary} />
                      <Text style={styles.photoPlaceholderText}>Tap untuk memilih foto</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {imageUri && (
                  <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removePhotoBtn}>
                    <Ionicons name="trash-outline" size={14} color={Colors.error} />
                    <Text style={styles.removePhotoText}>Hapus Foto</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

          </View>

          {/* KOLOM KANAN — Ringkasan */}
          <View style={isDesktop ? styles.rightColumn : styles.fullColumn}>
            
            <View style={[styles.summaryWrapper, isDesktop ? styles.summaryWrapperDesktop : styles.summaryWrapperMobile]}>
              {/* Ringkasan Pesanan */}
              <View style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>RINGKASAN PESANAN</Text>
                </View>
                
                {name || phone || description ? (
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Nama</Text>
                      <Text style={styles.summaryValue}>{name || '-'}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>WhatsApp</Text>
                      <Text style={styles.summaryValue}>{phone || '-'}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Layanan</Text>
                      <Text style={styles.summaryValue}>{service}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tanggal</Text>
                      <Text style={styles.summaryValue}>{formatDateFull(date)}</Text>
                    </View>
                    {description ? (
                      <>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Detail</Text>
                          <Text style={[styles.summaryValue, { flex: 2 }]} numberOfLines={3}>{description}</Text>
                        </View>
                      </>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.emptySummaryBox}>
                    <Ionicons name="clipboard-outline" size={28} color={Colors.textTertiary} />
                    <Text style={styles.emptySummary}>Ringkasan pesanan akan muncul setelah Anda mengisi form.</Text>
                  </View>
                )}
              </View>

              {/* Data Aman */}
              <View style={styles.privacyCard}>
                <View style={styles.privacyIconBox}>
                  <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
                </View>
                <View style={styles.privacyTextContent}>
                  <Text style={styles.privacyTitle}>DATA ANDA AMAN 🔒</Text>
                  <Text style={styles.privacyDesc}>Data pesanan Anda hanya dapat diakses menggunakan informasi yang sesuai.</Text>
                </View>
              </View>
            </View>

          </View>

        </View>

        {/* Submit Button */}
        <View style={[styles.submitContainer, isDesktop && styles.desktopSubmitContainer]}>
          <Button 
            title="KIRIM PESANAN" 
            onPress={handleSubmit} 
            loading={loading}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,  // Cream
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(74,46,34,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.h4,
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },

  scrollContent: {
    paddingBottom: 40,
  },
  desktopContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mobileContainer: {
    flexDirection: 'column',
    paddingTop: 4,
  },
  leftColumn: {
    flex: 2,
  },
  rightColumn: {
    flex: 1,
  },
  fullColumn: {
    width: '100%',
  },

  // Form Card
  formCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  formCardDesktop: {
    borderRadius: 20,
    padding: 24,
    marginTop: 0,
  },
  formCardMobile: {
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    marginTop: 0,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  required: {
    color: Colors.error,
  },
  optional: {
    color: Colors.textTertiary,
    fontWeight: '400',
    fontSize: 12,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: -8,
    marginBottom: 14,
    lineHeight: 16,
  },
  serviceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  serviceChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  serviceChipText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  serviceChipTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  dateText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },

  // Photo picker
  photoPickerBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 110,
  },
  photoPreview: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    gap: 8,
  },
  photoPlaceholderText: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  removePhotoText: {
    ...Typography.caption,
    color: Colors.error,
  },

  // Summary
  summaryWrapper: {},
  summaryWrapperDesktop: {
    paddingTop: 0,
    gap: 16,
  },
  summaryWrapperMobile: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryContent: {
    gap: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  summaryLabel: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    width: 75,
    flexShrink: 0,
  },
  summaryValue: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptySummaryBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptySummary: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  privacyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(74,46,34,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  privacyTextContent: {
    flex: 1,
  },
  privacyTitle: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 3,
  },
  privacyDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // Submit
  submitContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  desktopSubmitContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  submitBtn: {
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});
