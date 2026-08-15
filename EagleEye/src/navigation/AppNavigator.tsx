import React from 'react';
import { StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { useAppNavigation } from '@/context/NavigationContext';
import { COLORS } from '@/theme/colors';
import { APP_LOGO } from '@/assets';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAppNavigation();

  // 1. App Launch Session Check Loading State
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={APP_LOGO} style={styles.splashLogo} resizeMode="contain" />
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
      </View>
    );
  }

  // 2. Protected Route Separation
  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  splashLogo: {
    width: 180,
    height: 120,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 12,
  },
});

