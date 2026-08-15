import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS } from '@/theme/colors';

export interface FormErrorBannerProps {
  title?: string;
  errors: string[];
  onDismiss?: () => void;
}

export const FormErrorBanner: React.FC<FormErrorBannerProps> = ({
  title = 'Please fix the following errors',
  errors,
  onDismiss,
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>{title}</Text>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.bulletList}>
        {errors.map((err, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <Text style={styles.bulletSymbol}>•</Text>
            <Text style={styles.errorText}>{err}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#261415',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dismissBtn: {
    padding: 2,
  },
  dismissText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '800',
  },
  bulletList: {
    gap: 6,
    paddingLeft: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletSymbol: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 8,
    lineHeight: 18,
  },
  errorText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
