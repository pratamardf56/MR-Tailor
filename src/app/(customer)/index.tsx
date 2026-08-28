/**
 * Godabaya Tailor — Customer Home Screen (Beranda)
 * UI-only redesign: premium tailor landing page.
 * Structure: Navbar → Hero → Layanan Kami → Kenapa Memilih Kami → CTA → Footer.
 * The large Booking / Cek Pesanan forms have been REMOVED from the home page.
 * Access is now via Hero buttons that route to the EXISTING pages.
 * ALL logic, data, routing, API and other pages are unchanged.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  Platform,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { HomeCategories, NavMenu, WhyChooseUs } from '@/constants/config';
import { ADMIN_ENABLED } from '@/constants/admin';

// Sewing machine / tailor workshop photo — warm, cinematic, dark brown atmosphere.
const HERO_IMAGE = require('../../../assets/images/hero-sewing-machine.jpg');
const CTA_IMAGE = require('../../../assets/images/cta-sewing-machine.png');

// Elegant serif for headings (no extra font asset required).
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

// Brand palette shortcuts
const GOLD = Colors.accent;
const DARK_BROWN = Colors.primary;
const CREAM = Colors.background;

export default function HomeScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [menuOpen, setMenuOpen] = useState(false);

  // Hero height: compact & balanced to show background mannequin clearly on mobile.
  const heroHeight = isDesktop ? 460 : Math.min(Math.max(height * 0.48, 300), 440);

  const goBooking = () => router.push('/(customer)/booking');
  const goCekPesanan = () => router.push('/(customer)/cek-pesanan');
  const scrollTop = () => scrollViewRef.current?.scrollTo({ y: 0, animated: true });

  const handleNav = (idx: number) => {
    setMenuOpen(false);
    if (idx === 0) {
      scrollTop();
    } else {
      router.push(NavMenu[idx].route);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ═══════════════ HERO (with translucent NAVBAR overlay) ═══════════════ */}
        <ImageBackground
          source={HERO_IMAGE}
          style={[styles.hero, { minHeight: heroHeight }]}
          imageStyle={Platform.OS === 'web' ? ({ objectPosition: '82% center' } as any) : undefined}
          resizeMode="cover"
        >
          {/* Dark cinematic overlay */}
          <View style={styles.heroOverlay} pointerEvents="none" />

          {/* ── NAVBAR ── */}
          <View style={[styles.navbar, isDesktop && styles.navbarDesktop]}>
            <View style={styles.brandArea}>
              <View style={styles.logoCircle}>
                <Ionicons name="cut" size={16} color={GOLD} />
              </View>
              <View>
                <Text style={styles.brandName}>GODABAYA TAILOR</Text>
                <Text style={styles.brandSub}>Jahit & Permak Pakaian Sesuai Kebutuhan Anda</Text>
              </View>
            </View>

            {isDesktop ? (
              <View style={styles.navDesktop}>
                {NavMenu.map((item, idx) => (
                  <TouchableOpacity key={idx} onPress={() => handleNav(idx)} activeOpacity={0.7} style={styles.navLink}>
                    <Text style={[styles.navLinkText, idx === 0 && styles.navLinkTextActive]}>{item.label}</Text>
                    {idx === 0 && <View style={styles.navActiveUnderline} />}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity onPress={() => setMenuOpen(true)} activeOpacity={0.7} style={styles.hamburgerBtn}>
                <Ionicons name="menu" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── HERO CONTENT ── */}
          <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
              Jahit Rapi,{'\n'}
              <Text style={styles.heroTitleGold}>Sesuai Keinginan</Text>
            </Text>

            <Text style={[styles.heroDesc, isDesktop && styles.heroDescDesktop]}>
              Kami siap membantu Anda dengan hasil jahitan terbaik dan pengerjaan tepat waktu.
            </Text>

            <View style={[styles.heroButtons, isDesktop && styles.heroButtonsDesktop]}>
              <TouchableOpacity style={styles.btnPrimary} onPress={goBooking} activeOpacity={0.85}>
                <Ionicons name="cut-outline" size={18} color={DARK_BROWN} />
                <View>
                  <Text style={styles.btnPrimaryTitle}>BOOKING JAHITAN</Text>
                  <Text style={styles.btnPrimaryDesc}>Pesan jahitan Anda sekarang</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnOutline} onPress={goCekPesanan} activeOpacity={0.85}>
                <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                <View>
                  <Text style={styles.btnOutlineTitle}>CEK PESANAN</Text>
                  <Text style={styles.btnOutlineDesc}>Lihat status pesanan Anda</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.securityRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.securityText}>Data Anda aman dan tidak akan dibagikan ke pihak lain.</Text>
            </View>
          </View>
        </ImageBackground>

        {/* ═══════════════ LAYANAN KAMI ═══════════════ */}
        <View style={styles.sectionWhite}>
          <Text style={styles.sectionTitle}>Layanan Kami</Text>
          <View style={styles.goldLine} />

          <View style={styles.itemRow}>
            {HomeCategories.map((cat, index) => (
              <View key={index} style={styles.item}>
                <View style={styles.serviceIconBox}>
                  <Ionicons name={cat.icon} size={22} color={GOLD} />
                </View>
                <Text style={styles.itemLabel} numberOfLines={2}>{cat.label}</Text>
                <Text style={styles.itemDesc} numberOfLines={3}>{cat.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══════════════ KENAPA MEMILIH KAMI? ═══════════════ */}
        <View style={styles.sectionWhite}>
          <Text style={styles.sectionTitle}>Kenapa Memilih Kami?</Text>
          <View style={styles.goldLine} />

          <View style={styles.itemRow}>
            {WhyChooseUs.map((item, index) => (
              <View key={index} style={styles.item}>
                <View style={styles.whyIconBox}>
                  <Ionicons name={item.icon} size={20} color={GOLD} />
                </View>
                <Text style={styles.itemLabel} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.itemDesc} numberOfLines={3}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══════════════ CTA ═══════════════ */}
        <View style={styles.ctaWrap}>
          <View style={[styles.ctaCard, isDesktop && styles.ctaCardDesktop]}>
            <Image source={CTA_IMAGE} style={[styles.ctaImage, isDesktop && styles.ctaImageDesktop]} resizeMode="cover" />
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>Siap Membantu Kebutuhan Jahitan Anda</Text>
              <Text style={styles.ctaDesc} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>Booking sekarang dan dapatkan hasil jahitan terbaik dari kami.</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={goBooking} activeOpacity={0.85}>
                <Text style={styles.ctaButtonText}>BOOKING SEKARANG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Godabaya Tailor. All rights reserved.</Text>
          {ADMIN_ENABLED && (
            <TouchableOpacity onPress={() => router.push('/penjahit')} activeOpacity={0.7} style={styles.adminLink}>
              <Ionicons name="lock-closed-outline" size={11} color="rgba(255,255,255,0.45)" />
              <Text style={styles.adminLinkText}>Akses Admin / Penjahit</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ═══════════════ MOBILE MENU ═══════════════ */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderText}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {NavMenu.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.menuItem, idx === 0 && styles.menuItemActive]}
                onPress={() => handleNav(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, idx === 0 && styles.menuItemTextActive]}>{item.label}</Text>
                {idx === 0 && <Ionicons name="ellipse" size={7} color={GOLD} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark, // top inset blends with dark hero
  },
  scrollContent: {
    paddingBottom: 0,
    backgroundColor: CREAM,
  },

  /* ─── HERO ─────────────────────────────────────────── */
  hero: {
    width: '100%',
    justifyContent: 'flex-start',
    backgroundColor: Colors.primaryDark,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(32, 18, 12, 0.58)', // warm cinematic overlay optimized for background clarity
  },

  /* ─── NAVBAR ────────────────────────────────────────── */
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    zIndex: 5,
  },
  navbarDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexShrink: 1,
    paddingRight: 8,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(200,149,108,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
    maxWidth: 190,
  },
  navDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  navLink: {
    alignItems: 'center',
  },
  navLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.82)',
  },
  navLinkTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navActiveUnderline: {
    marginTop: 4,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: GOLD,
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  /* ─── HERO CONTENT ─────────────────────────────────── */
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  heroContentDesktop: {
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 44,
    marginTop: 0,
  },
  heroTitle: {
    fontFamily: SERIF,
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 8,
  },
  heroTitleDesktop: {
    fontSize: 46,
    lineHeight: 54,
    marginBottom: 16,
  },
  heroTitleGold: {
    color: GOLD,
    fontFamily: SERIF,
    fontWeight: '700',
  },
  heroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.90)',
    lineHeight: 19,
    marginBottom: 16,
    maxWidth: 420,
  },
  heroDescDesktop: {
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 28,
  },
  heroButtons: {
    gap: 10,
    marginBottom: 14,
  },
  heroButtonsDesktop: {
    flexDirection: 'row',
    gap: 16,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GOLD,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrimaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK_BROWN,
    letterSpacing: 0.5,
  },
  btnPrimaryDesc: {
    fontSize: 10,
    color: 'rgba(45,26,18,0.7)',
    marginTop: 1,
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  btnOutlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  btnOutlineDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    flexShrink: 1,
  },

  /* ─── SECTIONS ─────────────────────────────────────── */
  sectionCream: {
    backgroundColor: CREAM,
    paddingHorizontal: 12,
    paddingVertical: 26,
  },
  sectionWhite: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 26,
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 24,
    fontWeight: '700',
    color: DARK_BROWN,
    textAlign: 'center',
  },
  goldLine: {
    alignSelf: 'center',
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 10,
    marginBottom: 22,
  },

  /* ─── ITEM ROW (4 items in a single row) ───────────── */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 900,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(200,149,108,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  whyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(200,149,108,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 14,
  },
  itemDesc: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },

  /* ─── CTA ──────────────────────────────────────────── */
  ctaWrap: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 34,
  },
  ctaCard: {
    backgroundColor: DARK_BROWN,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  ctaCardDesktop: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  ctaImage: {
    width: '100%',
    height: 120,
  },
  ctaImageDesktop: {
    height: 160,
  },
  ctaContent: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  ctaTitle: {
    fontFamily: SERIF,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 19,
    marginBottom: 3,
    width: '100%',
  },
  ctaDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 15,
    marginBottom: 10,
    width: '100%',
  },
  ctaButton: {
    backgroundColor: GOLD,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: DARK_BROWN,
    letterSpacing: 0.5,
  },

  /* ─── FOOTER ───────────────────────────────────────── */
  footer: {
    backgroundColor: DARK_BROWN,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.background,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  adminLinkText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
  },

  /* ─── MOBILE MENU ──────────────────────────────────── */
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
  },
  menuSheet: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 18,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuHeaderText: {
    fontFamily: SERIF,
    fontSize: 18,
    fontWeight: '700',
    color: DARK_BROWN,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemActive: {},
  menuItemText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: GOLD,
    fontWeight: '700',
  },
});
