import React, { useEffect } from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';
import { COLORS } from '@/theme/colors';
import { useAppNavigation } from '@/context/NavigationContext';
import { HomeScreen } from '@/screens/home';
import {
  EventsScreen,
  MyEventsScreen,
  EventDetailsScreen,
  JoinEventScreen,
  SelectDriverScreen,
  SelectNavigatorScreen,
  SelectVehicleScreen,
  TermsConditionsScreen,
} from '@/screens/events';
import { DriversScreen, DriverProfileScreen, DriverNavigatorProfileScreen } from '@/screens/drivers';
import { OrganizationsScreen } from '@/screens/organizations';
import { ResultsScreen } from '@/screens/results';
import { NotificationsScreen } from '@/screens/notifications';
import { SettingsScreen } from '@/screens/settings';
import { VehiclesScreen } from '@/screens/vehicles';
import { BottomTabBar, CustomDrawer } from '@/components';

export const MainNavigator: React.FC = () => {
  const { currentScreen, history, goBack } = useAppNavigation();

  // Android hardware Back button handler
  useEffect(() => {
    const onHardwareBack = () => {
      if (history.length > 1) {
        goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => subscription.remove();
  }, [history, goBack]);

  const renderMainScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Events':
        return <EventsScreen />;
      case 'MyEvents':
        return <MyEventsScreen />;
      case 'EventDetails':
        return <EventDetailsScreen />;
      case 'JoinEvent':
        return <JoinEventScreen />;
      case 'SelectDriver':
        return <SelectDriverScreen />;
      case 'SelectNavigator':
        return <SelectNavigatorScreen />;
      case 'SelectVehicle':
        return <SelectVehicleScreen />;
      case 'TermsConditions':
        return <TermsConditionsScreen />;
      case 'Drivers':
        return <DriversScreen />;
      case 'Profile':
        return <DriverProfileScreen />;
      case 'DriverNavigatorProfile':
        return <DriverNavigatorProfileScreen />;
      case 'Vehicles':
        return <VehiclesScreen />;
      case 'Organizations':
        return <OrganizationsScreen />;
      case 'Results':
        return <ResultsScreen />;
      case 'Notifications':
        return <NotificationsScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderMainScreen()}</View>
      <BottomTabBar />
      <CustomDrawer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});
