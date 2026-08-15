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

export const SetPasswordScreen: React.FC = () => {
  const { navigate, goBack, resetEmail, resetOtp, clearResetContext } = useAppNavigation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Mandatory check: Prevent accessing Reset Password without prior OTP verification
  React.useEffect(() => {
    if (!resetEmail || !resetOtp) {
      Alert.alert(
        'Session Expired',
        'Verification state lost. Please enter your email and verify your OTP first.',
        [
          {
            text: 'Go to Forgot Password',
            onPress: () => navigate('ForgotPassword'),
          },
        ]
      );
    }
  }, [resetEmail, resetOtp]);

  const getStrengthLevel = () => {
    if (newPassword.length === 0) return { label: 'Enter Password', level: 0, color: COLORS.surfaceBorder };
    if (newPassword.length < 6) return { label: 'Weak', level: 1, color: COLORS.error };
    if (newPassword.length < 10) return { label: 'Medium', level: 2, color: COLORS.warning };
    return { label: 'Strong Security', level: 3, color: COLORS.success };
  };

  const strength = getStrengthLevel();

  const handleResetPassword = async () => {
    if (!resetEmail || !resetOtp) {
      Alert.alert('Verification Required', 'Please verify your OTP code first.');
      navigate('ForgotPassword');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in both New Password and Confirm Password fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New Password and Confirm Password do not match. Please check and try again.');
      return;
    }

    try {
      setLoading(true);
      const res = await AuthService.resetPassword(resetEmail, resetOtp, newPassword);
      Alert.alert('Success', res.message || 'Password changed successfully. Please log in with your new password.', [
        {
          text: 'Back to Login',
          onPress: () => {
            setNewPassword('');
            setConfirmPassword('');
            clearResetContext();
            navigate('Login');
          },
        },
      ]);
    } catch (error: any) {
      console.log('Reset Password Error:', error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.message || error?.message || 'Invalid or expired OTP. Could not reset password.';
      Alert.alert('Reset Failed', errorMsg);
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
          <Text style={styles.headerTitle}>Reset Password</Text>
          <Text style={styles.headerSubtitle}>
            Create a new strong password for your EagleEye account.
          </Text>
        </View>

        <View style={styles.card}>
          <InputField
            label="New Password"
            placeholder="••••••••"
            value={newPassword}
            onChangeText={setNewPassword}
            icon="🔒"
            isPassword
          />

          <InputField
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon="🔒"
            isPassword
          />

          {/* Password Strength Indicator */}
          <View style={styles.strengthContainer}>
            <View style={styles.strengthHeader}>
              <Text style={styles.strengthTitle}>Password Strength</Text>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
            <View style={styles.strengthBarsRow}>
              {[1, 2, 3].map((bar) => (
                <View
                  key={bar}
                  style={[
                    styles.strengthBar,
                    bar <= strength.level && { backgroundColor: strength.color },
                  ]}
                />
              ))}
            </View>
          </View>

          <PrimaryButton
            title={loading ? "Resetting..." : "Reset Password"}
            icon="🚀"
            onPress={handleResetPassword}
            disabled={loading}
            style={styles.submitBtn}
          />
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
  strengthContainer: {
    marginBottom: 20,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  strengthTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceBorder,
  },
  submitBtn: {
    marginTop: 12,
  },
});
