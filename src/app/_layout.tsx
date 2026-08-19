/**
 * Godabaya Tailor — Root Layout
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { DatabaseProvider } from '@/database/provider';
import { AuthProvider } from '@/auth/AuthContext';
import { TailorAuthProvider } from '@/auth/TailorAuthContext';
import { Colors } from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a brief delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DatabaseProvider>
      <AuthProvider>
        <TailorAuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(tailor)" />
            <Stack.Screen name="penjahit/index" />
            <Stack.Screen name="penjahit/dashboard" />
            <Stack.Screen name="booking-success" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="service-detail" />
            <Stack.Screen name="order-detail" />
            <Stack.Screen name="portfolio" />
          </Stack>
        </TailorAuthProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}
