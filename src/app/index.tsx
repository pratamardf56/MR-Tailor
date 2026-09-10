/**
 * Godabaya Tailor — Entry Point
 */

import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/auth/AuthContext';
import { useTailorAuth } from '@/auth/TailorAuthContext';

export default function Entry() {
  const { customer, isLoading: custLoading } = useAuth();
  const { tailor, isLoading: tailorLoading } = useTailorAuth();

  useEffect(() => {
    if (custLoading || tailorLoading) return;
    
    if (customer) {
      router.replace('/(customer)');
      return;
    }
    
    if (tailor) {
      router.replace('/penjahit/dashboard');
      return;
    }
    
    // Not logged in -> go straight to login
    router.replace('/login');
  }, [customer, tailor, custLoading, tailorLoading]);

  // Blank screen while resolving auth state
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
