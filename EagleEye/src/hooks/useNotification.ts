import { useContext } from 'react';
import { Alert } from 'react-native';
import { NotificationContext, NotificationContextType } from '@/providers/NotificationProvider';

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (!context) {
    // Fallback safe implementations if used outside provider
    return {
      showSuccess: (title, message) => Alert.alert(title, message),
      showError: (title, message) => Alert.alert(title, message),
      showWarning: (title, message) => Alert.alert(title, message),
      showInfo: (title, message) => Alert.alert(title, message),
      showConfirm: ({ title, message, onConfirm, onCancel, confirmText, cancelText, isDestructive }) => {
        Alert.alert(title, message, [
          { text: cancelText || 'Cancel', style: 'cancel', onPress: onCancel },
          { text: confirmText || 'OK', style: isDestructive ? 'destructive' : 'default', onPress: onConfirm },
        ]);
      },
      hideToast: () => {},
      hideConfirm: () => {},
    };
  }

  return context;
};
