import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { COLORS } from '@/theme/colors';

interface DangerButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

export const DangerButton: React.FC<DangerButtonProps> = ({
  title,
  onPress,
  icon,
  style,
  textStyle,
  disabled = false,
  loading = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, (disabled || loading) && styles.disabledButton, style]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <Text style={[styles.text, textStyle]}>
          {title} {icon ? icon : ''}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#DC2626',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#602020',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
