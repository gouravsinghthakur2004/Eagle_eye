import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { InputField, PrimaryButton, KeyboardAwareFormContainer } from '@/components';
import { useAppNavigation } from '@/context/NavigationContext';
import { AuthService } from '@/services/authService';

export const ForgotPasswordScreen: React.FC = () => {
  const { navigate, goBack, setResetEmail } = useAppNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Validation Error', 'Please enter your registered email address.');
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await AuthService.requestOtp(trimmedEmail);

      // Save email in navigation context for OTP and Reset Password steps
      setResetEmail(trimmedEmail);

      const otpNotice = res.otp ? `\n\nYour Verification OTP Code: ${res.otp}` : '';
      Alert.alert(
        'OTP Sent',
        `${res.message || 'OTP sent successfully to your registered email.'}${otpNotice}`,
        [
          {
            text: 'Verify OTP',
            onPress: () => {
              navigate('Otp');
            },
          },
        ]
      );
    } catch (error: any) {
      console.log('Send OTP Error:', error?.response?.data || error.message);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to send OTP. Please check your email and try again.';

      Alert.alert('Send OTP Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAwareFormContainer contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <Text style={styles.headerSubtitle}>
            Enter your registered email address to receive a verification OTP code.
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <InputField
            label="Registered Email Address"
            placeholder="e.g. john@example.com"
            value={email}
            onChangeText={setEmail}
            icon="✉️"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PrimaryButton
            title={loading ? "Sending OTP..." : "Send OTP"}
            icon="➔"
            onPress={handleSendOtp}
            disabled={loading}
            style={styles.submitBtn}
          />
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigate('Login')}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareFormContainer>
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
    marginBottom: 32,
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
  },
  submitBtn: {
    marginTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
