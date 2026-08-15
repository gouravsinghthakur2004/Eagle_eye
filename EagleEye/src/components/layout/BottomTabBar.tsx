import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS } from '@/theme/colors';
import { useAppNavigation, ScreenName } from '@/context/NavigationContext';

export const BottomTabBar: React.FC = () => {
  const { currentScreen, navigate } = useAppNavigation();

  // Hide bottom tab bar on auth screens and full-screen event details
  const isAuthScreen = ['Landing', 'Signup', 'PostSignupOtp', 'ForgotPassword', 'Otp', 'SetPassword', 'Login', 'EventDetails'].includes(currentScreen);
  if (isAuthScreen) return null;

  const tabs: { name: ScreenName; label: string; icon: string }[] = [
    { name: 'Home', label: 'Home', icon: '🏠' },
    { name: 'Events', label: 'Events', icon: '🏁' },
    { name: 'Drivers', label: 'Drivers', icon: '🏎️' },
    { name: 'Profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.7}
            style={styles.tab}
            onPress={() => navigate(tab.name)}
          >
            <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 68,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingBottom: 8,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
