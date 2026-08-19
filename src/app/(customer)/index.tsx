/**
 * Godabaya Tailor — Customer Home Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { AppConfig, HomeCategories, WhyChooseUs } from '@/constants/config';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/auth/AuthContext';

export default function HomeScreen() {
  const { customer } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandArea}>
            <Text style={styles.greeting}>{customer ? `Halo, ${customer.name}!` : 'Selamat datang di'}</Text>
            <Text style={styles.brandName}>{AppConfig.name}</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Card style={styles.heroCard} padding={18}>
            <View style={styles.heroContent}>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>{AppConfig.tagline}</Text>
                <Text style={styles.heroSubtitle} numberOfLines={2}>
                  Mewujudkan pakaian impian dengan kualitas jahitan terbaik.
                </Text>
              </View>
              <View style={styles.heroIconBadge}>
                <Ionicons name="cut" size={28} color={Colors.primary} />
              </View>
            </View>
            
            <View style={{ gap: 10, marginTop: 8 }}>
              <TouchableOpacity 
                style={styles.heroButton}
                onPress={() => router.push('/(customer)/booking')}
                activeOpacity={0.8}
              >
                <Text style={styles.heroButtonText}>BOOKING JAHITAN</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.textOnPrimary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.heroButton, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}
                onPress={() => router.push('/(customer)/cek-pesanan')}
                activeOpacity={0.8}
              >
                <Text style={styles.heroButtonText}>CEK PESANAN</Text>
                <Ionicons name="search" size={18} color={Colors.textOnPrimary} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Categories (Horizontal Scroll) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Layanan Kami</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/harga')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {HomeCategories.map((cat, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.categoryCard}
                onPress={() => router.push('/(customer)/harga')}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconBox}>
                  <Ionicons name={cat.icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Why Choose Us (Compact Cards, Grid 2 kolom) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kenapa Memilih Kami?</Text>
          
          <View style={styles.featureGrid}>
            {WhyChooseUs.map((feature, index) => (
              <Card key={index} style={styles.featureCard} padding={14}>
                <View style={styles.featureIconBox}>
                  <Ionicons name={feature.icon} size={22} color={Colors.accent} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc} numberOfLines={2}>{feature.desc}</Text>
              </Card>
            ))}
          </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  brandArea: {
    flex: 1,
    paddingRight: 8,
  },
  greeting: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  brandName: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: 0,
    fontSize: 24,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#1B2A4A',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    ...Typography.h3,
    color: Colors.textOnPrimary,
    marginBottom: 6,
    fontSize: 18,
    lineHeight: 24,
  },
  heroSubtitle: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  heroButtonText: {
    ...Typography.buttonSm,
    color: Colors.textOnPrimary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontSize: 17,
  },
  seeAll: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '600',
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    width: 92,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(200, 149, 108, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  featureCard: {
    width: '48%',
    maxWidth: 260,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(216, 179, 132, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
