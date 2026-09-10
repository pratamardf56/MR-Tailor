/**
 * MR-Tailor — Daftar Harga
 *
 * Tampilan list menu bergaya settings/app modern.
 * Setiap layanan adalah baris pill, tap untuk expand daftar harga.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

// Aktifkan LayoutAnimation di Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ──────────────────────────────────────────────
// Data Daftar Harga
// ──────────────────────────────────────────────
const PRICE_LIST = [
  {
    id: 'permak-celana',
    icon: 'cut-outline' as const,
    name: 'Permak Celana',
    category: 'Permak',
    estimation: '1–2 hari',
    items: [
      { label: 'Potong panjang (kaki)', price: 'Rp 15.000' },
      { label: 'Kecilkan pinggang', price: 'Rp 20.000' },
      { label: 'Kecilkan paha / kaki', price: 'Rp 25.000' },
      { label: 'Ganti resleting celana', price: 'Rp 20.000' },
      { label: 'Pasang ban elastis pinggang', price: 'Rp 25.000' },
    ],
  },
  {
    id: 'permak-baju',
    icon: 'shirt-outline' as const,
    name: 'Permak Baju / Kemeja',
    category: 'Permak',
    estimation: '1–2 hari',
    items: [
      { label: 'Kecilkan badan baju', price: 'Rp 20.000' },
      { label: 'Potong lengan panjang', price: 'Rp 15.000' },
      { label: 'Ganti kancing', price: 'Rp 10.000 / butir' },
      { label: 'Pasang resleting baju', price: 'Rp 25.000' },
      { label: 'Tambah saku', price: 'Rp 20.000' },
    ],
  },
  {
    id: 'jahit-celana',
    icon: 'layers-outline' as const,
    name: 'Jahit Celana Baru',
    category: 'Jahit Baru',
    estimation: '3–5 hari',
    items: [
      { label: 'Celana chino / bahan', price: 'Rp 90.000 – Rp 110.000' },
      { label: 'Celana jeans custom', price: 'Rp 110.000 – Rp 130.000' },
      { label: 'Celana formal / kantor', price: 'Rp 95.000 – Rp 120.000' },
      { label: 'Celana training / olahraga', price: 'Rp 70.000 – Rp 90.000' },
      { label: 'Celana pendek (short)', price: 'Rp 60.000 – Rp 80.000' },
    ],
  },
  {
    id: 'jahit-kemeja',
    icon: 'construct-outline' as const,
    name: 'Jahit Kemeja / Baju Baru',
    category: 'Jahit Baru',
    estimation: '3–5 hari',
    items: [
      { label: 'Kemeja batik / kain biasa', price: 'Rp 85.000 – Rp 100.000' },
      { label: 'Kemeja kerja formal', price: 'Rp 95.000 – Rp 120.000' },
      { label: 'Kaos polo (bahan lacoste)', price: 'Rp 80.000 – Rp 100.000' },
      { label: 'Baju koko', price: 'Rp 90.000 – Rp 110.000' },
      { label: 'T-shirt custom', price: 'Rp 60.000 – Rp 80.000' },
    ],
  },
  {
    id: 'jahit-jas',
    icon: 'diamond-outline' as const,
    name: 'Jahit Jas & Blazer',
    category: 'Premium',
    estimation: '5–7 hari',
    items: [
      { label: 'Jas formal pria (1 layer)', price: 'Rp 250.000 – Rp 350.000' },
      { label: 'Jas formal pria (2 layer)', price: 'Rp 350.000 – Rp 450.000' },
      { label: 'Blazer wanita casual', price: 'Rp 200.000 – Rp 280.000' },
      { label: 'Blazer wanita formal', price: 'Rp 250.000 – Rp 350.000' },
      { label: 'Jas pengantin pria', price: 'Rp 400.000 – Rp 600.000' },
    ],
  },
  {
    id: 'jahit-gamis',
    icon: 'flower-outline' as const,
    name: 'Jahit Gamis & Gaun',
    category: 'Busana Muslim',
    estimation: '4–7 hari',
    items: [
      { label: 'Gamis syari sederhana', price: 'Rp 120.000 – Rp 160.000' },
      { label: 'Gamis dengan bordir', price: 'Rp 160.000 – Rp 220.000' },
      { label: 'Gaun pesta wanita', price: 'Rp 180.000 – Rp 280.000' },
      { label: 'Kebaya modern', price: 'Rp 200.000 – Rp 300.000' },
      { label: 'Gaun pengantin', price: 'Rp 350.000 – Rp 600.000' },
    ],
  },
  {
    id: 'seragam',
    icon: 'people-outline' as const,
    name: 'Jahit Seragam',
    category: 'Seragam',
    estimation: '5–10 hari',
    items: [
      { label: 'Seragam kemeja kantor', price: 'Rp 85.000 – Rp 110.000' },
      { label: 'Seragam sekolah', price: 'Rp 70.000 – Rp 90.000' },
      { label: 'Seragam batik', price: 'Rp 90.000 – Rp 120.000' },
      { label: 'Baju olahraga / kaos tim', price: 'Rp 65.000 – Rp 85.000' },
      { label: 'Diskon pesanan ≥ 10 pcs', price: '10% off' },
    ],
  },
];

// ──────────────────────────────────────────────
// Komponen Baris Menu
// ──────────────────────────────────────────────
function PriceRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: (typeof PRICE_LIST)[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const arrowRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={styles.rowWrapper}>
      {/* Baris Utama (pill) */}
      <TouchableOpacity
        style={[styles.menuRow, isExpanded && styles.menuRowActive]}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        {/* Ikon kiri */}
        <View style={[styles.iconBox, isExpanded && styles.iconBoxActive]}>
          <Ionicons
            name={item.icon}
            size={19}
            color={isExpanded ? Colors.textOnPrimary : Colors.primary}
          />
        </View>

        {/* Label */}
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, isExpanded && styles.rowTitleActive]}>
            {item.name}
          </Text>
          <Text style={styles.rowMeta}>
            {item.category} · Est. {item.estimation}
          </Text>
        </View>

        {/* Panah kanan */}
        <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isExpanded ? Colors.primary : Colors.textTertiary}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Panel Harga (expand) */}
      {isExpanded && (
        <View style={styles.expandPanel}>
          {item.items.map((row, idx) => (
            <View
              key={idx}
              style={[
                styles.priceRow,
                idx < item.items.length - 1 && styles.priceRowBorder,
              ]}
            >
              <View style={styles.priceRowLeft}>
                <View style={styles.priceDot} />
                <Text style={styles.priceLabel}>{row.label}</Text>
              </View>
              <Text style={styles.priceValue}>{row.price}</Text>
            </View>
          ))}

          {/* Tombol Booking */}
          <TouchableOpacity
            style={styles.bookBtn}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/(customer)/booking',
                params: { preselectedService: item.name },
              })
            }
          >
            <Ionicons name="calendar-outline" size={15} color={Colors.textOnPrimary} />
            <Text style={styles.bookBtnText}>Pesan Layanan Ini</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────
