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
  const [scaleAnim] = useState(new Animated.Value(0.85));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    if (isReady && !isLoading) {
      const timer = setTimeout(() => {
        router.replace('/(customer)');
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [isReady, isLoading, customer]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✂️</Text>
        </View>
        <Text style={styles.name}>Godabaya</Text>
        <Text style={styles.nameSub}>TAILOR</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>{'Jahit & Permak Pakaian\nSesuai Kebutuhan Anda'}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,  // Cokelat tua
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  icon: {
    fontSize: 40,
  },
  name: {
    ...Typography.h1,
    color: Colors.textOnPrimary,
    letterSpacing: 3,
    fontSize: 36,
  },
  nameSub: {
    ...Typography.h4,
    color: Colors.accent,
    letterSpacing: 8,
    marginTop: 2,
    fontSize: 16,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(200,149,108,0.5)',
    borderRadius: 1,
    marginVertical: 18,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
