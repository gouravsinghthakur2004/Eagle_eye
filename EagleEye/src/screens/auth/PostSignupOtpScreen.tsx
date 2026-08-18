import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { PrimaryButton, SecondaryButton, KeyboardAwareFormContainer } from '@/components';
import { useAppNavigation } from '@/context/NavigationContext';
import { AuthService } from '@/services/authService';

export const PostSignupOtpScreen: React.FC = () => {
  const {
    navigate,
    goBack,
    signupEmail,
    signupPassword,
    onLoginSuccess,
  } = useAppNavigation();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(59);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Auto-focus the first OTP box on screen mount
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');

    // Handle pasting full 6-digit OTP (e.g., "123456")
    if (cleanText.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = cleanText[i] || '';
      }
      setOtp(newOtp);
      const targetIndex = Math.min(cleanText.length - 1, 5);
      inputRefs.current[targetIndex]?.focus();
      return;
    }

    // Single digit entry or clearing digit
    const digit = cleanText.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance focus forward
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const isOtpComplete = otp.join('').length === 6;

  const handleVerifyAndContinue = async () => {
    const trimmedEmail = signupEmail?.trim();
    if (!trimmedEmail) {
      Alert.alert(
        'Session Expired',
        'Registered email address is missing. Please sign up again.',
        [
          {
            text: 'Go to Signup',
            onPress: () => navigate('Signup'),
          },
        ]
      );
      return;
    }

    const otpCode = otp.join('');
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter complete 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.verifyRegisterOtp(trimmedEmail, otpCode);

      // Successfully verified -> Auto-login with signup credentials
      if (signupPassword) {
        try {
          const loginRes = await AuthService.login(trimmedEmail, signupPassword);
          onLoginSuccess(loginRes.data as any);
          return;
        } catch (loginErr: any) {
          console.warn('[PostSignupOtp] Auto-login failed, redirecting to Login:', loginErr?.message);
          navigate('Login');
          return;
        }
      }

      // If password was missing from memory context, navigate to Login
      navigate('Login');
    } catch (error: any) {
      console.log('Post-Signup OTP Verification Error:', error?.response?.data || error.message);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Invalid or expired verification OTP. Please check and try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const trimmedEmail = signupEmail?.trim();
    if (!trimmedEmail) {
      Alert.alert('Error', 'No registered email specified to resend OTP.');
      return;
    }

    try {
      setTimer(59);
      const res = await AuthService.requestOtp(trimmedEmail);
      const otpNotice = res.otp ? `\n\nYour Verification OTP Code: ${res.otp}` : '';
      Alert.alert('OTP Sent', `${res.message || 'OTP sent successfully.'}${otpNotice}`);
    } catch (error: any) {
      Alert.alert('Resend Failed', error?.response?.data?.message || 'Could not send OTP');
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
          <Text style={styles.headerTitle}>Account Verification</Text>
          <Text style={styles.headerSubtitle}>
            Signup successful. An OTP has been sent to your registered email:
          </Text>
          {signupEmail ? (
            <View style={styles.emailBadge}>
              <Text style={styles.emailBadgeText}>✉️  {signupEmail}</Text>
            </View>
          ) : null}
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          {/* OTP Input Row */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpBox, digit !== '' && styles.filledOtpBox]}
                keyboardType="number-pad"
                maxLength={6}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend Timer */}
          <View style={styles.timerRow}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>
              {timer > 0 ? `Resend code in 0:${timer < 10 ? `0${timer}` : timer}` : "Didn't receive code?"}
            </Text>
          </View>

          {timer === 0 ? (
            <TouchableOpacity style={styles.resendBtn} onPress={handleResendOtp}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          ) : null}

          {/* Verify & Continue Primary Button */}
          <PrimaryButton
            title={loading ? "Verifying..." : "Verify & Continue"}
            icon="✓"
            onPress={handleVerifyAndContinue}
            disabled={loading || !isOtpComplete}
            style={styles.verifyBtn}
          />

          {/* Alternative Password Login Action */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <SecondaryButton
            title="Login with Password"
            icon="🔒"
            onPress={() => navigate('Login')}
          />
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
    marginBottom: 28,
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
  emailBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1712',
    borderColor: COLORS.accentOrange,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  emailBadgeText: {
    color: COLORS.accentOrange,
    fontWeight: '700',
    fontSize: 14,
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#0B0B0B',
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  filledOtpBox: {
    borderColor: COLORS.primary,
    backgroundColor: '#221810',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timerText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  resendBtn: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  verifyBtn: {
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
});
