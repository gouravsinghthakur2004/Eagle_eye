import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { driverNavigatorService } from './driverNavigatorService';
import { DriverNavigatorProfile } from '@/types';

export const driverService = {
  /**
   * Search Drivers by Name (minimum 2 characters required)
   * GET /drivers/search?name={name}
   */
  searchDrivers: async (name: string): Promise<DriverNavigatorProfile[]> => {
    const query = name.trim();
    if (!query || query.length < 2) return [];

    try {
      const response = await client.get(`${ENDPOINTS.SEARCH.DRIVERS}?name=${encodeURIComponent(query)}`);
      const data = response.data;
      if (data) {
        if (Array.isArray(data.drivers)) return data.drivers;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data)) return data;
      }
    } catch (err: any) {
      console.warn('[driverService] API search error, falling back to local search:', err?.message || err);
    }

    // Fallback: Filter existing driver profiles stored locally
    try {
      const allDrivers = await driverNavigatorService.getProfiles(undefined, 'driver');
      return allDrivers.filter((d: DriverNavigatorProfile) =>
        d.full_name?.toLowerCase().includes(query.toLowerCase())
      );
    } catch (e) {
      return [];
    }
  },
};
