import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS } from '@/theme/colors';
import { DriverNavigatorProfile } from '@/types';

interface NavigatorCardProps {
  navigator: DriverNavigatorProfile;
  onEdit: (navigator: DriverNavigatorProfile) => void;
  onRemove?: (id: string | number) => void;
}

export const NavigatorCard: React.FC<NavigatorCardProps> = ({ navigator, onEdit, onRemove }) => {
  return (
    <View style={styles.tableRow}>
      {/* Navigator Name Column */}
      <View style={styles.nameCol}>
        <Text style={styles.navigatorName} numberOfLines={1}>
          {navigator.full_name || 'Unnamed Navigator'}
        </Text>
        {Boolean(navigator.race_nick_name) && (
          <Text style={styles.nicknameText} numberOfLines={1}>
            "{navigator.race_nick_name}"
          </Text>
        )}
      </View>

      {/* Mobile No Column */}
      <View style={styles.mobileCol}>
        <Text style={styles.mobileText} numberOfLines={1}>
          {navigator.mobile_no || 'N/A'}
        </Text>
      </View>

      {/* Actions Column */}
      <View style={styles.actionCol}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(navigator)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        {onRemove && navigator.id !== undefined && (
          <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(navigator.id!)}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
  },
  nameCol: {
    flex: 2.2,
    paddingRight: 6,
  },
  navigatorName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  nicknameText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  mobileCol: {
    flex: 1.8,
    paddingRight: 6,
  },
  mobileText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionCol: {
    flex: 1.2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editBtnText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '800',
  },
  removeBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginLeft: 6,
  },
  removeBtnText: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: '800',
  },
});
