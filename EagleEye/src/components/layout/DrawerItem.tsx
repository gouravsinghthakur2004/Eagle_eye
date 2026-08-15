import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/theme/colors';

interface DrawerItemProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onPress: () => void;
  badge?: number;
}

export const DrawerItem: React.FC<DrawerItemProps> = ({
  icon,
  label,
  isActive = false,
  onPress,
  badge,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
    >
      <Text style={[styles.icon, isActive && styles.activeText]}>{icon}</Text>
      <Text style={[styles.label, isActive && styles.activeText]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 6,
  },
  activeContainer: {
    backgroundColor: COLORS.primaryGlow,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  icon: {
    fontSize: 20,
    marginRight: 16,
    color: COLORS.textSecondary,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
