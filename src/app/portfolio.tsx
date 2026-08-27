/**
 * Godabaya Tailor — Portofolio Screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PortfolioCategories, PortfolioCategory } from '@/constants/config';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PortfolioItem } from '@/types';
import { Modal } from '@/components/ui/Modal';

export default function PortfolioScreen() {
  const { getPortfolio } = usePortfolio();
  
  const [activeCategory, setActiveCategory] = useState<PortfolioCategory>('Semua');
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null);

  const loadPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPortfolio(activeCategory);
      setItems(data);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  }, [getPortfolio, activeCategory]);

  useEffect(() => {
    // Data fetching effect with internal loading state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPortfolio();
  }, [loadPortfolio]);

  const renderItem = ({ item }: { item: PortfolioItem }) => (
    <TouchableOpacity 
      style={styles.portfolioItem} 
      onPress={() => setSelectedImage(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.imageUri }} style={styles.image} />
      <View style={styles.imageOverlay}>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hasil Jahitan Kami</Text>
        <TouchableOpacity onPress={() => router.replace('/(customer)')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PortfolioCategories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeCategory === item && styles.filterChipActive
              ]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[
                styles.filterText,
                activeCategory === item && styles.filterTextActive
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="images-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Belum ada foto dalam kategori ini.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Fullscreen Image Modal */}
      <Modal
        visible={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      >
        {selectedImage && (
          <View style={styles.modalContent}>
            <Image 
              source={{ uri: selectedImage.imageUri }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
            <View style={styles.modalInfo}>
              <Text style={styles.modalCategory}>{selectedImage.category}</Text>
              {selectedImage.description && (
                <Text style={styles.modalDesc}>{selectedImage.description}</Text>
              )}
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(200, 149, 108, 0.1)',
    borderColor: Colors.accent,
  },
  filterText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  gridContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  portfolioItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  itemCategory: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  modalContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  fullImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalInfo: {
    width: '100%',
    backgroundColor: Colors.backgroundAlt,
    padding: 16,
    borderRadius: 12,
  },
  modalCategory: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: 8,
  },
  modalDesc: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
});
