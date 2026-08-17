import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { EventItem } from '@/types';
import { sortEvents } from '@/utils/eventLifecycle';

export interface FeaturedBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge: string;
}

export interface EventsApiResponse {
  status: string;
  message?: string;
  events: EventItem[];
}

// Generate dynamic ISO date offsets for offline fallback testing
const now = new Date();
const formatIso = (d: Date) => d.toISOString().split('T')[0];

const todayStr = formatIso(now);

const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
const tomorrowStr = formatIso(tomorrow);

const tenDaysAgo = new Date(now);
tenDaysAgo.setDate(now.getDate() - 10);
const tenDaysAgoStr = formatIso(tenDaysAgo);

const fiveDaysAgo = new Date(now);
fiveDaysAgo.setDate(now.getDate() - 5);
const fiveDaysAgoStr = formatIso(fiveDaysAgo);

export const eventService = {
  getFeaturedBanners: async (): Promise<FeaturedBanner[]> => {
    return [
      {
        id: '1',
        title: 'Desert Rally Championship',
        subtitle: 'Ultimate Offroad Challenge 2026',
        image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        badge: 'Featured',
      },
      {
        id: '2',
        title: 'Track & Trail Cup',
        subtitle: 'National Speed Series Stage 3',
        image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
        badge: 'Live Now',
      },
    ];
  },

  getEvents: async (): Promise<EventItem[]> => {
    try {
      const response = await client.get<any>(ENDPOINTS.EVENTS.LIST);
      if (response.data) {
        const body = response.data;
        const list = body.events || body.data || (Array.isArray(body) ? body : null);
        if (Array.isArray(list) && list.length > 0) {
          return sortEvents(list);
        }
      }
    } catch (error: any) {
      console.warn('[eventService] Error fetching events API:', error?.response?.data || error.message);
    }

    // Default Motorsport Events containing Upcoming, Live, and Completed events
    const defaultList: EventItem[] = [
      {
        id: '1',
        event_name: 'Desert Rally Championship 2026',
        event_venue: 'Jaisalmer Dunes, Rajasthan',
        venue_url: 'https://maps.google.com/?q=Jaisalmer+Dunes',
        event_desc: 'Ultimate 4x4 Offroad & Cross Country Rally Championship stage 1.',
        event_start_date: '2026-09-10 09:00:00',
        event_end_date: '2026-09-13 18:00:00',
        event_organised_by: 'EagleEye Motorsports Club',
        event_pic: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        event_organizer_no: '9876543210',
        distance: '350 KM',
        duration: '4 Days',
        sr_path: 'docs/sr_desert_rally_2026.pdf',
        indemnity_path: 'docs/indemnity_desert_rally_2026.pdf',
      },
      {
        id: '2',
        event_name: 'Himalayan Track & Trail Cup 2026',
        event_venue: 'Manali High Altitude Circuit, HP',
        venue_url: 'https://maps.google.com/?q=Manali',
        event_desc: 'High altitude mountain speed trial & time attack stage.',
        event_start_date: '2026-10-05 08:00:00',
        event_end_date: '2026-10-07 17:00:00',
        event_organised_by: 'Himalayan Motor Sports Association',
        event_pic: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
        event_organizer_no: '9123456789',
        distance: '220 KM',
        duration: '3 Days',
        sr_path: 'docs/sr_himalayan_2026.pdf',
        indemnity_path: 'docs/indemnity_himalayan_2026.pdf',
      },
      {
        id: '3',
        event_name: 'National Offroad Sprint Trophy',
        event_venue: 'Indore Dirt Arena, MP',
        venue_url: 'https://maps.google.com/?q=Indore+Dirt+Arena',
        event_desc: 'Short track obstacle sprint & autocross championship.',
        event_start_date: `${todayStr} 08:00:00`,
        event_end_date: `${tomorrowStr} 18:00:00`,
        event_organised_by: 'EagleEye Racing Team',
        event_pic: 'https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=800&q=80',
        event_organizer_no: '9826012345',
        distance: '85 KM',
        duration: '2 Days',
        sr_path: 'docs/sr_sprint_2026.pdf',
        indemnity_path: 'docs/indemnity_sprint_2026.pdf',
      },
      {
        id: '4',
        event_name: 'Monsoon Mud Challenge 2026',
        event_venue: 'Western Ghats Trail, Goa',
        venue_url: 'https://maps.google.com/?q=Goa',
        event_desc: 'Mud terrain navigation & winch trial competition.',
        event_start_date: `${tenDaysAgoStr} 09:00:00`,
        event_end_date: `${fiveDaysAgoStr} 17:00:00`,
        event_organised_by: 'Goa Motorsport Club',
        event_pic: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        event_organizer_no: '9898989898',
        distance: '150 KM',
        duration: '2 Days',
        sr_path: 'docs/sr_monsoon_2026.pdf',
        indemnity_path: 'docs/indemnity_monsoon_2026.pdf',
      },
    ];

    return sortEvents(defaultList);
  },

  getUpcomingEvents: async (): Promise<EventItem[]> => {
    return eventService.getEvents();
  },

  getEventDetails: async (eventId: string): Promise<EventItem | null> => {
    try {
      const response = await client.get<any>(ENDPOINTS.EVENTS.DETAIL(eventId));
      if (response.data && (response.data.event || response.data.data)) {
        return response.data.event || response.data.data;
      }
    } catch {}

    const allEvents = await eventService.getEvents();
    return allEvents.find((e) => String(e.id) === String(eventId)) || allEvents[0] || null;
  },

  getEventCategories: async (eventId: string | number): Promise<any[]> => {
    try {
      const response = await client.get<any>(ENDPOINTS.EVENTS.CATEGORIES(eventId));
      if (response.data) {
        const body = response.data;
        const list = body.categories || body.data?.categories || body.data || (Array.isArray(body) ? body : null);
        if (Array.isArray(list)) {
          return list.filter((c: any) => !c.event_id || String(c.event_id) === String(eventId));
        }
      }
    } catch (err: any) {
      console.warn('[eventService] Category fetch error:', err?.message || err);
    }
    return [];
  },

  getEventClasses: async (categoryId: string | number, eventId: string | number): Promise<any[]> => {
    try {
      const response = await client.get<any>(ENDPOINTS.EVENTS.CLASSES(eventId, categoryId));
      if (response.data) {
        const body = response.data;
        const list = body.classes || body.data?.classes || body.data || (Array.isArray(body) ? body : null);
        if (Array.isArray(list)) {
          return list.filter(
            (c: any) =>
              (!c.category_id || String(c.category_id) === String(categoryId)) &&
              (!c.event_id || String(c.event_id) === String(eventId))
          );
        }
      }
    } catch (err: any) {
      console.warn('[eventService] Class fetch error:', err?.message || err);
    }
    return [];
  },
};
