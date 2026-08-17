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
import { NavigatorFormModal } from '@/components/drivers/NavigatorFormModal';

export const SelectNavigatorScreen: React.FC = () => {
  const { goBack, user, selectNavigatorForJoin, currentScreen } = useAppNavigation();
  const userId = user?.id || (user as any)?.user_id;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [navigators, setNavigators] = useState<DriverNavigatorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Debounce search query 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchNavigators = useCallback(async () => {
    try {
      setLoading(true);
      // Strictly fetch only profiles with role_type === 'navigator'
      const profiles = await driverNavigatorService.getProfiles(userId, 'navigator');
      const strictlyNavigators = profiles.filter(
        (p) => String(p.role_type || '').toLowerCase() === 'navigator'
      );
      setNavigators(strictlyNavigators);
    } catch (err) {
      console.warn('[SelectNavigatorScreen] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-refresh when screen comes into focus
  useEffect(() => {
    if (currentScreen === 'SelectNavigator') {
      fetchNavigators();
    }
  }, [currentScreen, fetchNavigators]);

  const isQueryValid = debouncedQuery.trim().length >= 2;

  // STRICT ENTITY ISOLATION: Must match query AND have role_type === 'navigator'
  const filteredNavigators = isQueryValid
    ? navigators.filter((n) => {
        const isNavigator = String(n.role_type || '').toLowerCase() === 'navigator';
        if (!isNavigator) return false;

        const query = debouncedQuery.toLowerCase().trim();
        const nameMatch = n.full_name?.toLowerCase().includes(query);
        const nickMatch = n.race_nick_name?.toLowerCase().includes(query);
        const mobileMatch = n.mobile_no?.includes(query);
        return Boolean(nameMatch || nickMatch || mobileMatch);
      })
    : [];

  const handleSelectNavigator = (navigator: DriverNavigatorProfile) => {
    if (String(navigator.role_type || '').toLowerCase() !== 'navigator') {
      console.warn('[SelectNavigatorScreen] Attempted to select non-navigator entity:', navigator);
      return;
    }
    selectNavigatorForJoin(navigator);
  };

  const handleOpenAddNavigator = () => {
    setIsAddModalOpen(true);
  };

  const handleNavigatorSaved = (savedNavigator: DriverNavigatorProfile) => {
    if (String(savedNavigator.role_type || '').toLowerCase() === 'navigator') {
      selectNavigatorForJoin(savedNavigator);
      setNavigators((prev) => [savedNavigator, ...prev]);
    }
    fetchNavigators();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Select Navigator" showBack onBack={goBack} />

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Type at least 2 characters to search Navigator by Name"
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
          <Text style={styles.loadingText}>Searching registered navigators…</Text>
        </View>
      ) : !isQueryValid ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>Search Navigator by Name</Text>
          <Text style={styles.emptySubtitle}>
            Type at least 2 characters of the navigator's full name in the search bar above to view matching navigators.
          </Text>
          <TouchableOpacity style={styles.addNavigatorBtn} onPress={handleOpenAddNavigator}>
            <Text style={styles.addNavigatorBtnText}>+ Add New Navigator</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredNavigators}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyTitle}>No Navigator Found</Text>
              <Text style={styles.emptySubtitle}>
                No navigator matching "{searchQuery}" was found in your registered team records.
              </Text>
              <TouchableOpacity style={styles.addNavigatorBtn} onPress={handleOpenAddNavigator}>
                <Text style={styles.addNavigatorBtnText}>+ Add New Navigator</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.navigatorItemCard}
              activeOpacity={0.8}
              onPress={() => handleSelectNavigator(item)}
            >
              <View style={styles.itemHeader}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>
                    {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'N'}
                  </Text>
                </View>
                <View style={styles.nameContainer}>
                  <Text style={styles.navigatorName}>{item.full_name || 'Unnamed Navigator'}</Text>
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
                <Text style={styles.roleBadge}>NAVIGATOR</Text>
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

      {/* Navigator Add Modal */}
      <NavigatorFormModal
        visible={isAddModalOpen}
        onSave={handleNavigatorSaved}
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
  addNavigatorBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addNavigatorBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  navigatorItemCard: {
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
  navigatorName: {
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
