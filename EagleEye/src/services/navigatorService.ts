import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { driverNavigatorService } from './driverNavigatorService';
import { DriverNavigatorProfile } from '@/types';

export const navigatorService = {
  /**
   * Search Navigators by Name (minimum 2 characters required)
   * GET /navigators/search?name={name}
   */
  searchNavigators: async (name: string): Promise<DriverNavigatorProfile[]> => {
    const query = name.trim();
    if (!query || query.length < 2) return [];

    try {
      const response = await client.get(`${ENDPOINTS.SEARCH.NAVIGATORS}?name=${encodeURIComponent(query)}`);
      const data = response.data;
      if (data) {
        if (Array.isArray(data.navigators)) return data.navigators;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data)) return data;
      }
    } catch (err: any) {
      console.warn('[navigatorService] API search error, falling back to local search:', err?.message || err);
    }

    // Fallback: Filter existing navigator profiles stored locally
    try {
      const allNavigators = await driverNavigatorService.getProfiles(undefined, 'navigator');
      return allNavigators.filter((n: DriverNavigatorProfile) =>
        n.full_name?.toLowerCase().includes(query.toLowerCase())
      );
    } catch {
      return [];
    }
  },
};
