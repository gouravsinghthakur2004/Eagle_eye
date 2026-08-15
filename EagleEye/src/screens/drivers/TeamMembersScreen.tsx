import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components/layout/Header';
import { useAppNavigation } from '@/context/NavigationContext';
import { DriverNavigatorProfile } from '@/types';
import { driverNavigatorService } from '@/services/driverNavigatorService';
import { DriverCard } from '@/components/drivers/DriverCard';
import { NavigatorCard } from '@/components/drivers/NavigatorCard';
import { DriverFormModal } from '@/components/drivers/DriverFormModal';
import { NavigatorFormModal } from '@/components/drivers/NavigatorFormModal';
import { useNotification } from '@/hooks/useNotification';

export const TeamMembersScreen: React.FC = () => {
  const { goBack, navigate, user, selectDriverForJoin, selectNavigatorForJoin } = useAppNavigation();
  const { showSuccess, showConfirm } = useNotification();

  const userId = user?.id || (user as any)?.user_id;

  const [drivers, setDrivers] = useState<DriverNavigatorProfile[]>([]);
  const [navigators, setNavigators] = useState<DriverNavigatorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Active modal form control ('driver' | 'navigator' | null)
  const [activeForm, setActiveForm] = useState<'driver' | 'navigator' | null>(null);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<DriverNavigatorProfile | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      if (!userId) {
        setDrivers([]);
        setNavigators([]);
        return;
      }
      const profiles = await driverNavigatorService.getProfiles(userId);
      const driverList = profiles.filter((p) => p.role_type === 'driver');
      const navigatorList = profiles.filter((p) => p.role_type === 'navigator');

      setDrivers(driverList);
      setNavigators(navigatorList);
    } catch (err) {
      console.warn('[TeamMembersScreen] Fetch profiles error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfiles();
  };

  // Add / Edit Handlers
  const handleOpenAddDriver = () => {
    setSelectedItemToEdit(null);
    setActiveForm('driver');
  };

  const handleOpenEditDriver = (driver: DriverNavigatorProfile) => {
    setSelectedItemToEdit(driver);
    setActiveForm('driver');
  };

  const handleOpenAddNavigator = () => {
    setSelectedItemToEdit(null);
    setActiveForm('navigator');
  };

  const handleOpenEditNavigator = (navigator: DriverNavigatorProfile) => {
    setSelectedItemToEdit(navigator);
    setActiveForm('navigator');
  };

  // Save Callbacks
  const handleDriverSaved = (savedDriver: DriverNavigatorProfile) => {
    selectDriverForJoin(savedDriver);
    setDrivers((prev) => {
      const idx = prev.findIndex((d) => String(d.id) === String(savedDriver.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedDriver;
        return copy;
      }
      return [...prev, savedDriver];
    });
    fetchProfiles();
  };

  const handleNavigatorSaved = (savedNavigator: DriverNavigatorProfile) => {
    selectNavigatorForJoin(savedNavigator);
    setNavigators((prev) => {
      const idx = prev.findIndex((n) => String(n.id) === String(savedNavigator.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedNavigator;
        return copy;
      }
      return [...prev, savedNavigator];
    });
    fetchProfiles();
  };

  // Remove Callbacks with custom themed confirmation dialog
  const handleRemoveDriver = (driverId: string | number) => {
    showConfirm({
      title: 'Remove Driver?',
      message: 'This driver will be removed from your active team roster.',
      icon: '🏎️',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        setDrivers((prev) => prev.filter((d) => String(d.id) !== String(driverId)));
        showSuccess('Driver Removed', 'Driver has been removed from team list.');
      },
    });
  };

  const handleRemoveNavigator = (navigatorId: string | number) => {
    showConfirm({
      title: 'Remove Navigator?',
      message: 'This navigator will be removed from your active team roster.',
      icon: '🗺️',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        setNavigators((prev) => prev.filter((n) => String(n.id) !== String(navigatorId)));
        showSuccess('Navigator Removed', 'Navigator has been removed from team list.');
      },
    });
  };

  const existingDriverMobiles = drivers.map((d) => d.mobile_no).filter(Boolean) as string[];
  const existingNavigatorMobiles = navigators.map((n) => n.mobile_no).filter(Boolean) as string[];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Team Members" showBack onBack={goBack} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading team profiles…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Header Banner */}
          <View style={styles.heroCard}>
            <View style={styles.racingStripe} />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Racer Team Setup</Text>
              <Text style={styles.heroSubtitle}>
                Add drivers and navigators independently for upcoming events.
              </Text>
            </View>
          </View>

          {/* SECTION 1: ADDED DRIVERS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>🏎️ ADDED DRIVERS ({drivers.length})</Text>
              <Text style={styles.sectionBadge}>
                {drivers.length > 0 ? `${drivers.length} Ready` : '0 Added'}
              </Text>
            </View>

            {drivers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🏎️</Text>
                <Text style={styles.emptyText}>No drivers added yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap below to register your team driver.
                </Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                {/* Driver Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>DRIVER NAME</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>MOBILE NO.</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>ACTIONS</Text>
                </View>
                {drivers.map((driver) => (
                  <DriverCard
                    key={String(driver.id)}
                    driver={driver}
                    onEdit={handleOpenEditDriver}
                  />
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.addMemberBtn} onPress={handleOpenAddDriver}>
              <Text style={styles.addMemberBtnText}>+ Add Driver</Text>
            </TouchableOpacity>
          </View>

          {/* SECTION 2: ADDED NAVIGATORS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>🗺️ ADDED NAVIGATORS ({navigators.length})</Text>
              <Text style={styles.sectionBadge}>
                {navigators.length > 0 ? `${navigators.length} Ready` : '0 Added'}
              </Text>
            </View>

            {navigators.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🗺️</Text>
                <Text style={styles.emptyText}>No navigators added yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap below to register your team navigator.
                </Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                {/* Navigator Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>NAVIGATOR NAME</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>MOBILE NO.</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>ACTIONS</Text>
                </View>
                {navigators.map((navigator) => (
                  <NavigatorCard
                    key={String(navigator.id)}
                    navigator={navigator}
                    onEdit={handleOpenEditNavigator}
                  />
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.addMemberBtn} onPress={handleOpenAddNavigator}>
              <Text style={styles.addMemberBtnText}>+ Add Navigator</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Modal 1: Driver Form Modal */}
      <DriverFormModal
        visible={activeForm === 'driver'}
        initialValues={selectedItemToEdit}
        existingMobiles={existingDriverMobiles}
        onSave={handleDriverSaved}
        onClose={() => setActiveForm(null)}
      />

      {/* Modal 2: Navigator Form Modal */}
      <NavigatorFormModal
        visible={activeForm === 'navigator'}
        initialValues={selectedItemToEdit}
        existingMobiles={existingNavigatorMobiles}
        onSave={handleNavigatorSaved}
        onClose={() => setActiveForm(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 24,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 20,
  },
  racingStripe: {
    width: 4,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionBadge: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  addMemberBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addMemberBtnText: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '800',
  },
  tableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  tableHeaderCell: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

