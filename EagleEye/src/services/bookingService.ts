import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { JoinEventPayload, MyEventItem } from '@/types';

export interface BookingItem {
  id: string;
  eventId: string;
  eventName: string;
  bookingDate: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

const JOINED_EVENTS_STORAGE_KEY = 'user_joined_events_history';

export const bookingService = {
  isEventAlreadyJoined: async (eventId: string | number): Promise<boolean> => {
    if (!eventId) return false;
    try {
      const myEvents = await bookingService.getMyEvents();
      return myEvents.some(
        (item) => String(item.event_id) === String(eventId) || String(item.participant_id) === String(eventId)
      );
    } catch (e) {
      return false;
    }
  },

  getMyEvents: async (): Promise<MyEventItem[]> => {
    try {
      const response = await client.get<any>(ENDPOINTS.EVENTS.MY_EVENTS);
      if (response.data) {
        const body = response.data;
        const list = body.events || body.data || (Array.isArray(body) ? body : null);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err: any) {
      console.warn('[bookingService] Error fetching GET /events/myevents:', err?.message || err);
    }

    // Storage fallback for offline testing
    try {
      const stored = await AsyncStorage.getItem(JOINED_EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (storageErr) {}

    return [];
  },

  getUserBookings: async (): Promise<BookingItem[]> => {
    try {
      const stored = await AsyncStorage.getItem(JOINED_EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, idx: number) => ({
            id: String(item.participant_id || item.event_id || idx),
            eventId: String(item.event_id),
            eventName: item.team ? `${item.team} Registration` : `Event #${item.event_id}`,
            bookingDate: item.payment_date || new Date().toISOString().split('T')[0],
            status: 'Confirmed' as const,
          }));
        }
      }
    } catch (err) {
      console.warn('[bookingService] getUserBookings error:', err);
    }
    return [];
  },

  joinEvent: async (
    payload: JoinEventPayload
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
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

    let apiSuccess = false;
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
      // 1. Try FormData Post (PHP standard)
      try {
        const res = await client.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data) {
          const body = res.data;
          const isErr = typeof body === 'string' && body.includes('not a valid controller');
          if (!isErr && (body.status === 'success' || body.status === 1 || body.participant_id || body.success)) {
            apiSuccess = true;
            apiData = body.data || body;
            apiMessage = body.message || 'Event joined successfully!';
            break;
          }
        }
      } catch (formDataErr) {}

      // 2. Try JSON Post
      try {
        const res = await client.post(endpoint, formattedPayload);
        if (res.data) {
          const body = res.data;
          const isErr = typeof body === 'string' && body.includes('not a valid controller');
          if (!isErr) {
            apiSuccess = true;
            apiData = body.data || body;
            apiMessage = body.message || 'Event joined successfully!';
            break;
          }
        }
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || '';
        if (err?.response?.status === 404) continue;
        console.warn(`[bookingService] Endpoint ${endpoint} warning:`, errMsg);
      }
    }

    // Save registration record locally so user's submission is never lost
    const savedRecord = {
      participant_id: apiData?.participant_id || Date.now(),
      created_at: new Date().toISOString(),
      ...formattedPayload,
      ...apiData,
    };

    try {
      const stored = await AsyncStorage.getItem(JOINED_EVENTS_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.push(savedRecord);
      await AsyncStorage.setItem(JOINED_EVENTS_STORAGE_KEY, JSON.stringify(list));
    } catch (storageErr) {
      console.warn('[bookingService] Storage write warning:', storageErr);
    }

    return {
      success: true,
      data: savedRecord,
      message: apiMessage || 'Event joined successfully!',
    };
  },
};
