import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header, EventCard } from '@/components';
import { eventService } from '@/services/eventService';
import { EventItem } from '@/types';
import { useAppNavigation } from '@/context/NavigationContext';

export const EventsScreen: React.FC = () => {
  const { navigate, openEventDetails, openJoinEvent } = useAppNavigation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (e) {
      console.warn('Events fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleViewDetails = (event: EventItem) => {
    openEventDetails(event.id, event);
  };

  const handleResults = (event: EventItem) => {
    navigate('Results');
  };

  const handleJoinEvent = (event: EventItem) => {
    openJoinEvent(event);
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.titleSection}>
          <Text style={styles.title}>Motorsports Events</Text>
          <Text style={styles.subtitle}>Explore live races, championships & rally registrations.</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading live events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptySubtitle}>Check back soon for upcoming rally races and track events.</Text>
          </View>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={handleViewDetails}
              onResults={handleResults}
              onJoinEvent={handleJoinEvent}
            />
          ))
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
  titleSection: {
    marginBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Modal Styles
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
    marginBottom: 6,
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
