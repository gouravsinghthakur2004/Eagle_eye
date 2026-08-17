import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components/layout/Header';
import { useAppNavigation } from '@/context/NavigationContext';
import { vehicleService } from '@/services/vehicleService';
import { VehicleProfile } from '@/types';
import { VehicleFormModal } from '@/components/vehicles/VehicleFormModal';

export const SelectVehicleScreen: React.FC = () => {
  const { goBack, user, selectVehicleForJoin, currentScreen } = useAppNavigation();
  const userId = user?.id || (user as any)?.user_id;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Debounce search query 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicles(userId);
      setVehicles(data);
    } catch (err) {
      console.warn('[SelectVehicleScreen] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-refresh when screen comes into focus
  useEffect(() => {
    if (currentScreen === 'SelectVehicle') {
      fetchVehicles();
    }
  }, [currentScreen, fetchVehicles]);

  const isQueryValid = debouncedQuery.trim().length >= 2;

  const filteredVehicles = isQueryValid
    ? vehicles.filter((v) => {
        const query = debouncedQuery.toLowerCase().trim();
        const rcMatch = v.vehicle_rc_no?.toLowerCase().includes(query);
        const nickMatch = v.vehicle_nick_name?.toLowerCase().includes(query);
        return Boolean(rcMatch || nickMatch);
      })
    : [];

  const handleSelectVehicle = (vehicle: VehicleProfile) => {
    selectVehicleForJoin(vehicle);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleVehicleSaved = (savedVehicle: VehicleProfile) => {
    selectVehicleForJoin(savedVehicle);
    setVehicles((prev) => [savedVehicle, ...prev]);
    fetchVehicles();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Select Vehicle" showBack onBack={goBack} />

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Type vehicle number plate / RC (e.g. MP09CD0186)..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main List / Loading / Prompt / Empty */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching registered vehicles…</Text>
        </View>
      ) : !isQueryValid ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏎️</Text>
          <Text style={styles.emptyTitle}>Search Vehicle by Number Plate</Text>
          <Text style={styles.emptySubtitle}>
            Type at least 2 characters of the vehicle registration/number plate (e.g. MP09CD0186) to search.
          </Text>
          <TouchableOpacity style={styles.addVehicleBtn} onPress={handleOpenAddModal}>
            <Text style={styles.addVehicleBtnText}>+ Add New Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏎️</Text>
              <Text style={styles.emptyTitle}>No Vehicle Found</Text>
              <Text style={styles.emptySubtitle}>
                No vehicle matching "{searchQuery}" was found in your registered garage.
              </Text>
              <TouchableOpacity style={styles.addVehicleBtn} onPress={handleOpenAddModal}>
                <Text style={styles.addVehicleBtnText}>+ Add New Vehicle</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vehicleItemCard}
              activeOpacity={0.8}
              onPress={() => handleSelectVehicle(item)}
            >
              <View style={styles.itemHeader}>
                <View style={styles.iconBox}>
                  <Text style={styles.carIcon}>🏎️</Text>
                </View>
                <View style={styles.nameContainer}>
                  <Text style={styles.vehicleNickName}>
                    {item.vehicle_nick_name || 'Race Vehicle'}
                  </Text>
                  <Text style={styles.vehicleMakeModel}>
                    {item.vehicle_manufacturing} {item.vehicle_model}
                  </Text>
                </View>
                <View style={styles.selectBadge}>
                  <Text style={styles.selectBadgeText}>Select ➔</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>RC NUMBER:</Text>
                <Text style={styles.infoVal}>{item.vehicle_rc_no || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>OWNER:</Text>
                <Text style={styles.infoVal}>{item.vehicle_owner_name || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>SPECS:</Text>
                <Text style={styles.infoVal}>
                  {item.vehicle_cc ? `${item.vehicle_cc} CC` : ''} ({item.fuel_type || 'N/A'})
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Vehicle Add Modal */}
      <VehicleFormModal
        visible={isAddModalOpen}
        onSave={handleVehicleSaved}
        onClose={() => setIsAddModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: COLORS.white,
    fontSize: 14,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
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
  listPadding: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyCard: {
    margin: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  addVehicleBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addVehicleBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  vehicleItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  carIcon: {
    fontSize: 22,
  },
  nameContainer: {
    flex: 1,
  },
  vehicleNickName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  vehicleMakeModel: {
    color: COLORS.accentOrange,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  selectBadge: {
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectBadgeText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  infoVal: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
