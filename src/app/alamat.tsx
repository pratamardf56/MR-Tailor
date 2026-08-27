/**
 * Godabaya Tailor — Alamat Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { AppConfig } from '@/constants/config';
import { openGoogleMaps } from '@/utils/linking';

export default function AlamatScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alamat</Text>
        <TouchableOpacity onPress={() => router.replace('/(customer)')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={40} color={Colors.primary} />
          </View>
        </View>

        {/* Business Name */}
        <Text style={styles.businessName}>{AppConfig.name}</Text>

        {/* Address Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="location-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardLabel}>Alamat Lengkap</Text>
              <Text style={styles.cardValue}>{AppConfig.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="time-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardLabel}>Jam Buka</Text>
              <Text style={styles.cardValue}>
                {AppConfig.defaultOpenHour} — {AppConfig.defaultCloseHour} WIB
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="call-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardLabel}>Telepon / WhatsApp</Text>
              <Text style={styles.cardValue}>0812-1438-6602</Text>
            </View>
          </View>
        </View>

        {/* Google Maps Button */}
        <TouchableOpacity
          style={styles.mapsButton}
          onPress={() => openGoogleMaps()}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={22} color={Colors.textOnPrimary} />
          <Text style={styles.mapsButtonText}>Buka di Google Maps</Text>
        </TouchableOpacity>

        {/* Embed Maps Preview (Web) */}
        <View style={styles.mapPreview}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color={Colors.textTertiary} />
            <Text style={styles.mapPlaceholderText}>Klik tombol di atas untuk membuka rute</Text>
          </View>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(200, 149, 108, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accentLight,
  },
  businessName: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(200, 149, 108, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  mapsButtonText: {
    ...Typography.button,
    color: Colors.textOnPrimary,
  },
  mapPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
