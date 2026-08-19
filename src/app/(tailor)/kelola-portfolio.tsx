/**
 * Godabaya Tailor — Kelola Portofolio
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { Alert } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PortfolioCategories, PortfolioCategory } from '@/constants/config';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PortfolioItem } from '@/types';

export default function KelolaPortfolioScreen() {
  const { getPortfolio, addPortfolioItem, deletePortfolioItem } = usePortfolio();
  
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Add
  const [showAddModal, setShowAddModal] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<PortfolioCategory>('Baju');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPortfolio('Semua');
      setItems(data);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  }, [getPortfolio]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin untuk mengakses galeri.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      // Di web blob URL tidak bertahan setelah refresh, jadi minta base64
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

  const handleAdd = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Silakan pilih foto terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      await addPortfolioItem({
        imageUri,
        category,
        description: description.trim()
      });
      
      Alert.alert('Berhasil', 'Foto berhasil ditambahkan ke portofolio.');
      setShowAddModal(false);
      setImageUri(null);
      setDescription('');
      loadItems();
    } catch {
      Alert.alert('Error', 'Gagal menambahkan foto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Hapus Foto',
      'Apakah Anda yakin ingin menghapus foto ini dari portofolio?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePortfolioItem(id);
              loadItems();
            } catch {
              Alert.alert('Error', 'Gagal menghapus foto.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: PortfolioItem }) => (
    <Card style={styles.portfolioCard} padding={0}>
      <Image source={{ uri: item.imageUri }} style={styles.image} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Kelola Portofolio</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color={Colors.textOnPrimary} />
          <Text style={styles.addBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Belum ada foto di portofolio.</Text>
              </View>
            ) : null
          }
        />
      </View>

      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="Upload Foto Portofolio">
        <View style={styles.imagePickerContainer}>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                <Ionicons name="create" size={20} color={Colors.textOnPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={32} color={Colors.primary} />
              <Text style={styles.imageUploadText}>Pilih Foto dari Galeri</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.chipContainer}>
            {PortfolioCategories.filter(c => c !== 'Semua').map((cat) => (
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
          label="Deskripsi (Opsional)"
          placeholder="Jelaskan detail jahitan ini..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <View style={styles.modalFooter}>
          <Button title="Batal" variant="outline" onPress={() => setShowAddModal(false)} style={styles.flex1} />
          <Button title="Upload" onPress={handleAdd} loading={submitting} disabled={!imageUri} style={styles.flex1} />
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
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  portfolioCard: {
    width: '48%',
    overflow: 'hidden',
    marginBottom: 0,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemCategory: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  itemDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  imagePickerContainer: {
    marginBottom: 20,
  },
  imageUploadBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundAlt,
  },
  imageUploadText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: 8,
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
    marginTop: 16,
  },
  flex1: {
    flex: 1,
  },
});
