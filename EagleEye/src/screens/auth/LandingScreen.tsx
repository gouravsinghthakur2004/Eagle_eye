import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { PrimaryButton, SecondaryButton } from '@/components/common';
import { useAppNavigation } from '@/context/NavigationContext';

import { Image } from 'react-native';
import { APP_LOGO } from '@/assets';

export const LandingScreen: React.FC = () => {
  const { navigate } = useAppNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} translucent />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80',
        }}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay}>
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Header Logo */}
              <View style={styles.logoSection}>
                <Image source={APP_LOGO} style={styles.landingLogoImage} resizeMode="contain" />
                <View style={styles.taglineBadge}>
                  <Text style={styles.taglineText}>THE ART OF TIMING IS HERE</Text>
                </View>
              </View>

              {/* Main Titles */}
              <View style={styles.heroSection}>
                <Text style={styles.title}>CHASE THE LIMIT. OWN THE TRACK.</Text>
                <Text style={styles.subtitle}>
                  Every second counts. Register, compete, and experience real-time rally, circuit, and off-road racing like a true champion.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionSection}>
                <PrimaryButton
                  title="Get Started"
                  icon="➔"
                  onPress={() => navigate('Signup')}
                  style={styles.mainBtn}
                />
                <SecondaryButton
                  title="Explore Events"
                  onPress={() => navigate('Home')}
                  style={styles.subBtn}
                />
                <TouchableOpacity style={styles.loginLinkRow} onPress={() => navigate('Login')}>
                  <Text style={styles.loginLinkText}>Already registered? <Text style={styles.loginLinkHighlight}>Log In</Text></Text>
                </TouchableOpacity>
              </View>

              {/* Scroll / Swipe Hint */}
              <View style={styles.hintSection}>
                <Text style={styles.hintIcon}>↓</Text>
                <Text style={styles.hintText}>Swipe to Explore</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 20, 0.70)',
  },

  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 14,
  },
  landingLogoImage: {
    width: 220,
    height: 140,
  },

  taglineBadge: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FF7A00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  taglineText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  heroSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '84%',
  },
  actionSection: {
    width: '100%',
    gap: 14,
    marginBottom: 16,
  },
  mainBtn: {
    width: '100%',
  },
  subBtn: {
    width: '100%',
  },
  loginLinkRow: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  loginLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLinkHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  hintSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  hintIcon: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});

