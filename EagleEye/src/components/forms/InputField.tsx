import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardTypeOptions,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/theme/colors';

interface InputFieldProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: string;
  required?: boolean;
  isPassword?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  required = false,
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  maxLength,
  multiline = false,
  numberOfLines,
  error,
}) => {
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredAsterisk}> *</Text>}
        </View>
      )}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focusedInput,
          Boolean(error) && styles.errorWrapper,
          multiline && styles.multilineWrapper,
        ]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.eyeBtn}
          >
            <Text style={styles.eyeIcon}>{isSecure ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {Boolean(error) && (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  requiredAsterisk: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  multilineWrapper: {
    minHeight: 90,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  focusedInput: {
    borderColor: COLORS.primary,
    backgroundColor: '#1E1E24',
  },
  errorWrapper: {
    borderColor: '#EF4444',
    backgroundColor: '#261415',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingLeft: 2,
  },
  errorIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 8,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  eyeBtn: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
});
