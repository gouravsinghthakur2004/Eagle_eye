import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header, EventCard } from '@/components';
import { useAppNavigation, ScreenName } from '@/context/NavigationContext';
import { eventService } from '@/services/eventService';
import { bannerService, ApiBannerItem, resolveBannerImage } from '@/services/bannerService';
import { bookingService } from '@/services/bookingService';
import { EventItem } from '@/types';

const { width } = Dimensions.get('window');

// Carousel Card Width matching full container bounds (width minus paddingHorizontal * 2)
const CAROUSEL_WIDTH = width - 32;

export const HomeScreen: React.FC = () => {
  const { navigate, openEventDetails, openJoinEvent, user } = useAppNavigation();
  const userId = user?.id || (user as any)?.user_id;
  const [searchQuery, setSearchQuery] = useState('');
  const [apiBanners, setApiBanners] = useState<ApiBannerItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const bannerFlatListRef = useRef<FlatList<ApiBannerItem>>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState<number>(0);

  const flatListRef = useRef<FlatList<EventItem>>(null);
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [banners, realEvents, myEventsList] = await Promise.all([
        bannerService.getBanners(),
        eventService.getEvents(),
        bookingService.getMyEvents(userId),
      ]);

      const joinedSet = new Set(
        myEventsList.map((item) => String(item.event_id || item.participant_id || item.id))
      );
      setJoinedEventIds(joinedSet);

      // Enrich dynamic banners by cross-referencing event_id against real events
      const enrichedBanners: ApiBannerItem[] = banners.map((b) => {
        const matchedEvent = realEvents.find(
          (e) => String(e.id) === String(b.event_id)
        );

        const hasValidImg =
          b.image_url &&
          b.image_url.trim() !== '' &&
          b.image_url.trim().toUpperCase() !== 'NA';

        const resolvedImg = hasValidImg
          ? b.image_url
          : matchedEvent?.event_pic || matchedEvent?.event_header_img || '';

        const hasValidTitle =
          b.title &&
          b.title.trim() !== '' &&
          b.title.trim().toLowerCase() !== 'test';

        const resolvedTitle = hasValidTitle
          ? b.title
          : matchedEvent?.event_name || 'EagleEye Championship 2026';

        const resolvedLink =
          b.link_url && b.link_url.toUpperCase() !== 'NA'
            ? b.link_url
            : matchedEvent?.event_venue || 'Official EagleEye Rally Stage';

        return {
          ...b,
          title: resolvedTitle,
          image_url: resolvedImg,
          link_url: resolvedLink,
        };
      });

      // If banner list is empty or has no images, map real events directly as top banners!
      if (enrichedBanners.length === 0 || enrichedBanners.every((b) => !b.image_url)) {
        const eventBanners: ApiBannerItem[] = realEvents.map((e) => ({
          id: String(e.id),
          title: e.event_name,
          image_url: e.event_pic || e.event_header_img || '',
          link_url: e.event_venue,
          event_id: String(e.id),
          is_active: '1',
          is_deleted: '0',
        }));
        setApiBanners(eventBanners);
      } else {
        setApiBanners(enrichedBanners);
      }

      setUpcomingEvents(realEvents);
    } catch (err) {
      console.warn('[HomeScreen] Error loading live data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  // Auto-sliding Banner Carousel interval
  useEffect(() => {
    if (apiBanners.length <= 1) return;

    const timer = setInterval(() => {
      setActiveBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % apiBanners.length;
        bannerFlatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [apiBanners.length]);

  // Auto-sliding Events Carousel interval
  useEffect(() => {
    if (upcomingEvents.length <= 1 || isUserInteracting) return;

    const timer = setInterval(() => {
      setActiveEventIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % upcomingEvents.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [upcomingEvents.length, isUserInteracting]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleBannerPress = (banner: ApiBannerItem) => {
    if (banner.event_id) {
      openEventDetails(String(banner.event_id));
    } else if (banner.link_url && banner.link_url.toUpperCase() !== 'NA') {
      const url = banner.link_url.startsWith('http') ? banner.link_url : `https://${banner.link_url}`;
      Linking.openURL(url).catch(() => navigate('Events'));
    } else {
      navigate('Events');
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CAROUSEL_WIDTH);
    if (index >= 0 && index < upcomingEvents.length && index !== activeEventIndex) {
      setActiveEventIndex(index);
    }
  };

  const handleScrollBeginDrag = () => {
    setIsUserInteracting(true);
  };

  const handleScrollEndDrag = () => {
    setTimeout(() => {
      setIsUserInteracting(false);
    }, 4000);
  };

  const quickActions: { label: string; icon: string; screen: ScreenName; color: string }[] = [
    { label: 'Events', icon: '🏁', screen: 'Events', color: '#FF6B00' },
    { label: 'Organizations', icon: '🏛️', screen: 'Organizations', color: '#3B82F6' },
    { label: 'Drivers', icon: '🏎️', screen: 'Drivers', color: '#10B981' },
    { label: 'Results', icon: '🏆', screen: 'Results', color: '#8B5CF6' },
  ];

  const handleViewDetails = (event: EventItem) => {
    // Preserve event.id and navigate to dedicated EventDetailsScreen
    openEventDetails(event.id, event);
  };

  const handleResults = (_event: EventItem) => {
    navigate('Results');
  };

  const handleJoinEvent = (event: EventItem) => {
    openJoinEvent(event);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search races, drivers, teams..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dynamic API Banner Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Championships</Text>
        </View>

        {apiBanners.length > 0 && (
          <View style={styles.carouselWrapper}>
            <FlatList
              ref={bannerFlatListRef}
              data={apiBanners}
              keyExtractor={(item) => String(item.id)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CAROUSEL_WIDTH}
              snapToAlignment="center"
              getItemLayout={(_, index) => ({
                length: CAROUSEL_WIDTH,
                offset: CAROUSEL_WIDTH * index,
                index,
              })}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.bannerCard, { width: CAROUSEL_WIDTH, marginRight: 0 }]}
                  onPress={() => handleBannerPress(item)}
                >
                  <Image
                    source={{ uri: resolveBannerImage(item.image_url, undefined, index) }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bannerOverlay}>
                    <View style={styles.bannerBadge}>
                      <Text style={styles.bannerBadgeText}>FEATURED</Text>
                    </View>
                    <Text style={styles.bannerTitle} numberOfLines={1}>
                      {item.title || 'EagleEye Championship 2026'}
                    </Text>
                    <Text style={styles.bannerSubtitle} numberOfLines={1}>
                      {item.link_url && item.link_url.toUpperCase() !== 'NA'
                        ? item.link_url
                        : 'Official EagleEye Rally Stage'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            {apiBanners.length > 1 && (
              <View style={styles.paginationDotsContainer}>
                {apiBanners.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === activeBannerIndex ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Action Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              activeOpacity={0.8}
              style={styles.actionCard}
              onPress={() => navigate(action.screen)}
            >
              <View style={[styles.actionIconBg, { backgroundColor: `${action.color}20` }]}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Header: Upcoming Events */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigate('Events')}>
            <Text style={styles.seeAllText}>See All ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Real API Event FlatList Horizontal Carousel */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading live API events...</Text>
          </View>
        ) : upcomingEvents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={styles.emptyTitle}>No events available</Text>
            <Text style={styles.emptySubtitle}>There are currently no active events scheduled.</Text>
          </View>
        ) : (
          <View style={styles.carouselWrapper}>
            <FlatList
              ref={flatListRef}
              data={upcomingEvents}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CAROUSEL_WIDTH}
              snapToAlignment="center"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              getItemLayout={(_, index) => ({
                length: CAROUSEL_WIDTH,
                offset: CAROUSEL_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={{ width: CAROUSEL_WIDTH }}>
                  <EventCard
                    event={item}
                    isJoined={joinedEventIds.has(String(item.id))}
                    cardWidth={CAROUSEL_WIDTH}
                    style={{ marginRight: 0 }}
                    onViewDetails={handleViewDetails}
                    onResults={handleResults}
                    onJoinEvent={handleJoinEvent}
                  />
                </View>
              )}
            />
            {upcomingEvents.length > 1 && (
              <View style={styles.paginationDotsContainer}>
                {upcomingEvents.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveEventIndex(index);
                      flatListRef.current?.scrollToIndex({ index, animated: true });
                    }}
                    style={[
                      styles.dot,
                      activeEventIndex === index ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 14,
    height: 50,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  clearIcon: {
    color: COLORS.textMuted,
    fontSize: 14,
    padding: 4,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  bannerScrollView: {
    marginBottom: 24,
  },
  bannerCard: {
    width: width - 50,
    height: 170,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 14,
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  bannerBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  actionCard: {
    width: (width - 64) / 4,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  carouselWrapper: {
    marginBottom: 16,
  },
  paginationDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: COLORS.surfaceBorder,
  },
  carouselContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  loadingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalScroll: {
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalEventTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 10,
    marginBottom: 4,
  },
  modalCategoryBadge: {
    color: COLORS.accentOrange,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  sectionHeading: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  modalClosePrimaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  modalClosePrimaryText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
