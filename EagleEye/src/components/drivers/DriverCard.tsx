import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS } from '@/theme/colors';
import { DriverNavigatorProfile } from '@/types';

interface DriverCardProps {
  driver: DriverNavigatorProfile;
  onEdit: (driver: DriverNavigatorProfile) => void;
  onRemove?: (id: string | number) => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver, onEdit }) => {
  return (
    <View style={styles.tableRow}>
      {/* Driver Name Column */}
      <View style={styles.nameCol}>
        <Text style={styles.driverName} numberOfLines={1}>
          {driver.full_name || 'Unnamed Driver'}
        </Text>
        {Boolean(driver.race_nick_name) && (
          <Text style={styles.nicknameText} numberOfLines={1}>
            "{driver.race_nick_name}"
          </Text>
        )}
      </View>

      {/* Mobile No Column */}
      <View style={styles.mobileCol}>
        <Text style={styles.mobileText} numberOfLines={1}>
          {driver.mobile_no || 'N/A'}
        </Text>
      </View>

      {/* Actions Column */}
      <View style={styles.actionCol}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(driver)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
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
  driverName: {
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
});
