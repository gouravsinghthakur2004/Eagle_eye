import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components/layout/Header';
import { useAppNavigation } from '@/context/NavigationContext';
import { driverNavigatorService } from '@/services/driverNavigatorService';
import { DriverNavigatorProfile } from '@/types';

export const SelectDriverScreen: React.FC = () => {
  const { goBack, navigate, user, selectDriverForJoin, currentScreen } = useAppNavigation();
  const userId = user?.id || (user as any)?.user_id;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [drivers, setDrivers] = useState<DriverNavigatorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
      const profiles = await driverNavigatorService.getProfiles(userId, 'driver');
      setDrivers(profiles);
    } catch (err) {
      console.warn('[SelectDriverScreen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Auto-refresh when screen comes into focus
  useEffect(() => {
    if (currentScreen === 'SelectDriver') {
      fetchDrivers();
    }
  }, [currentScreen, fetchDrivers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const isQueryValid = debouncedQuery.trim().length >= 2;

  const filteredDrivers = isQueryValid
    ? drivers.filter((d) => {
        const query = debouncedQuery.toLowerCase().trim();
        return Boolean(d.full_name?.toLowerCase().includes(query));
      })
    : [];

  const handleSelectDriver = (driver: DriverNavigatorProfile) => {
    selectDriverForJoin(driver);
  };

  const handleAddDriver = () => {
    navigate('DriverNavigatorProfile');
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
      {loading && !refreshing ? (
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
          <TouchableOpacity style={styles.addDriverBtn} onPress={handleAddDriver}>
            <Text style={styles.addDriverBtnText}>+ Add New Driver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDrivers}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏎️</Text>
              <Text style={styles.emptyTitle}>No Driver Found</Text>
              <Text style={styles.emptySubtitle}>
                No driver matching "{searchQuery}" was found in your registered team records.
              </Text>
              <TouchableOpacity style={styles.addDriverBtn} onPress={handleAddDriver}>
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
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.primaryLight,
    fontSize: 18,
    fontWeight: '800',
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
    fontSize: 12,
    fontWeight: '600',
  },
  selectBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  selectBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  infoVal: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
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
    borderRadius: 12,
  },
  addDriverBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
