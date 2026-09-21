import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  useWindowDimensions, 
  Pressable, 
  SafeAreaView 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Jasa Jahit\nLebih Mudah',
    description: 'Pesan layanan jahit dan pantau pesanan kamu dengan mudah melalui MR-Tailor.',
    iconName: 'scissors' as const,
  },
  {
    id: '2',
    title: 'Sesuaikan Dengan\nKebutuhanmu',
    description: 'Pilih layanan jahit yang kamu butuhkan dan tentukan detail pesanan dengan praktis.',
    iconName: 'smartphone' as const,
  },
  {
    id: '3',
    title: 'Pesananmu\nTetap Terpantau',
    description: 'Cek status pesanan dan dapatkan informasi terbaru tanpa harus datang langsung ke tempat tailor.',
    iconName: 'check-circle' as const,
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@has_seen_onboarding', 'true');
      router.replace('/login');
    } catch (error) {
      console.error('Error saving onboarding status', error);
      router.replace('/login');
    }
  };

  const nextSlide = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const renderItem = ({ item }: { item: typeof ONBOARDING_DATA[0] }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.imageContainer}>
          <View style={styles.iconCircle}>
            <Feather name={item.iconName} size={80} color={Colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Feather name="scissors" size={24} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.logoText}>MR-Tailor</Text>
          <Text style={styles.logoSubText}>Jasa Jahit & Konveksi</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <Pressable 
          style={styles.button} 
          onPress={nextSlide}
        >
          <Text style={styles.buttonText}>
            {currentIndex === ONBOARDING_DATA.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}
          </Text>
        </Pressable>

        <View style={styles.footerBottom}>
          <View style={styles.pagination}>
            {ONBOARDING_DATA.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {currentIndex < ONBOARDING_DATA.length - 1 ? (
            <Pressable onPress={completeOnboarding}>
              <Text style={styles.skipText}>Lewati</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF4F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    marginBottom: 20,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0C5B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  logoSubText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  imageContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FAF4F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  button: {
    backgroundColor: '#CD8F68',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0C5B0',
    marginRight: 8,
  },
  dotActive: {
    backgroundColor: '#CD8F68',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
});
