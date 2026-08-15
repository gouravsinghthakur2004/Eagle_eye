import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components/layout/Header';
import { useAppNavigation } from '@/context/NavigationContext';
import { VehicleProfile } from '@/types';
import { vehicleService } from '@/services/vehicleService';
import { VehicleWizard } from '@/components/common/VehicleWizard';

export const VehiclesScreen: React.FC = () => {
  const { user } = useAppNavigation();
  const userId = user?.id;

  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardMode, setWizardMode] = useState<'add' | 'edit'>('add');
  const [selectedVehicleToEdit, setSelectedVehicleToEdit] = useState<VehicleProfile | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!userId) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await vehicleService.getVehicles(userId);
      setVehicles(data);
    } catch (err) {
      console.warn('[VehiclesScreen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const handleOpenAddVehicle = () => {
    setSelectedVehicleToEdit(null);
    setWizardMode('add');
    setIsWizardOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: VehicleProfile) => {
    setSelectedVehicleToEdit(vehicle);
    setWizardMode('edit');
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setSelectedVehicleToEdit(null);
  };

  const handleWizardSuccess = () => {
    handleWizardClose();
    fetchVehicles();
  };

  if (isWizardOpen) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header
          title={wizardMode === 'edit' ? 'Edit Vehicle' : 'Register Vehicle'}
          showBack
          onBack={handleWizardClose}
        />
        <VehicleWizard
          mode={wizardMode}
          initialVehicle={selectedVehicleToEdit}
          onSuccess={handleWizardSuccess}
          onCancel={handleWizardClose}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Vehicles" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading vehicle profiles…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Vehicles Count Banner */}
          <View style={styles.counterBanner}>
            <Text style={styles.counterBannerText}>Vehicles Added: {vehicles.length}</Text>
          </View>

          {vehicles.length === 0 ? (
            /* EMPTY STATE: NO VEHICLE REGISTERED */
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏎️</Text>
              <Text style={styles.emptyTitle}>NO VEHICLE REGISTERED</Text>
              <Text style={styles.emptySubtitle}>
                Your race vehicle hasn't been registered yet. Add your vehicle telemetry and specification profile.
              </Text>

              <TouchableOpacity
                style={styles.registerBtn}
                onPress={handleOpenAddVehicle}
              >
                <Text style={styles.registerBtnText}>[ + REGISTER VEHICLE ]</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* EXISTING VEHICLES LIST DISPLAY */
            <View style={styles.profileContainer}>
              {vehicles.map((v, idx) => (
                <View key={v.id || idx} style={{ marginBottom: 16 }}>
                  {/* Hero Banner Card */}
                  <View style={styles.heroCard}>
                    <View style={styles.heroHeaderRow}>
                      <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>VEHICLE #{idx + 1}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.editHeaderBtn}
                        onPress={() => handleOpenEditVehicle(v)}
                      >
                        <Text style={styles.editHeaderBtnText}>[ EDIT ]</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.vehicleNickName}>
                      {v.vehicle_nick_name || `Race Vehicle #${idx + 1}`}
                    </Text>
                    <Text style={styles.vehicleMakeModel}>
                      {v.vehicle_manufacturing} {v.vehicle_model}
                    </Text>
                  </View>

                  {/* Technical Specifications Grid */}
                  <View style={[styles.sectionCard, { marginTop: 10 }]}>
                    <Text style={styles.sectionTitle}>VEHICLE SPECS</Text>
                    <View style={styles.gridContainer}>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>ENGINE CC</Text>
                        <Text style={styles.gridVal}>{v.vehicle_cc ? `${v.vehicle_cc} CC` : 'N/A'}</Text>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>TURBO</Text>
                        <Text style={styles.gridVal}>{v.is_turbo || 'No'}</Text>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>FUEL TYPE</Text>
                        <Text style={styles.gridVal}>{v.fuel_type || 'N/A'}</Text>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>DRIVE TYPE</Text>
                        <Text style={styles.gridVal}>{v.drive_type || 'N/A'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Registration Information */}
                  <View style={[styles.sectionCard, { marginTop: 10 }]}>
                    <Text style={styles.sectionTitle}>REGISTRATION & INSURANCE</Text>
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>RC NO:</Text>
                      <Text style={styles.dataVal}>{v.vehicle_rc_no || 'N/A'}</Text>
                    </View>
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>OWNER:</Text>
                      <Text style={styles.dataVal}>{v.vehicle_owner_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>INSURANCE POLICY:</Text>
                      <Text style={styles.dataVal}>{v.insurance_no || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Bottom Add/Edit Action Button */}
              <TouchableOpacity
                style={styles.bottomEditBtn}
                onPress={handleOpenAddVehicle}
              >
                <Text style={styles.bottomEditBtnText}>+ ADD NEW VEHICLE ➔</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  counterBanner: {
    backgroundColor: '#111111',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  counterBannerText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '800',
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
    padding: 20,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  registerBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  registerBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  profileContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  editHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editHeaderBtnText: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleNickName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  vehicleMakeModel: {
    color: COLORS.accentOrange,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sectionTitle: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBox: {
    width: 140,
    marginRight: 12,
  },
  photoImg: {
    width: 140,
    height: 100,
    borderRadius: 10,
    marginBottom: 4,
  },
  photoTag: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '46%',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  gridLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  gridVal: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  dataLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  dataVal: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  docBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
  },
  docBadgeText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '600',
  },
  infoText: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomEditBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  bottomEditBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
