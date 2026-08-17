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
import { driverNavigatorService } from '@/services/driverNavigatorService';
import { DriverNavigatorProfile } from '@/types';
import { DriverFormModal } from '@/components/drivers/DriverFormModal';

export const SelectDriverScreen: React.FC = () => {
  const { goBack, user, selectDriverForJoin, currentScreen } = useAppNavigation();
  const userId = user?.id || (user as any)?.user_id;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [drivers, setDrivers] = useState<DriverNavigatorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Debounce search query 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      // Strictly fetch only profiles with role_type === 'driver'
      const profiles = await driverNavigatorService.getProfiles(userId, 'driver');
      const strictlyDrivers = profiles.filter(
        (p) => String(p.role_type || '').toLowerCase() === 'driver'
      );
      setDrivers(strictlyDrivers);
    } catch (err) {
      console.warn('[SelectDriverScreen] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-refresh when screen comes into focus
  useEffect(() => {
    if (currentScreen === 'SelectDriver') {
      fetchDrivers();
    }
  }, [currentScreen, fetchDrivers]);

  const isQueryValid = debouncedQuery.trim().length >= 2;

  // STRICT ENTITY ISOLATION: Must match query AND have role_type === 'driver'
  const filteredDrivers = isQueryValid
    ? drivers.filter((d) => {
        const isDriver = String(d.role_type || '').toLowerCase() === 'driver';
        if (!isDriver) return false;

        const query = debouncedQuery.toLowerCase().trim();
        const nameMatch = d.full_name?.toLowerCase().includes(query);
        const nickMatch = d.race_nick_name?.toLowerCase().includes(query);
        const mobileMatch = d.mobile_no?.includes(query);
        return Boolean(nameMatch || nickMatch || mobileMatch);
      })
    : [];

  const handleSelectDriver = (driver: DriverNavigatorProfile) => {
    if (String(driver.role_type || '').toLowerCase() !== 'driver') {
      console.warn('[SelectDriverScreen] Attempted to select non-driver entity:', driver);
      return;
    }
    selectDriverForJoin(driver);
  };

  const handleOpenAddDriver = () => {
    setIsAddModalOpen(true);
  };

  const handleDriverSaved = (savedDriver: DriverNavigatorProfile) => {
    if (String(savedDriver.role_type || '').toLowerCase() === 'driver') {
      selectDriverForJoin(savedDriver);
      setDrivers((prev) => [savedDriver, ...prev]);
    }
    fetchDrivers();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Select Driver" showBack onBack={goBack} />

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Type at least 2 characters to search Driver by Name"
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
          <Text style={styles.loadingText}>Searching registered drivers…</Text>
        </View>
      ) : !isQueryValid ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏎️</Text>
          <Text style={styles.emptyTitle}>Search Driver by Name</Text>
          <Text style={styles.emptySubtitle}>
            Type at least 2 characters of the driver's full name in the search bar above to view matching drivers.
          </Text>
          <TouchableOpacity style={styles.addDriverBtn} onPress={handleOpenAddDriver}>
            <Text style={styles.addDriverBtnText}>+ Add New Driver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDrivers}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏎️</Text>
              <Text style={styles.emptyTitle}>No Driver Found</Text>
              <Text style={styles.emptySubtitle}>
                No driver matching "{searchQuery}" was found in your registered team records.
              </Text>
              <TouchableOpacity style={styles.addDriverBtn} onPress={handleOpenAddDriver}>
                <Text style={styles.addDriverBtnText}>+ Add New Driver</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.driverItemCard}
              activeOpacity={0.8}
              onPress={() => handleSelectDriver(item)}
            >
              <View style={styles.itemHeader}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>
                    {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'D'}
                  </Text>
                </View>
                <View style={styles.nameContainer}>
                  <Text style={styles.driverName}>{item.full_name || 'Unnamed Driver'}</Text>
                  {Boolean(item.race_nick_name) && (
                    <Text style={styles.nickName}>"{item.race_nick_name}"</Text>
                  )}
                </View>
                <View style={styles.selectBadge}>
                  <Text style={styles.selectBadgeText}>Select ➔</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ROLE:</Text>
                <Text style={styles.roleBadge}>DRIVER</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MOBILE:</Text>
                <Text style={styles.infoVal}>{item.mobile_no || 'N/A'}</Text>
              </View>
              {Boolean(item.email) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>EMAIL:</Text>
                  <Text style={styles.infoVal}>{item.email}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Driver Add Modal */}
      <DriverFormModal
        visible={isAddModalOpen}
        onSave={handleDriverSaved}
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
  addDriverBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addDriverBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  driverItemCard: {
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
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.primaryLight,
    fontSize: 18,
    fontWeight: '900',
  },
  nameContainer: {
    flex: 1,
  },
  driverName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  nickName: {
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
    alignItems: 'center',
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
  roleBadge: {
    color: COLORS.primaryLight,
    backgroundColor: 'rgba(255, 122, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
