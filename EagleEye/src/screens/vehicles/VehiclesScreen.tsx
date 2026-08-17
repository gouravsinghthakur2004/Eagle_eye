import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components/layout/Header';
import { useAppNavigation } from '@/context/NavigationContext';
import { VehicleProfile } from '@/types';
import { vehicleService } from '@/services/vehicleService';
import { VehicleFormModal } from '@/components/vehicles/VehicleFormModal';
import { useNotification } from '@/hooks/useNotification';

export const VehiclesScreen: React.FC = () => {
  const { user, selectVehicleForJoin } = useAppNavigation();
  const { showSuccess, showConfirm } = useNotification();
  const userId = user?.id || (user as any)?.user_id;

  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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
    }
  }, [userId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleOpenAddVehicle = () => {
    setSelectedVehicleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: VehicleProfile) => {
    setSelectedVehicleToEdit(vehicle);
    setIsModalOpen(true);
  };

  const handleVehicleSaved = (savedVehicle: VehicleProfile) => {
    selectVehicleForJoin(savedVehicle);
    setVehicles((prev) => {
      const idx = prev.findIndex((v) => String(v.id) === String(savedVehicle.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedVehicle;
        return copy;
      }
      return [...prev, savedVehicle];
    });
    fetchVehicles();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVehicleToEdit(null);
  };

  const handleRemoveVehicle = (vehicleId: string | number) => {
    showConfirm({
      title: 'Delete Vehicle?',
      message: 'Are you sure you want to delete this vehicle profile?',
      icon: '🏎️',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await vehicleService.deleteVehicle(vehicleId, userId);
          if (res.success) {
            showSuccess('Vehicle Deleted', res.message || 'Vehicle deleted successfully');
            setVehicles((prev) => prev.filter((v) => String(v.id) !== String(vehicleId)));
            fetchVehicles();
          }
        } catch (err) {
          console.warn('[VehiclesScreen] Remove error:', err);
        }
      },
    });
  };

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
        >
          {/* Vehicles Count Banner */}
          <View style={styles.counterBanner}>
            <Text style={styles.counterBannerText}>Vehicles Added: {vehicles.length}</Text>
          </View>

          {vehicles.length === 0 ? (
            /* EMPTY STATE: NO VEHICLE REGISTERED */
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏎️</Text>
              <Text style={styles.emptyTitle}>No vehicles added yet</Text>
              <Text style={styles.emptySubtitle}>
                Your race vehicle hasn't been registered yet. Tap below to add your vehicle profile.
              </Text>

              <TouchableOpacity
                style={styles.registerBtn}
                onPress={handleOpenAddVehicle}
              >
                <Text style={styles.registerBtnText}>+ Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* EXISTING VEHICLES TABLE DISPLAY */
            <View style={styles.profileContainer}>
              <View style={styles.tableCard}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>VEHICLE NAME</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>PLATE / RC NO.</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.4, textAlign: 'right' }]}>ACTIONS</Text>
                </View>

                {/* Table Data Rows */}
                {vehicles.map((v, idx) => {
                  const vehicleName =
                    v.vehicle_nick_name ||
                    `${v.vehicle_manufacturing || ''} ${v.vehicle_model || ''}`.trim() ||
                    `Vehicle #${idx + 1}`;
                  const makeModelText = `${v.vehicle_manufacturing || ''} ${v.vehicle_model || ''}`.trim();

                  return (
                    <View key={v.id || idx} style={styles.tableDataRow}>
                      {/* Vehicle Name Column */}
                      <View style={styles.nameCol}>
                        <Text style={styles.vehicleNameText} numberOfLines={1}>
                          {vehicleName}
                        </Text>
                        {Boolean(makeModelText) && (
                          <Text style={styles.makeModelText} numberOfLines={1}>
                            {makeModelText}
                          </Text>
                        )}
                      </View>

                      {/* Plate / RC No Column */}
                      <View style={styles.plateCol}>
                        <View style={styles.plateBadge}>
                          <Text style={styles.plateText} numberOfLines={1}>
                            {v.vehicle_rc_no || 'N/A'}
                          </Text>
                        </View>
                      </View>

                      {/* Actions Column */}
                      <View style={styles.actionCol}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => handleOpenEditVehicle(v)}
                        >
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => v.id && handleRemoveVehicle(v.id)}
                        >
                          <Text style={styles.removeBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Bottom Add Vehicle Action Button */}
              <TouchableOpacity
                style={styles.bottomEditBtn}
                onPress={handleOpenAddVehicle}
              >
                <Text style={styles.bottomEditBtnText}>+ Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Complete Production 4-Step Vehicle Form Modal */}
      <VehicleFormModal
        visible={isModalOpen}
        initialValues={selectedVehicleToEdit}
        onSave={handleVehicleSaved}
        onClose={handleModalClose}
      />
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
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  profileContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  bottomEditBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  bottomEditBtnText: {
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
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
  },
  nameCol: {
    flex: 2.2,
    paddingRight: 6,
  },
  vehicleNameText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  makeModelText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  plateCol: {
    flex: 1.8,
    paddingRight: 6,
  },
  plateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  plateText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionCol: {
    flex: 1.4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editBtnText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '800',
  },
  removeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
});
