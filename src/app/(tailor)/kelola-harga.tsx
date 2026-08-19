/**
 * Godabaya Tailor — Kelola Harga
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { ServiceCategories, ServiceCategory } from '@/constants/config';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useServices } from '@/hooks/useServices';
import { Service } from '@/types';
import { formatCurrency } from '@/utils/format';

export default function KelolaHargaScreen() {
  const { getServices, addService, updateService, deleteService, restoreService } = useServices();
  
  const [services, setServices] = useState<Service[]>([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>(ServiceCategories[0]);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [estimation, setEstimation] = useState('');

  const loadServices = useCallback(async () => {
    try {
      const data = await getServices(false); // get all including inactive
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  }, [getServices]);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  const resetForm = () => {
    setName('');
    setCategory(ServiceCategories[0]);
    setPrice('');
    setDescription('');
    setEstimation('');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (service: Service) => {
    setName(service.name);
    setCategory(service.category as any);
    setPrice(service.priceStart.toString());
    setDescription(service.description);
    setEstimation(service.estimation);
    setIsEditing(true);
    setEditingId(service.id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name || !price || !description || !estimation) {
      Alert.alert('Error', 'Mohon isi semua field.');
      return;
    }

    try {
      setSubmitting(true);
      const priceNum = parseInt(price, 10) || 0;
      
      const data = {
        name,
        category,
        priceStart: priceNum,
        description,
        estimation,
      };

      if (isEditing && editingId) {
        await updateService(editingId, data);
        Alert.alert('Berhasil', 'Layanan berhasil diupdate.');
      } else {
        await addService(data);
        Alert.alert('Berhasil', 'Layanan baru berhasil ditambahkan.');
      }
      
      setShowModal(false);
      loadServices();
    } catch {
      Alert.alert('Error', 'Gagal menyimpan layanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    const action = service.isActive ? 'menonaktifkan' : 'mengaktifkan';
    
    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin ${action} layanan ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya', 
          onPress: async () => {
            try {
              if (service.isActive) {
                await deleteService(service.id);
              } else {
                await restoreService(service.id);
              }
              loadServices();
            } catch {
              Alert.alert('Error', 'Gagal mengubah status layanan.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Service }) => (
    <Card style={[styles.serviceCard, !item.isActive && styles.serviceCardInactive] as any} padding={16}>
      <View style={styles.serviceHeader}>
        <View style={styles.nameCategory}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceCategory}>{item.category}</Text>
        </View>
        <Text style={styles.servicePrice}>{formatCurrency(item.priceStart)}</Text>
      </View>
      
      <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.serviceFooter}>
        <View style={styles.estimationBadge}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.estimationText}>{item.estimation}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleActive(item)}>
            <Ionicons 
              name={item.isActive ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={item.isActive ? Colors.error : Colors.success} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Kelola Harga</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={20} color={Colors.textOnPrimary} />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal 
        visible={showModal} 
        onClose={() => setShowModal(false)} 
        title={isEditing ? "Edit Layanan" : "Tambah Layanan Baru"}
      >
        <Input
          label="Nama Layanan"
          placeholder="Contoh: Jahit Baju Kemeja"
          value={name}
          onChangeText={setName}
          required
        />
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori <Text style={styles.required}>*</Text></Text>
          <View style={styles.chipContainer}>
            {ServiceCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Harga Mulai (Rp)"
          placeholder="Contoh: 75000"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          required
        />

        <Input
          label="Estimasi Pengerjaan"
          placeholder="Contoh: 3-5 hari"
          value={estimation}
          onChangeText={setEstimation}
          required
        />

        <Input
          label="Deskripsi"
          placeholder="Jelaskan detail layanan ini..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          required
        />

        <View style={styles.modalFooter}>
          <Button title="Batal" variant="outline" onPress={() => setShowModal(false)} style={styles.flex1} />
          <Button title="Simpan" onPress={handleSubmit} loading={submitting} style={styles.flex1} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    ...Typography.buttonSm,
    color: Colors.textOnPrimary,
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  serviceCard: {
    marginBottom: 0,
  },
  serviceCardInactive: {
    opacity: 0.6,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameCategory: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  serviceCategory: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  servicePrice: {
    ...Typography.bodyMedium,
    color: Colors.accent,
  },
  serviceDesc: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  estimationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estimationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(27, 42, 74, 0.05)',
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  flex1: {
    flex: 1,
  },
});
