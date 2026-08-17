import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { Header, EventCard } from '@/components';
import { eventService } from '@/services/eventService';
import { bookingService } from '@/services/bookingService';
import { EventItem } from '@/types';
import { useAppNavigation } from '@/context/NavigationContext';

export const EventsScreen: React.FC = () => {
  const { navigate, openEventDetails, openJoinEvent, user, currentScreen } = useAppNavigation();
  const userId = user?.id || (user as any)?.user_id;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEventsAndJoinedStatus = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsList, myEventsList] = await Promise.all([
        eventService.getEvents(),
        bookingService.getMyEvents(userId),
      ]);
      setEvents(eventsList);
      const joinedSet = new Set(
        myEventsList.map((item) => String(item.event_id || item.participant_id || item.id))
      );
      setJoinedEventIds(joinedSet);
    } catch (e) {
      console.warn('[EventsScreen] Events fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch and auto-refresh on screen focus
  useEffect(() => {
    fetchEventsAndJoinedStatus();
  }, [fetchEventsAndJoinedStatus]);

  useEffect(() => {
    if (currentScreen === 'Events') {
      fetchEventsAndJoinedStatus();
    }
  }, [currentScreen, fetchEventsAndJoinedStatus]);

  const handleViewDetails = (event: EventItem) => {
    openEventDetails(event.id, event);
  };

  const handleResults = (_event: EventItem) => {
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
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Motorsports Events</Text>
          <Text style={styles.subtitle}>Explore live races, championships & rally registrations.</Text>
        </View>

        {loading ? (
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
              isJoined={joinedEventIds.has(String(event.id))}
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
});
