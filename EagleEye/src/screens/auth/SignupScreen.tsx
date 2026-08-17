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
import { validateName, validateEmail, validatePhone } from '@/utils/formValidation';

export const SignupScreen: React.FC = () => {
  const { navigate, goBack, setSignupEmail, setSignupPassword } = useAppNavigation();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setContact('');
    setAddress('');
    setCity('');
    setState('');
    setPincode('');
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const trimmedContact = contact.trim();

    const nameVal = validateName(trimmedName, 'Full Name');
    if (!nameVal.isValid) {
      Alert.alert('Validation Error', nameVal.error || 'Invalid Name.');
      return;
    }

    const emailVal = validateEmail(trimmedEmail);
    if (!emailVal.isValid) {
      Alert.alert('Validation Error', emailVal.error || 'Invalid Email Address.');
      return;
    }

    const phoneVal = validatePhone(trimmedContact, 'Contact Number');
    if (!phoneVal.isValid) {
      Alert.alert('Validation Error', phoneVal.error || 'Invalid Contact Number.');
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.register({
        name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
        password: trimmedPassword,
        contact: trimmedContact,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });

      // Save email and credentials in context for Post-Signup OTP Verification and Auto-Login
      setSignupEmail(trimmedEmail);
      setSignupPassword(trimmedPassword);

      Alert.alert(
        'Signup Successful',
        'Signup successful. An OTP has been sent to your registered email.',
        [
          {
            text: 'Verify OTP',
            onPress: () => {
              resetForm();
              navigate('PostSignupOtp');
            },
          },
        ]
      );
    } catch (error: any) {
      console.log('Register Error:', error?.response?.data || error.message);
      Alert.alert(
        'Registration Failed',
        error?.response?.data?.message || error.message || 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAwareFormContainer contentContainerStyle={styles.scrollContent}>
        {/* Back Header */}
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>
            Join EagleEye to access real-time rally & telemetry feeds.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <InputField
            label="Full Name"
            placeholder="e.g. John Doe"
            value={name}
            onChangeText={setName}
            icon="👤"
            autoCapitalize="words"
          />

          <InputField
            label="Username"
            placeholder="e.g. johndoe"
            value={username}
            onChangeText={setUsername}
            icon="🏷️"
            autoCapitalize="none"
          />

          <InputField
            label="Email Address"
            placeholder="e.g. john@example.com"
            value={email}
            onChangeText={setEmail}
            icon="✉️"
            keyboardType="email-address"
          />

          <InputField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            icon="🔒"
            isPassword
          />

          <InputField
            label="Contact Number"
            placeholder="e.g. 9876543210"
            value={contact}
            onChangeText={setContact}
            icon="📱"
            keyboardType="phone-pad"
          />

          <InputField
            label="Address"
            placeholder="Street address"
            value={address}
            onChangeText={setAddress}
            icon="📍"
          />

          <InputField
            label="City"
            placeholder="City"
            value={city}
            onChangeText={setCity}
            icon="🏙️"
          />

          <InputField
            label="State"
            placeholder="State"
            value={state}
            onChangeText={setState}
            icon="🗺️"
          />

          <InputField
            label="Pincode"
            placeholder="Pincode"
            value={pincode}
            onChangeText={setPincode}
            icon="📮"
            keyboardType="number-pad"
          />

          <PrimaryButton
            title={loading ? "Registering..." : "Register"}
            icon="➔"
            onPress={handleRegister}
            disabled={loading}
            style={styles.submitBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
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
  flex: {
    flex: 1,
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
  formCard: {
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
  submitBtn: {
    marginTop: 10,
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
  loginLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
