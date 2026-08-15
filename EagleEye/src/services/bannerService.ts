import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

export interface ApiBannerItem {
  id: string | number;
  title?: string;
  image_url?: string;
  link_url?: string;
  event_id?: string | number;
  created_date?: string;
  is_active?: string | number;
  is_deleted?: string | number;
}

const DEFAULT_FALLBACK_IMAGES = [
  'https://eagleeyeofficial.com/demo/uploads/events/1783706025_f5ce5773cb042e918ef4.jpeg',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
];

const DEFAULT_FALLBACK_BANNERS: ApiBannerItem[] = [
  {
    id: '1',
    title: 'Track & Trail Championship 2026',
    image_url: DEFAULT_FALLBACK_IMAGES[0],
    link_url: 'Indore R9 Stables',
    event_id: '1',
    is_active: '1',
    is_deleted: '0',
  },
  {
    id: '2',
    title: 'Desert Rally Challenge',
    image_url: DEFAULT_FALLBACK_IMAGES[1],
    link_url: 'Jaisalmer Dunes',
    event_id: '2',
    is_active: '1',
    is_deleted: '0',
  },
];

/**
 * Resolves image URL: if relative path, prepends domain; if NA/empty, returns real EagleEye image.
 */
export const resolveBannerImage = (url?: string | null, fallbackUri?: string, index: number = 0): string => {
  if (!url || url.trim() === '' || url.trim().toUpperCase() === 'NA') {
    return fallbackUri && fallbackUri.trim() !== ''
      ? (fallbackUri.startsWith('http') ? fallbackUri : `https://eagleeyeofficial.com/demo/${fallbackUri.replace(/^\//, '')}`)
      : DEFAULT_FALLBACK_IMAGES[index % DEFAULT_FALLBACK_IMAGES.length];
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const cleanPath = url.replace(/^\//, '');
  return `https://eagleeyeofficial.com/demo/${cleanPath}`;
};

export const bannerService = {
  getBanners: async (): Promise<ApiBannerItem[]> => {
    try {
      const response = await client.get<any>(ENDPOINTS.BANNERS);
      if (response.data) {
        const body = response.data;
        const list = body.data || body.banners || (Array.isArray(body) ? body : null);
        if (Array.isArray(list) && list.length > 0) {
          const activeList = list.filter(
            (b) => String(b.is_active) !== '0' && String(b.is_deleted) !== '1'
          );
          if (activeList.length > 0) {
            return activeList;
          }
        }
      }
    } catch (err: any) {
      console.warn('[bannerService] Error fetching banners API:', err?.message || err);
    }
    return DEFAULT_FALLBACK_BANNERS;
  },
};
