import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { useAppNavigation, ScreenName } from '@/context/NavigationContext';
import { DrawerItem } from './DrawerItem';
import { APP_LOGO } from '@/assets';


export const CustomDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, currentScreen, navigate, unreadCount, logout, user } = useAppNavigation();

  if (!isDrawerOpen) return null;

  const menuItems: { icon: string; label: string; screen: ScreenName; badge?: number }[] = [
    { icon: '🏠', label: 'Home', screen: 'Home' },
    { icon: '🚩', label: 'My Events', screen: 'MyEvents' },
    { icon: '🏁', label: 'All Championships', screen: 'Events' },
    { icon: '👤', label: 'My Profile', screen: 'Profile' },
    { icon: '🏎️', label: 'Driver / Navigator Profile', screen: 'DriverNavigatorProfile' },
    { icon: '🚗', label: 'Vehicles', screen: 'Vehicles' },
    { icon: '🏛️', label: 'Organizations', screen: 'Organizations' },
    { icon: '🏆', label: 'Results', screen: 'Results' },
    { icon: '🔔', label: 'Notifications', screen: 'Notifications', badge: unreadCount },
    { icon: '⚙️', label: 'Settings', screen: 'Settings' },
  ];


  return (
    <Modal visible={isDrawerOpen} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.overlayContainer}>
        {/* Left Side Drawer Content */}
        <View style={styles.drawerContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarBorder}>
                <Image
                  source={{
                    uri: user?.profile_pic_url || user?.profile_pic_path || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  }}
                  style={styles.avatar}
                />
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={closeDrawer}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.driverName}>{user?.name || user?.username || 'Racer'}</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>Driver ID: #{user?.id || 'EE-001'}</Text>
            </View>
          </View>

          {/* Menu Links */}
          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <DrawerItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                isActive={currentScreen === item.screen}
                badge={item.badge}
                onPress={() => {
                  closeDrawer();
                  navigate(item.screen);
                }}
              />
            ))}

            <View style={styles.divider} />

            <DrawerItem
              icon="❓"
              label="Help & Support"
              isActive={false}
              onPress={() => {
                closeDrawer();
              }}
            />

            <DrawerItem
              icon="🚪"
              label="Logout"
              isActive={false}
              onPress={async () => {
                await logout();
              }}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Image source={APP_LOGO} style={styles.drawerFooterLogo} resizeMode="contain" />
            <Text style={styles.footerText}>EagleEye v1.0.0 Motorsports</Text>
          </View>



        </View>

        {/* Backdrop overlay covering remaining right side */}
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerContent: {
    width: 300,
    maxWidth: '80%',
    backgroundColor: COLORS.background,
    height: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    borderRightWidth: 1.5,
    borderRightColor: COLORS.surfaceBorder,
    shadowColor: COLORS.black,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  avatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  badgeText: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '600',
  },
  menuList: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: 12,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    alignItems: 'center',
  },
  drawerFooterLogo: {
    width: 100,
    height: 36,
    marginBottom: 6,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
