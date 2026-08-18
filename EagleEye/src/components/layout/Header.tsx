import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '@/theme/colors';
import { useAppNavigation } from '@/context/NavigationContext';
import { APP_LOGO } from '@/assets';
import { getUserAvatarUrl } from '@/utils/fileUrl';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ showBack, onBack, title }) => {
  const { openDrawer, navigate, goBack, unreadCount, user } = useAppNavigation();

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const avatarUri = getUserAvatarUrl(user?.profile_pic_url, user?.profile_pic_path);

  return (
    <View style={styles.header}>
      {/* Left Action Button */}
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={handleBackPress}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={openDrawer}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Center Branding / Title mathematically centered */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        {title ? (
          <Text style={styles.headerTitleText} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.logoTouch}
            onPress={() => navigate('Home')}
          >
            <Image source={APP_LOGO} style={styles.headerLogoImage} resizeMode="contain" />
          </TouchableOpacity>
        )}
      </View>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.iconBtn}
          onPress={() => navigate('Notifications')}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.avatarContainer}
          onPress={() => navigate('Profile')}
        >
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    zIndex: 10,
  },
  leftContainer: {
    zIndex: 20,
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  hamburgerIcon: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  backIcon: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    maxWidth: 200,
    textAlign: 'center',
  },
  logoTouch: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoImage: {
    width: 140,
    height: 44,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  notifIcon: {
    fontSize: 17,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
