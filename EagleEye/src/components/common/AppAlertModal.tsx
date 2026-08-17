import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS } from '@/theme/colors';

export interface ConfirmModalData {
  id: string;
  title: string;
  message?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface AppAlertModalProps {
  modalData: ConfirmModalData | null;
  onDismiss: () => void;
}

const { width } = Dimensions.get('window');

export const AppAlertModal: React.FC<AppAlertModalProps> = ({ modalData, onDismiss }) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalData) {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [modalData, opacity, scale]);

  if (!modalData) return null;

  const handleCancel = () => {
    if (modalData.onCancel) modalData.onCancel();
    onDismiss();
  };

  const handleConfirm = () => {
    modalData.onConfirm();
    onDismiss();
  };

  const iconText = modalData.icon || (modalData.isDestructive ? '🗑️' : '⚠️');
  const confirmLabel = modalData.confirmText || (modalData.isDestructive ? 'Remove' : 'Confirm');
  const cancelLabel = modalData.cancelText || 'Cancel';

  return (
    <Modal visible={Boolean(modalData)} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          {/* Top Accent Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              modalData.isDestructive ? styles.iconCircleDestructive : styles.iconCircleNormal,
            ]}
          >
            <Text style={styles.iconText}>{iconText}</Text>
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{modalData.title}</Text>
          {Boolean(modalData.message) && <Text style={styles.message}>{modalData.message}</Text>}

          {/* Actions Button Row */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                modalData.isDestructive ? styles.confirmBtnDestructive : styles.confirmBtnNormal,
              ]}
              activeOpacity={0.8}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: width - 48,
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  iconCircleNormal: {
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    borderColor: COLORS.primary,
  },
  iconCircleDestructive: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: '#DC2626',
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnNormal: {
    backgroundColor: COLORS.primary,
  },
  confirmBtnDestructive: {
    backgroundColor: '#DC2626',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
