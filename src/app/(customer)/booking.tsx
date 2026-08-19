/**
 * Godabaya Tailor — Booking Form Screen
 */

import React, { useState, useEffect } from 'react';
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

  const { preselectedService } = useLocalSearchParams<{ preselectedService?: string }>();
  const { createBooking } = useBookings();
  const { customer } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Form state
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.whatsapp ?? '');
  const [pin, setPin] = useState('');
  const [service, setService] = useState(
    preselectedService && ServiceCategories.includes(preselectedService as any)
      ? preselectedService
      : ServiceCategories[0]
  );
  const [prevPreselectedService, setPrevPreselectedService] = useState<string | undefined>(preselectedService);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(DEFAULT_REQUESTED_DATE);
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
      <View style={styles.header}>
        <Text style={styles.title}>Booking Jahitan</Text>
        <Text style={styles.subtitle}>Isi data pesanan Anda dengan lengkap agar kami dapat memproses kebutuhan jahitan Anda.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={isDesktop ? styles.desktopContainer : styles.mobileContainer}>
          
          {/* KOLOM KIRI (Form) */}
          <View style={isDesktop ? styles.leftColumn : styles.fullColumn}>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informasi Pemesan</Text>
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
              <Text style={styles.helperText}>Nomor ini digunakan untuk melihat pesanan Anda.</Text>
              
              <Input
                label="PIN"
                placeholder="••••"
                value={pin}
                onChangeText={setPin}
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                error={errors.pin}
                required
              />
              <Text style={styles.helperText}>PIN (4-6 angka) digunakan untuk mengakses pesanan Anda.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detail Pesanan</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Jenis Layanan <Text style={styles.required}>*</Text></Text>
                <View style={styles.serviceChips}>
                  {ServiceCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.serviceChip, service === cat && styles.serviceChipActive]}
                      onPress={() => setService(cat)}
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
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.dateText}>{formatDateFull(date)}</Text>
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
                placeholder="Tambahkan catatan jika ada permintaan khusus."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>

          </View>

          {/* KOLOM KANAN (Ringkasan) */}
          <View style={isDesktop ? styles.rightColumn : styles.fullColumn}>
            
            <View style={[styles.section, isDesktop && { paddingTop: 0 }]}>
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
                
                {name || phone || description ? (
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Nama:</Text>
                      <Text style={styles.summaryValue}>{name || '-'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>WhatsApp:</Text>
                      <Text style={styles.summaryValue}>{phone || '-'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Layanan:</Text>
                      <Text style={styles.summaryValue}>{service}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tanggal:</Text>
                      <Text style={styles.summaryValue}>{formatDateFull(date)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Detail:</Text>
                      <Text style={styles.summaryValue}>{description || '-'}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.emptySummary}>Ringkasan pesanan akan muncul setelah Anda mengisi form.</Text>
                )}
              </View>

              <View style={styles.privacyCard}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                <View style={styles.privacyTextContent}>
                  <Text style={styles.privacyTitle}>DATA ANDA AMAN</Text>
                  <Text style={styles.privacyDesc}>Data pesanan Anda hanya dapat diakses menggunakan informasi yang sesuai.</Text>
                </View>
              </View>

            </View>

          </View>

        </View>

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
    backgroundColor: '#F5F2EB', // Cream / beige background
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  title: {
    ...Typography.h3,
    color: '#3E2723', // Cokelat tua
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  desktopContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 32,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mobileContainer: {
    flexDirection: 'column',
    paddingTop: 8,
  },
  leftColumn: {
    flex: 2,
  },
  rightColumn: {
    flex: 1,
    paddingTop: 24,
  },
  fullColumn: {
    width: '100%',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    ...Typography.h4,
    color: '#3E2723',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: -8,
    marginBottom: 16,
  },
  serviceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  serviceChipActive: {
    backgroundColor: '#8D6E63', // Cokelat muda/gold accent
    borderColor: '#8D6E63',
  },
  serviceChipText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  serviceChipTextActive: {
    color: Colors.textOnPrimary,
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
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    width: 80,
  },
  summaryValue: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
    textAlign: 'right',
  },
  emptySummary: {
    ...Typography.body,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEBE1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E0D3',
  },
  privacyTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  privacyTitle: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 2,
  },
  privacyDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
  desktopSubmitContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  submitBtn: {
    backgroundColor: '#3E2723', // Cokelat tua
    borderRadius: 12,
  }
});
