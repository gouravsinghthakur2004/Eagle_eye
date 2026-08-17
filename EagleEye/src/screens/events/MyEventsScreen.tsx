import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header } from '@/components';
import { useAppNavigation } from '@/context/NavigationContext';
import { bookingService } from '@/services/bookingService';
import { MyEventItem } from '@/types';
import { formatDate } from '@/utils/dateFormatter';
import { getEventStatusInfo } from '@/utils/eventLifecycle';
import { useNotification } from '@/hooks/useNotification';

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80';

const formatDateOnly = (dateStr?: string | null): string => {
  if (!dateStr || dateStr.trim() === '') return 'N/A';
  return formatDate(dateStr);
};

export const MyEventsScreen: React.FC = () => {
  const { goBack, navigate, openEventDetails } = useAppNavigation();
  const { showError } = useNotification();

  const [myEvents, setMyEvents] = useState<MyEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Completed'>('All');

  const fetchMyEvents = useCallback(async () => {
    try {
      setLoading(true);
      const list = await bookingService.getMyEvents();
      setMyEvents(list);
    } catch (err: any) {
      console.warn('[MyEventsScreen] Error loading events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyEvents();
  };

  const handleOpenDoc = (path?: string | null, docName: string = 'Document') => {
    if (!path || path.trim() === '') {
      showError('Unavailable', `${docName} document is not available.`);
      return;
    }
    const url = path.startsWith('http') ? path : `https://eagleeyeofficial.com/demo/${path.replace(/^\//, '')}`;
    Linking.openURL(url).catch(() => {
      showError('Error', `Could not open ${docName} link.`);
    });
  };

  const filteredEvents = myEvents.filter((item) => {
    if (activeTab === 'All') return true;
    const info = getEventStatusInfo(item.event_start_date, item.event_end_date);
    if (activeTab === 'Active') return info.status === 'upcoming' || info.status === 'live';
    if (activeTab === 'Completed') return info.status === 'completed';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="My Events" showBack onBack={goBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Title Header */}
        <View style={styles.titleSection}>
          <Text style={styles.badgeLabel}>REGISTERED RACES</Text>
          <Text style={styles.title}>My Joined Events</Text>
          <Text style={styles.subtitle}>Track your registered championship stages & telemetry.</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {(['All', 'Active', 'Completed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading State */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching your joined events...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'All' ? 'No Joined Events' : `No ${activeTab} Events`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'All'
                ? 'You have not registered for any motorsport events yet.'
                : `You currently have no ${activeTab.toLowerCase()} event registrations.`}
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.85}
              onPress={() => navigate('Events')}
            >
              <Text style={styles.exploreBtnText}>Explore Championships ➔</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Events List */
          filteredEvents.map((item, idx) => {
            const statusInfo = getEventStatusInfo(item.event_start_date, item.event_end_date);
            const imageUri = item.event_pic && item.event_pic.trim() !== '' ? item.event_pic : DEFAULT_EVENT_IMAGE;

            return (
              <View key={item.participant_id || item.event_id || idx} style={styles.eventCard}>
                {/* Image Banner & Overlay */}
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.badgeBg, borderColor: statusInfo.badgeBorder }]}>
                    <Text style={[styles.statusText, { color: statusInfo.badgeTextColor }]}>
                      {item.status_label || statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Content Details */}
                <View style={styles.cardContent}>
                  <Text style={styles.eventName}>{item.event_name}</Text>
                  <Text style={styles.venueText}>📍 {item.event_venue || 'Motorsport Circuit'}</Text>

                  {/* Dates Row */}
                  <View style={styles.datesRow}>
                    <View style={styles.dateChip}>
                      <Text style={styles.dateIcon}>⏱️</Text>
                      <Text style={styles.dateLabel}>Start: </Text>
                      <Text style={styles.dateValue}>{formatDateOnly(item.event_start_date)}</Text>
                    </View>
                    <View style={styles.dateChip}>
                      <Text style={styles.dateIcon}>🏁</Text>
                      <Text style={styles.dateLabel}>End: </Text>
                      <Text style={styles.dateValue}>{formatDateOnly(item.event_end_date)}</Text>
                    </View>
                  </View>

                  {/* Category & Class Badges */}
                  <View style={styles.categoryRow}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>🏷️ {item.category_name || 'Category'}</Text>
                    </View>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>⚡ Class: {item.class_name || 'Open'}</Text>
                    </View>
                  </View>

                  {/* Roster & Team Information */}
                  <View style={styles.rosterCard}>
                    <Text style={styles.teamNameText}>🚩 Team: {item.team || 'Motorsport Racing'}</Text>
                    {item.asn && <Text style={styles.asnText}>License: {item.asn}</Text>}
                    <View style={styles.driverRow}>
                      <Text style={styles.driverText}>🏎️ Driver: {item.driver_name || 'Racer'}</Text>
                      <Text style={styles.driverText}>🗺️ Navigator: {item.navigator_name || 'Navigator'}</Text>
                    </View>
                  </View>

                  {/* Payment Details Badge */}
                  <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>
                      💳 {item.payment_mode || 'Payment'}: ₹{item.payment_amount || '0'} • Ref: {item.payment_reference || 'N/A'}
                    </Text>
                  </View>

                  {/* Document & Details Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      activeOpacity={0.8}
                      onPress={() => openEventDetails(String(item.event_id), item)}
                    >
                      <Text style={styles.detailsBtnText}>View Details</Text>
                    </TouchableOpacity>

                    {item.sr_path ? (
                      <TouchableOpacity
                        style={styles.docBtn}
                        activeOpacity={0.8}
                        onPress={() => handleOpenDoc(item.sr_path, 'SR Doc')}
                      >
                        <Text style={styles.docBtnText}>📄 SR</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })
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
    paddingBottom: 28,
  },
  titleSection: {
    marginBottom: 16,
  },
  badgeLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabBtn: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '900',
  },
  loadingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: 20,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  imageWrapper: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 16,
  },
  eventName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  venueText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  dateLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  dateValue: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '800',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  catBadge: {
    backgroundColor: 'rgba(255, 122, 0, 0.12)',
    borderColor: 'rgba(255, 122, 0, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catBadgeText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '800',
  },
  rosterCard: {
    backgroundColor: '#18181C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamNameText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  asnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  driverRow: {
    gap: 4,
  },
  driverText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  paymentBadge: {
    backgroundColor: '#1A251E',
    borderColor: '#2563EB',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 14,
  },
  paymentBadgeText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailsBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  docBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  docBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
