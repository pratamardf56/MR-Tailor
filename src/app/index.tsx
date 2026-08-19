/**
 * Godabaya Tailor — Entry Point / Splash
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useDatabase } from '@/database/provider';
import { useAuth } from '@/auth/AuthContext';

export default function SplashEntry() {
  const { isReady } = useDatabase();
  const { customer, isLoading } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (isReady && !isLoading) {
      const timer = setTimeout(() => {
        router.replace('/(customer)');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isReady, isLoading, customer]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✂️</Text>
        </View>
        <Text style={styles.name}>Godabaya</Text>
        <Text style={styles.nameSub}>Tailor</Text>
        <Text style={styles.tagline}>Jahit & Permak Pakaian{'\n'}Sesuai Kebutuhan Anda</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  name: {
    ...Typography.h1,
    color: Colors.textOnPrimary,
    letterSpacing: 2,
  },
  nameSub: {
    ...Typography.h3,
    color: Colors.accent,
    letterSpacing: 4,
    marginTop: -4,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});
