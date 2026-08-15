import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { COLORS } from '@/theme/colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
    backgroundColor: COLORS.primary,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#4A2A14',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
