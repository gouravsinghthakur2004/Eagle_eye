import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onPress?: () => void;
}

interface AppToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

const { width } = Dimensions.get('window');

export const AppToast: React.FC<AppToastProps> = ({ toast, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      // Animate in: slide down + fade in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss unless duration is 0 (or error toasts which stay longer)
      const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3000);
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      translateY.setValue(-150);
      opacity.setValue(0);
    }
  }, [toast]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          accentColor: '#16A34A',
          bgColor: '#141E18',
          borderColor: 'rgba(22, 163, 74, 0.4)',
          iconBg: 'rgba(22, 163, 74, 0.2)',
          iconText: '✓',
        };
      case 'error':
        return {
          accentColor: '#DC2626',
          bgColor: '#221415',
          borderColor: 'rgba(220, 38, 38, 0.4)',
          iconBg: 'rgba(220, 38, 38, 0.2)',
          iconText: '⚠️',
        };
      case 'warning':
        return {
          accentColor: '#F59E0B',
          bgColor: '#241D12',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          iconBg: 'rgba(245, 158, 11, 0.2)',
          iconText: '⚠️',
        };
      case 'info':
      default:
        return {
          accentColor: '#2563EB',
          bgColor: '#121A2A',
          borderColor: 'rgba(37, 99, 235, 0.4)',
          iconBg: 'rgba(37, 99, 235, 0.2)',
          iconText: 'ℹ️',
        };
    }
  };

  const typeStyle = getTypeStyles();
  const paddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 12) + 8;

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          top: paddingTop,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (toast.onPress) toast.onPress();
          handleDismiss();
        }}
        style={[
          styles.toastCard,
          {
            backgroundColor: typeStyle.bgColor,
            borderColor: typeStyle.borderColor,
          },
        ]}
      >
        <View style={styles.contentRow}>
          {/* Left Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: typeStyle.iconBg }]}>
            <Text style={[styles.iconSymbol, { color: typeStyle.accentColor }]}>
              {typeStyle.iconText}
            </Text>
          </View>

          {/* Text Container */}
          <View style={styles.textContainer}>
            <Text style={styles.toastTitle} numberOfLines={1}>
              {toast.title}
            </Text>
            {Boolean(toast.message) && (
              <Text style={styles.toastMessage} numberOfLines={2}>
                {toast.message}
              </Text>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Top Accent Indicator Strip */}
        <View style={[styles.accentStrip, { backgroundColor: typeStyle.accentColor }]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: width - 32,
    maxWidth: 500,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconSymbol: {
    fontSize: 18,
    fontWeight: '900',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  toastTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  toastMessage: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});
