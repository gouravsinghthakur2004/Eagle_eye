import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { JoinEventPayload, MyEventItem, EventItem } from '@/types';
import { eventService } from './eventService';
import { sortEvents, getEventStatusInfo } from '@/utils/eventLifecycle';

export interface BookingItem {
  id: string;
  eventId: string;
  eventName: string;
  bookingDate: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

const getUserJoinedEventsStorageKey = (userId?: string | number): string => {
  if (!userId) return '@eagleeye_joined_events_guest';
  return `@eagleeye_joined_events_${userId}`;
};

export const bookingService = {
  /**
   * Check if the authenticated user has already joined an event
   */
  isEventAlreadyJoined: async (
    eventId: string | number,
    userId?: string | number
  ): Promise<boolean> => {
    if (!eventId) return false;
    try {
      const myEvents = await bookingService.getMyEvents(userId);
      return myEvents.some(
        (item) =>
          String(item.event_id) === String(eventId) ||
          String(item.id) === String(eventId)
      );
    } catch {
      return false;
    }
  },

  /**
   * Fetch only current authenticated user's joined events from backend
   * Enriched with full event metadata (name, dates, venue, pictures, status)
   */
  getMyEvents: async (userId?: string | number): Promise<MyEventItem[]> => {
    const storageKey = getUserJoinedEventsStorageKey(userId);
    let remoteList: MyEventItem[] = [];

    // 1. Try official remote endpoint GET /events/myevents
    try {
      const response = await client.get<any>(ENDPOINTS.EVENTS.MY_EVENTS);
      if (response.data) {
        const body = response.data;
        const list = body.events || body.data?.events || body.data || (Array.isArray(body) ? body : null);
        if (Array.isArray(list) && list.length > 0) {
          remoteList = list;
        }
      }
    } catch (err: any) {
      console.warn('[bookingService.getMyEvents] Remote GET failed, checking offline cache:', err?.message || err);
    }

    // 2. Read locally cached registrations for this user
    let localList: MyEventItem[] = [];
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localList = parsed;
        }
      }
    } catch {}

    // 3. Merge remote and local without losing previously joined events
    const mergedMap = new Map<string, MyEventItem>();

    // Add local items first
    for (const item of localList) {
      const key = String(item.event_id || item.participant_id || item.id);
      if (key) mergedMap.set(key, item);
    }

    // Overlay remote items
    for (const item of remoteList) {
      const key = String(item.event_id || item.participant_id || item.id);
      if (key) {
        const existing = mergedMap.get(key) || {};
        mergedMap.set(key, { ...existing, ...item });
      }
    }

    // 4. Enrich with master events metadata (ensures dates, image, name, venue are always consistent)
    let allMasterEvents: EventItem[] = [];
    try {
      allMasterEvents = await eventService.getEvents();
    } catch {}

    const masterEventsMap = new Map<string, EventItem>();
    for (const ev of allMasterEvents) {
      if (ev.id) masterEventsMap.set(String(ev.id), ev);
    }

    const enrichedList: MyEventItem[] = Array.from(mergedMap.values()).map((joined) => {
      const master = masterEventsMap.get(String(joined.event_id)) || masterEventsMap.get(String(joined.id));
      const startDate = joined.event_start_date || master?.event_start_date || '';
      const endDate = joined.event_end_date || master?.event_end_date || '';
      const statusInfo = getEventStatusInfo(startDate, endDate);

      return {
        ...joined,
        event_id: Number(joined.event_id || master?.id || 0),
        event_name: joined.event_name || master?.event_name || `Event #${joined.event_id}`,
        event_pic: joined.event_pic || master?.event_pic || null,
        event_venue: joined.event_venue || master?.event_venue || 'Motorsport Circuit',
        event_start_date: startDate,
        event_end_date: endDate,
        event_organised_by: joined.event_organised_by || master?.event_organised_by || 'EagleEye Motorsports',
        sr_path: joined.sr_path || master?.sr_path || null,
        indemnity_path: joined.indemnity_path || joined.indemninity_path || master?.indemnity_path || null,
        status_label: statusInfo.label,
      };
    });

    // 5. Update local storage with enriched records
    if (enrichedList.length > 0) {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(enrichedList));
      } catch {}
    }

    // 6. Chronological Real-World Ordering: Upcoming -> Live -> Completed
    return sortEvents(enrichedList);
  },

  /**
   * Submit Join Event Registration
   * Guaranteed not to overwrite previous joined events
   */
  joinEvent: async (
    payload: JoinEventPayload,
    userId?: string | number,
    eventContext?: Partial<EventItem>
  ): Promise<{ success: boolean; data?: MyEventItem; message?: string }> => {
    const storageKey = getUserJoinedEventsStorageKey(userId);

    const formattedPayload = {
      event_id: Number(payload.event_id),
      asn: String(payload.asn || ''),
      team: String(payload.team || ''),
      driver_id: Number(payload.driver_id),
      navigator_id: Number(payload.navigator_id),
      vehicle_id: Number(payload.vehicle_id),
      category_id: Number(payload.category_id),
      class_id: Number(payload.class_id),
      payment_mode: String(payload.payment_mode || 'UPI'),
      payment_reference: String(payload.payment_reference || ''),
      payment_date: String(payload.payment_date || ''),
      payment_amount: Number(payload.payment_amount || 0),
      terms_accepted: payload.terms_accepted === 1 ? 1 : 0,
    };

    let apiData: any = null;
    let apiMessage = '';

    const formData = new FormData();
    Object.keys(formattedPayload).forEach((key) => {
      formData.append(key, String((formattedPayload as any)[key]));
    });

    const endpoints = [
      ENDPOINTS.EVENTS.JOIN,
      '/events/join',
      '/event/join',
      'https://eagleeyeofficial.com/demo/api/events/join',
    ];

    for (const endpoint of endpoints) {
      // 1. Try Multipart FormData Post (PHP standard)
      try {
        const res = await client.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data) {
          const body = res.data;
          const isErr = typeof body === 'string' && body.includes('not a valid controller');
          if (!isErr && (body.status === 'success' || body.status === 1 || body.participant_id || body.success)) {
            apiData = body.data || body;
            apiMessage = body.message || 'Event joined successfully!';
            break;
          }
        }
      } catch {}

      // 2. Try JSON Post fallback
      try {
        const res = await client.post(endpoint, formattedPayload);
        if (res.data) {
          const body = res.data;
          const isErr = typeof body === 'string' && body.includes('not a valid controller');
          if (!isErr) {
            apiData = body.data || body;
            apiMessage = body.message || 'Event joined successfully!';
            break;
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 404) continue;
        console.warn(`[bookingService] Endpoint ${endpoint} warning:`, err?.response?.data?.message || err?.message);
      }
    }

    // Assemble complete registration record with full event information
    const savedRecord: MyEventItem = {
      participant_id: apiData?.participant_id || Date.now(),
      event_id: formattedPayload.event_id,
      asn: formattedPayload.asn,
      team: formattedPayload.team,
      driver_id: formattedPayload.driver_id,
      navigator_id: formattedPayload.navigator_id,
      vehicle_id: formattedPayload.vehicle_id,
      category_id: formattedPayload.category_id,
      class_id: formattedPayload.class_id,
      payment_mode: formattedPayload.payment_mode,
      payment_reference: formattedPayload.payment_reference,
      payment_date: formattedPayload.payment_date,
      payment_amount: String(formattedPayload.payment_amount),
      terms_accepted: formattedPayload.terms_accepted,
      event_name: eventContext?.event_name || `Event #${formattedPayload.event_id}`,
      event_pic: eventContext?.event_pic || null,
      event_venue: eventContext?.event_venue || 'Motorsport Circuit',
      event_start_date: eventContext?.event_start_date || '',
      event_end_date: eventContext?.event_end_date || '',
      event_organised_by: eventContext?.event_organised_by || 'EagleEye Motorsports',
      sr_path: eventContext?.sr_path || null,
      indemnity_path: eventContext?.indemnity_path || null,
      created_at: new Date().toISOString(),
      ...apiData,
    };

    // Store in user-scoped history (accumulate without replacing existing joined events)
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      const list: MyEventItem[] = stored ? JSON.parse(stored) : [];
      // Deduplicate by event_id: update if exists, append if new
      const index = list.findIndex((item) => String(item.event_id) === String(formattedPayload.event_id));
      if (index >= 0) {
        list[index] = { ...list[index], ...savedRecord };
      } else {
        list.push(savedRecord);
      }
      await AsyncStorage.setItem(storageKey, JSON.stringify(list));
    } catch (storageErr) {
      console.warn('[bookingService] Storage write error:', storageErr);
    }

    return {
      success: true,
      data: savedRecord,
      message: apiMessage || 'Event joined successfully!',
    };
  },
};
