import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { DriverNavigatorProfile } from '@/types';
import { driverNavigatorService } from '@/services/driverNavigatorService';
import { useAppNavigation } from '@/context/NavigationContext';

export type RoleType = 'driver' | 'navigator';

export const useDriverNavigatorProfile = () => {
  const { user } = useAppNavigation();
  const userId = user?.id || (user as any)?.user_id;

  const [activeRole, setActiveRole] = useState<RoleType>('driver');
  const [driversList, setDriversList] = useState<DriverNavigatorProfile[]>([]);
  const [navigatorsList, setNavigatorsList] = useState<DriverNavigatorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      if (!userId) {
        setDriversList([]);
        setNavigatorsList([]);
        return;
      }
      const profiles = await driverNavigatorService.getProfiles(userId);

      const drivers = profiles.filter((p) => p.role_type === 'driver');
      const navigators = profiles.filter((p) => p.role_type === 'navigator');

      setDriversList(drivers);
      setNavigatorsList(navigators);
    } catch (err: any) {
      console.warn('[useDriverNavigatorProfile] Error fetching profiles:', err);
      setDriversList([]);
      setNavigatorsList([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setDriversList([]);
    setNavigatorsList([]);
    fetchProfiles();
  }, [userId, fetchProfiles]);

  const driverProfile = driversList[0] || null;
  const navigatorProfile = navigatorsList[0] || null;
  const currentProfile = activeRole === 'driver' ? driverProfile : navigatorProfile;
  const isCurrentProfileAdded = activeRole === 'driver' ? driversList.length > 0 : navigatorsList.length > 0;

  const saveCurrentProfile = async (formData: Partial<DriverNavigatorProfile>) => {
    try {
      setSaving(true);
      const payload: Partial<DriverNavigatorProfile> = {
        ...formData,
        role_type: activeRole,
        user_id: userId ? String(userId) : undefined,
      };

      if (currentProfile?.id) {
        payload.id = currentProfile.id;
      }

      await driverNavigatorService.saveProfile(payload, userId);

      const roleLabel = activeRole === 'driver' ? 'Driver' : 'Navigator';
      Alert.alert('Success', `${roleLabel} profile saved successfully!`);

      await fetchProfiles();
      return true;
    } catch (error: any) {
      const roleLabel = activeRole === 'driver' ? 'Driver' : 'Navigator';
      Alert.alert(`Save ${roleLabel} Failed`, error.message || 'Could not save profile.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAllProfiles = async (data: {
    drivers?: Partial<DriverNavigatorProfile>[];
    navigators?: Partial<DriverNavigatorProfile>[];
  }) => {
    try {
      setSaving(true);
      await driverNavigatorService.saveAllProfiles(data, userId);
      Alert.alert('Success', 'Racer profiles saved successfully!');
      await fetchProfiles();
      return true;
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Could not save racer profiles.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    activeRole,
    setActiveRole,
    driversList,
    navigatorsList,
    driverProfile,
    navigatorProfile,
    currentProfile,
    driverCount: driversList.length,
    navigatorCount: navigatorsList.length,
    isDriverAdded: driversList.length > 0,
    isNavigatorAdded: navigatorsList.length > 0,
    isCurrentProfileAdded,
    loading,
    saving,
    fetchProfiles,
    saveCurrentProfile,
    saveAllProfiles,
  };
};

