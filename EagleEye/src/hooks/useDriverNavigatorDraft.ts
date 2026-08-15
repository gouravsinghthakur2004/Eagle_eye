import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DriverNavigatorProfile } from '@/types';
import { RoleType } from './useDriverNavigatorProfile';
import { useAppNavigation } from '@/context/NavigationContext';

export const DRAFT_KEYS = {
  DRIVER_PROFILE_DRAFT: 'DRIVER_PROFILE_DRAFT',
  NAVIGATOR_PROFILE_DRAFT: 'NAVIGATOR_PROFILE_DRAFT',
  DRIVER_PROFILE_STEP: 'DRIVER_PROFILE_STEP',
  NAVIGATOR_PROFILE_STEP: 'NAVIGATOR_PROFILE_STEP',
  DRIVER_PROFILE_ROLE: 'DRIVER_PROFILE_ROLE',
  NAVIGATOR_PROFILE_ROLE: 'NAVIGATOR_PROFILE_ROLE',
};

export const useDriverNavigatorDraft = (
  role: RoleType,
  initialData?: DriverNavigatorProfile | null
) => {
  const { user } = useAppNavigation();
  const userId = user?.id || (user as any)?.user_id || 'guest';

  const [draftData, setDraftData] = useState<Partial<DriverNavigatorProfile>>({});
  const [draftStep, setDraftStep] = useState<number>(1);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [showRestoredToast, setShowRestoredToast] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const draftKey = `${role === 'driver' ? DRAFT_KEYS.DRIVER_PROFILE_DRAFT : DRAFT_KEYS.NAVIGATOR_PROFILE_DRAFT}_${userId}`;
  const stepKey = `${role === 'driver' ? DRAFT_KEYS.DRIVER_PROFILE_STEP : DRAFT_KEYS.NAVIGATOR_PROFILE_STEP}_${userId}`;
  const roleKey = `${role === 'driver' ? DRAFT_KEYS.DRIVER_PROFILE_ROLE : DRAFT_KEYS.NAVIGATOR_PROFILE_ROLE}_${userId}`;

  const saveTimeoutRef = useRef<any>(null);


  // 1. Load persisted draft on mount / role change
  useEffect(() => {
    let isMounted = true;
    const loadDraft = async () => {
      try {
        const [savedDraftStr, savedStepStr] = await Promise.all([
          AsyncStorage.getItem(draftKey),
          AsyncStorage.getItem(stepKey),
        ]);

        if (!isMounted) return;

        if (savedDraftStr) {
          const parsed = JSON.parse(savedDraftStr);
          if (parsed && Object.keys(parsed).length > 0) {
            setDraftData(parsed);
            setIsDirty(true);
            setIsDraftRestored(true);
            setShowRestoredToast(true);

            // Hide toast automatically after 3.5 seconds
            setTimeout(() => {
              if (isMounted) setShowRestoredToast(false);
            }, 3500);
          }
        } else if (initialData) {
          setDraftData(initialData);
        }

        if (savedStepStr) {
          const parsedStep = parseInt(savedStepStr, 10);
          if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 6) {
            setDraftStep(parsedStep);
          }
        }
      } catch (err) {
        console.warn('[useDriverNavigatorDraft] Error loading draft:', err);
      }
    };

    loadDraft();

    return () => {
      isMounted = false;
    };
  }, [role, draftKey, stepKey, initialData]);

  // 2. Debounced auto-save function (500ms)
  const saveDraft = useCallback(
    (data: Partial<DriverNavigatorProfile>, step: number) => {
      setDraftData(data);
      setDraftStep(step);
      setIsDirty(true);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await Promise.all([
            AsyncStorage.setItem(draftKey, JSON.stringify(data)),
            AsyncStorage.setItem(stepKey, step.toString()),
            AsyncStorage.setItem(roleKey, role),
          ]);
        } catch (err) {
          console.warn('[useDriverNavigatorDraft] Error auto-saving draft:', err);
        }
      }, 500);
    },
    [draftKey, stepKey, roleKey, role]
  );

  // 3. Clear draft
  const clearDraft = useCallback(async () => {
    try {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      await Promise.all([
        AsyncStorage.removeItem(draftKey),
        AsyncStorage.removeItem(stepKey),
        AsyncStorage.removeItem(roleKey),
      ]);
      setDraftData({});
      setDraftStep(1);
      setIsDirty(false);
      setIsDraftRestored(false);
      setShowRestoredToast(false);
    } catch (err) {
      console.warn('[useDriverNavigatorDraft] Error clearing draft:', err);
    }
  }, [draftKey, stepKey, roleKey]);

  return {
    draftData,
    draftStep,
    isDraftRestored,
    showRestoredToast,
    isDirty,
    saveDraft,
    clearDraft,
  };
};
