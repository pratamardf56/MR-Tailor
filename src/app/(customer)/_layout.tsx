/**
 * Godabaya Tailor — Customer Tab Layout
 *
 * Navbar bawah (5 slot):
 * [Beranda] [Booking] [Harga] [Pesanan] [Akun]
 *
 * Seluruh halaman customer membutuhkan login. Bila belum login,
 * pengunjung diarahkan ke halaman /login.
 */

import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, type ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/auth/AuthContext';

/** Beranda tetap menjadi rute utama meski berada di tengah navbar. */
export const unstable_settings = {
  anchor: 'index',
  initialRouteName: 'index',
};

/** Indikator kecil di atas ikon untuk menu aktif. */
function TabIcon({
  name,
  activeName,
  color,
  size,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  activeName: React.ComponentProps<typeof Ionicons>['name'];
  color: ColorValue;
  size: number;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.indicator, focused && styles.indicatorActive]} />
      <Ionicons name={focused ? activeName : name} size={size} color={color as string} />
    </View>
  );
}

export default function CustomerTabLayout() {
  const { customer, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    if (!isLoading && !customer) {
      router.replace('/login');
    }
  }, [customer, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: isDesktop ? 62 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 12 : 10,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          marginTop: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      {/* 1 — Beranda */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="home-outline" activeName="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* 2 — Booking */}
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="calendar-outline" activeName="calendar" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* 3 — Daftar Harga */}
      <Tabs.Screen
        name="harga"
        options={{
          title: 'Harga',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="pricetag-outline" activeName="pricetag" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* 4 — Akun */}
      <Tabs.Screen
        name="akun"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="person-outline" activeName="person" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* Tersembunyi — akses via ikon keranjang di header */}
      <Tabs.Screen
        name="pesanan"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="cek-pesanan"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 18,
    height: 2.5,
    borderRadius: 2,
    marginBottom: 3,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: Colors.accent,
  },
});
