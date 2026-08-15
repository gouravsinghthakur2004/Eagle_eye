import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { InputField, PrimaryButton } from '@/components';
import { useAppNavigation } from '@/context/NavigationContext';
import { AuthService } from '@/services/authService';

import { Image } from 'react-native';
import { APP_LOGO } from '@/assets';

import { useNotification } from '@/hooks/useNotification';

export const LoginScreen: React.FC = () => {
  const { navigate, goBack, onLoginSuccess } = useAppNavigation();
  const { showSuccess, showError, showWarning } = useNotification();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      showWarning('Validation Error', 'Please enter your username or email and password.');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.login(trimmedUsername, password);

      showSuccess('Login Successful', result?.message || 'Welcome back to EagleEye!');
      setUsername('');
      setPassword('');
      onLoginSuccess(result?.data as any);
    } catch (error: any) {
      console.log('Login Failed:', error?.response?.data || error.message);

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Invalid username/email or password.';

      showError('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Image source={APP_LOGO} style={styles.authLogoImage} resizeMode="contain" />
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSubtitle}>
            Log in to access live race telemetry, leaderboards & driver stats.
          </Text>
        </View>


        <View style={styles.card}>
          <InputField
            label="Username or Email"
            placeholder="Username or email"
            value={username}
            onChangeText={setUsername}
            icon="👤"
            keyboardType="default"
          />

          <InputField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            icon="🔒"
            isPassword
          />

          <TouchableOpacity style={styles.forgotBtn} onPress={() => navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title={loading ? "Logging in..." : "Log In"}
            icon="➔"
            onPress={handleLogin}
            disabled={loading}
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigate('Signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  backIcon: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  authLogoImage: {
    width: 160,
    height: 100,
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    color: COLORS.accentOrange,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginBottom: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