// Halaman Utama
// ──────────────────────────────────────────────
export default function HargaScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>DAFTAR HARGA</Text>
          <Text style={styles.headerSub}>Tap layanan untuk lihat detail harga</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && { maxWidth: 600, alignSelf: 'center', width: '100%' },
        ]}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={16} color={Colors.accentDark} />
          <Text style={styles.infoText}>
            Harga belum termasuk bahan kain. Klik layanan untuk melihat rincian harga.
          </Text>
        </View>

        {/* Daftar Menu */}
        <View style={styles.listContainer}>
          {PRICE_LIST.map((item) => (
            <PriceRow
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => toggleRow(item.id)}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={15} color={Colors.textTertiary} />
          <Text style={styles.footerText}>
            Harga dapat disesuaikan berdasarkan kesepakatan dengan penjahit.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
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
  headerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },

  /* Scroll */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accentLight + '30',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accentLight + '60',
  },
  infoText: {
    ...Typography.caption,
    color: Colors.accentDark,
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },

  /* List */
  listContainer: {
    gap: 10,
  },

  /* Row Wrapper */
  rowWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  /* Menu Row — pill style seperti gambar */
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
    backgroundColor: Colors.surface,
  },
  menuRowActive: {
    backgroundColor: Colors.backgroundAlt,
  },

  /* Ikon kiri */
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 46, 34, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxActive: {
    backgroundColor: Colors.primary,
  },

  /* Teks Row */
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowTitleActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  rowMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },

  /* Expand Panel */
  expandPanel: {
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },

  /* Price Rows */
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  priceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  priceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  priceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  priceLabel: {
    ...Typography.bodySm,
    color: Colors.text,
    fontSize: 13,
    flex: 1,
  },
  priceValue: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 13,
    textAlign: 'right',
  },

  /* Book Button */
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  bookBtnText: {
    ...Typography.buttonSm,
    color: Colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Footer */
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
    flex: 1,
  },
});
