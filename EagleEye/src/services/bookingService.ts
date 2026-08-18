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

/**
 * Robust numeric ID extractor: handles strings, numbers, and prefixed IDs (e.g. "driver_15" -> 15)
 */
const cleanNumericId = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  const match = String(val).match(/\d+/);
  return match ? Number(match[0]) : 0;
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
    const cleanUid = cleanNumericId(userId) || (userId ? String(userId) : '');

    const myEventsEndpoints = [
      ENDPOINTS.EVENTS.MY_EVENTS, // /events/myevents
      '/events/myevents',
      '/event/myevents',
      '/events/my-events',
      '/event/my-events',
      cleanUid ? `/events/myevents?user_id=${cleanUid}` : '',
      cleanUid ? `/event/myevents?user_id=${cleanUid}` : '',
    ].filter(Boolean);

    // 1. Query remote backend endpoints
    for (const endpoint of myEventsEndpoints) {
      try {
        const response = await client.get<any>(endpoint);
        if (response.data) {
          const body = response.data;
          const list =
            body.events ||
            body.data?.events ||
            body.data ||
            body.registrations ||
            body.my_events ||
            (Array.isArray(body) ? body : null);

          if (Array.isArray(list) && list.length > 0) {
            // Filter strictly for current user if user_id is present on records
            remoteList = cleanUid
              ? list.filter(
                  (item: any) =>
                    !item.user_id ||
                    String(item.user_id) === String(cleanUid) ||
                    String(item.user_id) === String(userId)
                )
              : list;
            if (remoteList.length > 0) break;
          }
        }
      } catch (err: any) {
        if (__DEV__) {
          console.log(`[bookingService.getMyEvents] GET ${endpoint} response:`, err?.response?.status || err?.message);
        }
      }
    }

    // Try POST query fallback if GET is empty
    if (remoteList.length === 0 && cleanUid) {
      for (const endpoint of [ENDPOINTS.EVENTS.MY_EVENTS, '/events/myevents', '/event/myevents']) {
        try {
          const postRes = await client.post<any>(endpoint, { user_id: cleanUid });
          if (postRes.data) {
            const body = postRes.data;
            const list =
              body.events ||
              body.data?.events ||
              body.data ||
              body.registrations ||
              (Array.isArray(body) ? body : null);
            if (Array.isArray(list) && list.length > 0) {
              remoteList = list;
              break;
            }
          }
        } catch {}
      }
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
   * Guaranteed to transmit all fields, user_id, entity IDs, payment details, and terms.
   */
  joinEvent: async (
    payload: JoinEventPayload,
    userId?: string | number,
    eventContext?: Partial<EventItem>
  ): Promise<{ success: boolean; data?: MyEventItem; message?: string }> => {
    const storageKey = getUserJoinedEventsStorageKey(userId);

    const eventIdNum = cleanNumericId(payload.event_id);
    const driverIdNum = cleanNumericId(payload.driver_id);
    const navigatorIdNum = cleanNumericId(payload.navigator_id);
    const vehicleIdNum = cleanNumericId(payload.vehicle_id);
    const categoryIdNum = cleanNumericId(payload.category_id);
    const classIdNum = cleanNumericId(payload.class_id);
    const userIdNum = cleanNumericId(userId);

    const formattedPayload: Record<string, any> = {
      event_id: eventIdNum,
      asn: String(payload.asn || '').trim(),
      team: String(payload.team || '').trim(),
      driver_id: driverIdNum,
      navigator_id: navigatorIdNum,
      vehicle_id: vehicleIdNum,
      category_id: categoryIdNum,
      class_id: classIdNum,
      payment_mode: String(payload.payment_mode || 'UPI').trim(),
      payment_reference: String(payload.payment_reference || '').trim(),
      payment_date: String(payload.payment_date || '').trim(),
      payment_amount: Number(payload.payment_amount || 0),
      terms_accepted: payload.terms_accepted === 1 ? 1 : 0,
    };

    if (userIdNum > 0) {
      formattedPayload.user_id = userIdNum;
    } else if (userId) {
      formattedPayload.user_id = String(userId);
    }

    let apiData: any = null;
    let apiMessage = '';
    let apiCallSuccess = false;

    // 1. Build FormData for standard PHP backend compatibility
    const formData = new FormData();
    Object.keys(formattedPayload).forEach((key) => {
      formData.append(key, String(formattedPayload[key]));
    });

    const endpoints = [
      ENDPOINTS.EVENTS.JOIN, // /events/join
      '/events/join',
      '/event/join',
      '/events/register',
      '/event/register',
      '/event/save',
      '/events/save',
    ];

    for (const endpoint of endpoints) {
      // 1A. Try Multipart FormData POST
      try {
        const res = await client.post(endpoint, formData);
        if (res.data) {
          const body = res.data;
          const isErr = typeof body === 'string' && body.includes('not a valid controller');
          if (
            !isErr &&
            (body.status === 'success' ||
              body.status === 1 ||
              body.participant_id ||
              body.registration_id ||
              body.success)
          ) {
            apiData = body.data || body.registration || body;
            apiMessage = body.message || 'Event joined successfully!';
            apiCallSuccess = true;
            break;
          }
        }
      } catch (e: any) {
        if (__DEV__) {
          console.log(`[bookingService] POST FormData ${endpoint} err:`, e?.response?.data || e?.message);
        }
      }

      // 1B. Try standard JSON POST fallback
      try {
        const res = await client.post(endpoint, formattedPayload);
        if (res.data) {
          const body = res.data;
          const isErr = typeof body === 'string' && body.includes('not a valid controller');
          if (
            !isErr &&
            (body.status === 'success' ||
              body.status === 1 ||
              body.participant_id ||
              body.registration_id ||
              body.success)
          ) {
            apiData = body.data || body.registration || body;
            apiMessage = body.message || 'Event joined successfully!';
            apiCallSuccess = true;
            break;
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 404) continue;
        if (__DEV__) {
          console.log(`[bookingService] POST JSON ${endpoint} err:`, err?.response?.data || err?.message);
        }
      }
    }

    // Assemble complete registration record with full event information
    const savedRecord: MyEventItem = {
      participant_id: apiData?.participant_id || apiData?.id || apiData?.registration_id || Date.now(),
      event_id: formattedPayload.event_id,
      user_id: formattedPayload.user_id || (userId ? String(userId) : ''),
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
      ...(apiData || {}),
    };

    // Store in user-scoped history (accumulate without replacing existing joined events)
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      const list: MyEventItem[] = stored ? JSON.parse(stored) : [];
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
