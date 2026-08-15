import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS } from '@/theme/colors';
import { DriverNavigatorProfile } from '@/types';

interface NavigatorCardProps {
  navigator: DriverNavigatorProfile;
  onEdit: (navigator: DriverNavigatorProfile) => void;
  onRemove: (id: string | number) => void;
}

export const NavigatorCard: React.FC<NavigatorCardProps> = ({ navigator, onEdit, onRemove }) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.roleIcon}>🗺️</Text>
          <Text style={styles.roleTitle}>NAVIGATOR</Text>
        </View>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(navigator)}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => navigator.id && onRemove(navigator.id)}
          >
            <Text style={styles.removeBtnText}>🗑️ Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.navigatorName}>{navigator.full_name || 'Unnamed Navigator'}</Text>
      {Boolean(navigator.race_nick_name) && (
        <Text style={styles.nicknameText}>"{navigator.race_nick_name}"</Text>
      )}

      <View style={styles.infoRowGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>MOBILE</Text>
          <Text style={styles.infoValue}>{navigator.mobile_no || 'N/A'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>EMAIL</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {navigator.email || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  roleIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  roleTitle: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: 'rgba(255, 122, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.3)',
  },
  editBtnText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  navigatorName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  nicknameText: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRowGrid: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    gap: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
