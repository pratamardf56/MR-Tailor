/**
 * Godabaya Tailor — Entry Point
 */

import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/auth/AuthContext';
import { useTailorAuth } from '@/auth/TailorAuthContext';

export default function Entry() {
  const { customer, isLoading: custLoading } = useAuth();
  const { tailor, isLoading: tailorLoading } = useTailorAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('@has_seen_onboarding');
        setHasSeenOnboarding(value === 'true');
      } catch (error) {
        setHasSeenOnboarding(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };
    
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (custLoading || tailorLoading || isCheckingOnboarding) return;
    
    // First priority: User must see onboarding if they haven't
    if (hasSeenOnboarding === false) {
      router.replace('/onboarding');
      return;
    }
    
    // Once onboarding is completed or skipped, handle normal auth flow
    if (customer) {
      router.replace('/(customer)');
      return;
    }
    
    if (tailor) {
      router.replace('/penjahit/dashboard');
      return;
    }
    
    // Not logged in and has seen onboarding -> go straight to login
    router.replace('/login');
  }, [customer, tailor, custLoading, tailorLoading, hasSeenOnboarding, isCheckingOnboarding]);

  // Blank screen while resolving state
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
