/**
 * MR-Tailor — Modern Single Login Screen
 * Matched to exact reference design requested by user.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useTailorAuth, TailorAccount } from '@/auth/TailorAuthContext';
import { apiRequest } from '@/utils/api';
import { Customer } from '@/types';

export default function LoginScreen() {
  const { customer, isLoading: custLoading, setCustomerSession } = useAuth();
  const { tailor, isLoading: tailorLoading, setTailorSession } = useTailorAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  // If already logged in, redirect accordingly
  useEffect(() => {
    if (custLoading || tailorLoading) return;
    if (customer) router.replace('/(customer)');
    if (tailor) router.replace('/penjahit/dashboard');
  }, [customer, tailor, custLoading, tailorLoading]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Email atau username harus diisi';
    if (!password) newErrors.password = 'Kata sandi harus diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setFormError('');
    setLoading(true);
    try {
      const res = await apiRequest<{
        token: string;
        role: 'customer' | 'tailor';
        user: Customer | TailorAccount;
      }>('/api/login', {
        method: 'POST',
        body: { username: username.trim(), password },
      });

      if (res.role === 'tailor') {
        await setTailorSession(res.token, res.user as TailorAccount);
        router.replace('/penjahit/dashboard');
      } else {
        await setCustomerSession(res.token, res.user as Customer);
        router.replace('/(customer)');
      }
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (
        msg.includes('koneksi') ||
        msg.includes('terhubung') ||
        msg.includes('network') ||
        msg.includes('fetch')
      ) {
        setFormError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        setFormError(msg || 'Email/username atau kata sandi salah.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Welcome Back <Text style={styles.emoji}>👋</Text>
              </Text>
              <Text style={styles.subtitle}>
                Today is a new day. It's your day. You shape it.{'\n'}
                Sign in to start managing your projects.
              </Text>
            </View>

            {/* Error Alert */}
            {formError ? (
              <View style={styles.alertBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.alertText}>{formError}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              {/* Email / Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  id="login-username"
                  placeholder="Example@email.com"
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    setErrors((e) => ({ ...e, username: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="username"
                  textContentType="username"
                  style={[styles.input, errors.username ? styles.inputError : null]}
                  returnKeyType="next"
                />
                {errors.username ? (
                  <Text style={styles.errorMsg}>{errors.username}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    id="login-password"
                    placeholder="At least 8 characters"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setErrors((e) => ({ ...e, password: '' }));
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    onSubmitEditing={handleLogin}
                    returnKeyType="go"
                    style={[
                      styles.input,
                      errors.password ? styles.inputError : null,
                      { paddingRight: 44 },
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorMsg}>{errors.password}</Text>
                ) : null}
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                id="login-submit"
                style={[styles.signInBtn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.signInText}>Sign in</Text>
                )}
              </TouchableOpacity>

              {/* Or Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Ionicons
                  name="logo-google"
                  size={18}
                  color="#EA4335"
                  style={styles.socialIcon}
                />
                <Text style={styles.socialBtnText}>Sign in with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Ionicons
                  name="logo-facebook"
                  size={18}
                  color="#1877F2"
                  style={styles.socialIcon}
                />
                <Text style={styles.socialBtnText}>Sign in with Facebook</Text>
              </TouchableOpacity>

              {/* Footer Row */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don't you have an account? </Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.signUpText}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },

  /* Header */
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    lineHeight: 18,
    textAlign: 'center',
  },

  /* Alert */
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  alertText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
    fontWeight: '500',
  },

  /* Form */
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  errorMsg: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 3,
  },

  /* Forgot Password */
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  /* Sign In Button */
  signInBtn: {
    backgroundColor: '#162A36',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#162A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Social Buttons */
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    borderRadius: 10,
    marginBottom: 10,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: '#475569',
  },
  signUpText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});
