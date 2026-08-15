import React from 'react';
import { StatusBar, StyleSheet, View, LogBox } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { COLORS } from './src/theme/colors';
import { NavigationProvider } from './src/context/NavigationContext';
import { NotificationProvider } from './src/providers/NotificationProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

LogBox.ignoreAllLogs();

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <NotificationProvider>
          <NavigationProvider>
            <AppNavigator />
          </NavigationProvider>
        </NotificationProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
