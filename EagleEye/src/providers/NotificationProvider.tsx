import React, { createContext, useState, useCallback } from 'react';
import { AppToast, ToastData, ToastType } from '@/components/common/AppToast';
import { AppAlertModal, ConfirmModalData } from '@/components/common/AppAlertModal';

export interface ShowConfirmOptions {
  title: string;
  message?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface NotificationContextType {
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  showConfirm: (options: ShowConfirmOptions) => void;
  hideToast: () => void;
  hideConfirm: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [_toastQueue, setToastQueue] = useState<ToastData[]>([]);
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<ConfirmModalData | null>(null);

  // Helper to add toast to queue or show immediately
  const queueToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const newToast: ToastData = {
      id: `toast_${Date.now()}_${Math.random()}`,
      type,
      title,
      message,
      duration,
    };

    setToastQueue((prev) => {
      if (!activeToast && prev.length === 0) {
        setActiveToast(newToast);
        return [];
      }
      return [...prev, newToast];
    });
  }, [activeToast]);

  const handleToastDismiss = useCallback(() => {
    setActiveToast(null);
    setToastQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        setTimeout(() => setActiveToast(next), 150);
        return rest;
      }
      return [];
    });
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    queueToast('success', title, message, duration);
  }, [queueToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    queueToast('error', title, message, duration);
  }, [queueToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    queueToast('warning', title, message, duration);
  }, [queueToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    queueToast('info', title, message, duration);
  }, [queueToast]);

  const showConfirm = useCallback((options: ShowConfirmOptions) => {
    setConfirmModalData({
      id: `confirm_${Date.now()}`,
      ...options,
    });
  }, []);

  const hideToast = useCallback(() => {
    handleToastDismiss();
  }, [handleToastDismiss]);

  const hideConfirm = useCallback(() => {
    setConfirmModalData(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        hideToast,
        hideConfirm,
      }}
    >
      {children}
      <AppToast toast={activeToast} onDismiss={handleToastDismiss} />
      <AppAlertModal modalData={confirmModalData} onDismiss={() => setConfirmModalData(null)} />
    </NotificationContext.Provider>
  );
};
