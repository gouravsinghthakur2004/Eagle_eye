import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '@/theme/colors';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  icon,
  style,
  textStyle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabledButton, style]}
    >
      <Text style={[styles.text, disabled && styles.disabledText, textStyle]}>
        {title} {icon ? icon : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
});
