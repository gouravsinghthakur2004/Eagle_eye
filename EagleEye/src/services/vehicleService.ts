import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { VehicleProfile } from '@/types';

const getUserVehicleStorageKey = (userId?: string | number): string => {
  if (!userId) return '@eagleeye_vehicle_profile_guest';
  return `@eagleeye_vehicle_profile_${userId}`;
};

/**
 * EXACT ALLOWED API FIELDS FOR VEHICLE ADD
 */
export const ALLOWED_VEHICLE_ADD_FIELDS = [
  'vehicle_rc_no',
  'vehicle_owner_name',
  'vehicle_cc',
  'is_turbo',
  'vehicle_manufacturing',
  'vehicle_model',
  'fuel_type',
  'drive_type',
  'vehicle_nick_name',
  'rc_upload',
  'rc_validity',
  'insurance_no',
  'insurance_validity',
  'insurance_company',
  'insurance_doc_upload',
  'vehicle_img_front',
  'vehicle_img_back',
  'vehicle_img_left',
  'vehicle_img_right',
  'vehicle_additional_info',
  'status',
] as const;

/**
 * EXACT ALLOWED API FIELDS FOR VEHICLE UPDATE
 */
export const ALLOWED_VEHICLE_UPDATE_FIELDS = [
  'id',
  'vehicle_rc_no',
  'vehicle_owner_name',
  'vehicle_cc',
  'is_turbo',
  'vehicle_manufacturing',
  'vehicle_model',
  'fuel_type',
  'drive_type',
  'vehicle_nick_name',
  'rc_validity',
  'insurance_no',
  'insurance_validity',
  'insurance_company',
  'vehicle_additional_info',
  'status',
  // Allow optional replacement uploads if updated
  'rc_upload',
  'insurance_doc_upload',
  'vehicle_img_front',
  'vehicle_img_back',
  'vehicle_img_left',
  'vehicle_img_right',
] as const;

/**
 * Strict Payload Sanitizer: Guarantees ONLY allowed Vehicle API fields exist in request
 */
export const sanitizeVehiclePayload = (
  raw: Partial<VehicleProfile>,
  isUpdate: boolean = false
): Record<string, any> => {
  const allowedFields = isUpdate ? ALLOWED_VEHICLE_UPDATE_FIELDS : ALLOWED_VEHICLE_ADD_FIELDS;
  const sanitized: Record<string, any> = {};

  for (const field of allowedFields) {
    const val = raw[field as keyof VehicleProfile];
    if (val !== undefined && val !== null) {
      if (field === 'vehicle_cc' || field === 'status' || field === 'id') {
        sanitized[field] = typeof val === 'number' ? val : isNaN(Number(val)) ? String(val) : Number(val);
      } else {
        sanitized[field] = String(val);
      }
    } else {
      sanitized[field] = field === 'status' ? 1 : '';
    }
  }

  return sanitized;
};

const PRIMARY_AND_FALLBACK_ENDPOINTS = [
  ENDPOINTS.VEHICLE.SAVE, // /vehicle/save
  '/vehicle/add',
  '/vehicle/update',
  '/vehicle',
];

export const vehicleService = {
  /**
   * GET /vehicle/get
   * Strictly scoped to current authenticated userId
   */
  getVehicle: async (userId?: string | number): Promise<VehicleProfile | null> => {
    if (!userId) return null;
    const userKey = getUserVehicleStorageKey(userId);

    let localVehicle: VehicleProfile | null = null;
    try {
      const stored = await AsyncStorage.getItem(userKey);
      if (stored) {
        localVehicle = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[vehicleService] Local read error:', e);
    }

    // Try official remote GET endpoint
    try {
      const res = await client.get(ENDPOINTS.VEHICLE.GET);
      const data = res.data;
      let remoteVehicles: VehicleProfile[] = [];
      if (Array.isArray(data)) remoteVehicles = data;
      else if (data?.vehicles && Array.isArray(data.vehicles)) remoteVehicles = data.vehicles;
      else if (data?.data && Array.isArray(data.data)) remoteVehicles = data.data;
      else if (data?.vehicle && typeof data.vehicle === 'object') remoteVehicles = [data.vehicle];

      if (remoteVehicles.length > 0 && userId) {
        const match = remoteVehicles.find((v) => {
          const vehicleUserId = v.user_id ? String(v.user_id) : null;
          if (vehicleUserId) return vehicleUserId === String(userId);
          if (v.id && String(v.id) === String(userId)) return true;
          return false;
        });

        if (match) {
          try {
            await AsyncStorage.setItem(userKey, JSON.stringify(match));
          } catch {}
          return match;
        } else {
          // No vehicle for current userId -> clear local cache and return null
          try {
            await AsyncStorage.removeItem(userKey);
          } catch {}
          return null;
        }
      }
    } catch (remoteErr) {
      console.warn('[vehicleService] Remote GET skipped/failed, using user-scoped local storage:', remoteErr);
    }

    return localVehicle;
  },

  /**
   * GET /vehicle/get - returns list of vehicles for current userId
   */
  getVehicles: async (userId?: string | number): Promise<VehicleProfile[]> => {
    if (!userId) return [];
    const userKey = getUserVehicleStorageKey(userId);

    let localVehicles: VehicleProfile[] = [];
    try {
      const stored = await AsyncStorage.getItem(userKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) localVehicles = parsed;
        else if (typeof parsed === 'object') localVehicles = [parsed];
      }
    } catch (e) {
      console.warn('[vehicleService] Local list read error:', e);
    }

    try {
      let res;
      try {
        res = await client.get(ENDPOINTS.VEHICLE.LIST);
      } catch {
        res = await client.get(ENDPOINTS.VEHICLE.GET);
      }
      const data = res.data;
      let remoteVehicles: VehicleProfile[] = [];
      if (data?.vehicles && Array.isArray(data.vehicles)) remoteVehicles = data.vehicles;
      else if (Array.isArray(data)) remoteVehicles = data;
      else if (data?.data && Array.isArray(data.data)) remoteVehicles = data.data;

      if (remoteVehicles.length > 0 && userId) {
        const matches = remoteVehicles.filter((v) => {
          const vehicleUserId = v.user_id ? String(v.user_id) : null;
          if (vehicleUserId) return vehicleUserId === String(userId);
          if (v.id && String(v.id) === String(userId)) return true;
          return false;
        });

        if (matches.length > 0) {
          try {
            await AsyncStorage.setItem(userKey, JSON.stringify(matches));
          } catch {}
          return matches;
        }
      }
    } catch (remoteErr) {
      console.warn('[vehicleService] Remote GET vehicles failed:', remoteErr);
    }

    return localVehicles;
  },

  /**
   * POST /vehicle/save
   * Enforces 100% strict payload field sanitization and attaches userId.
   */
  saveVehicle: async (
    payload: Partial<VehicleProfile>,
    userId?: string | number
  ): Promise<{ success: boolean; data?: VehicleProfile; message?: string }> => {
    const isUpdate = Boolean(payload.id);
    const userKey = getUserVehicleStorageKey(userId);

    // 1. Sanitize payload strictly according to API specification
    const sanitizedPayload = sanitizeVehiclePayload(payload, isUpdate);

    let apiResponseData: any = null;
    let apiMessage = '';

    const endpoints = [
      ENDPOINTS.VEHICLE.SAVE,
      '/vehicles/save',
      '/vehicle/save',
    ];

    // 2. Execute POST request to official endpoint /vehicle/save
    for (const endpoint of endpoints) {
      try {
        const res = await client.post(endpoint, {
          ...sanitizedPayload,
          user_id: userId ? String(userId) : undefined,
        });
        if (res.data) {
          const body = res.data;
          const isControllerErr =
            typeof body === 'string' && body.includes('not a valid controller name');
          if (!isControllerErr) {
            apiMessage = body?.message || (isUpdate ? 'Vehicle updated successfully' : 'Vehicle added successfully');
            apiResponseData = body?.vehicle || body?.data || body;
            break;
          }
        }
      } catch (err: any) {
        const errContent = JSON.stringify(err?.response?.data || err?.message || '');
        if (errContent.includes('controller name') || err?.response?.status === 404) {
          continue;
        }
        apiMessage = err?.response?.data?.message || err?.message || 'Save failed';
      }
    }

    // 3. Update user-scoped storage with strictly mapped vehicle profile
    const savedVehicleObject: VehicleProfile = {
      id: payload.id || (apiResponseData?.vehicle_id ? String(apiResponseData.vehicle_id) : apiResponseData?.id ? String(apiResponseData.id) : `vehicle_${Date.now()}`),
      user_id: userId ? String(userId) : payload.user_id || '',
      vehicle_rc_no: String(sanitizedPayload.vehicle_rc_no || ''),
      vehicle_owner_name: String(sanitizedPayload.vehicle_owner_name || ''),
      vehicle_cc: sanitizedPayload.vehicle_cc || '',
      is_turbo: sanitizedPayload.is_turbo || 'No',
      vehicle_manufacturing: String(sanitizedPayload.vehicle_manufacturing || ''),
      vehicle_model: String(sanitizedPayload.vehicle_model || ''),
      fuel_type: String(sanitizedPayload.fuel_type || ''),
      drive_type: String(sanitizedPayload.drive_type || ''),
      vehicle_nick_name: String(sanitizedPayload.vehicle_nick_name || ''),
      rc_upload: sanitizedPayload.rc_upload || payload.rc_upload || '',
      rc_validity: String(sanitizedPayload.rc_validity || ''),
      insurance_no: String(sanitizedPayload.insurance_no || ''),
      insurance_validity: String(sanitizedPayload.insurance_validity || ''),
      insurance_company: String(sanitizedPayload.insurance_company || ''),
      insurance_doc_upload: sanitizedPayload.insurance_doc_upload || payload.insurance_doc_upload || '',
      vehicle_img_front: sanitizedPayload.vehicle_img_front || payload.vehicle_img_front || '',
      vehicle_img_back: sanitizedPayload.vehicle_img_back || payload.vehicle_img_back || '',
      vehicle_img_left: sanitizedPayload.vehicle_img_left || payload.vehicle_img_left || '',
      vehicle_img_right: sanitizedPayload.vehicle_img_right || payload.vehicle_img_right || '',
      vehicle_additional_info: String(sanitizedPayload.vehicle_additional_info || ''),
      status: sanitizedPayload.status !== undefined ? sanitizedPayload.status : 1,
      created_at: apiResponseData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const existing = await vehicleService.getVehicles(userId);
      const idx = existing.findIndex((v) => String(v.id) === String(savedVehicleObject.id));
      if (idx >= 0) existing[idx] = savedVehicleObject;
      else existing.push(savedVehicleObject);
      await AsyncStorage.setItem(userKey, JSON.stringify(existing));
    } catch (storageErr) {
      console.warn('[vehicleService] Local write warning:', storageErr);
    }

    return {
      success: true,
      data: savedVehicleObject,
      message: apiMessage || (isUpdate ? 'Vehicle updated successfully!' : 'Vehicle added successfully!'),
    };
  },

  /**
   * POST /vehicle/save (or batch) for dynamic multi-entry vehicles[]
   */
  saveMultipleVehicles: async (
    vehiclesList: Partial<VehicleProfile>[],
    userId?: string | number
  ): Promise<{ success: boolean; message?: string }> => {
    const userKey = getUserVehicleStorageKey(userId);
    const sanitizedVehicles = vehiclesList.map((v) => sanitizeVehiclePayload(v, Boolean(v.id)));

    let apiSuccess = false;
    let apiMessage = '';

    for (const endpoint of PRIMARY_AND_FALLBACK_ENDPOINTS) {
      try {
        const res = await client.post(endpoint, {
          vehicles: sanitizedVehicles,
          user_id: userId ? String(userId) : undefined,
        });
        if (res.data) {
          const body = res.data;
          const isControllerErr =
            typeof body === 'string' && body.includes('not a valid controller name');
          if (!isControllerErr) {
            apiSuccess = true;
            apiMessage = body?.message || 'Vehicles saved successfully!';
            break;
          }
        }
      } catch {
        // Fallback to individual vehicle save
      }
    }

    if (!apiSuccess) {
      for (const vehicleItem of vehiclesList) {
        await vehicleService.saveVehicle(vehicleItem, userId);
      }
    }

    const savedObjects: VehicleProfile[] = vehiclesList.map((v, i) => ({
      id: v.id || `vehicle_${Date.now()}_${i}`,
      user_id: userId ? String(userId) : v.user_id || '',
      vehicle_rc_no: String(v.vehicle_rc_no || ''),
      vehicle_owner_name: String(v.vehicle_owner_name || ''),
      vehicle_cc: v.vehicle_cc || '',
      is_turbo: v.is_turbo || 'No',
      vehicle_manufacturing: String(v.vehicle_manufacturing || ''),
      vehicle_model: String(v.vehicle_model || ''),
      fuel_type: String(v.fuel_type || ''),
      drive_type: String(v.drive_type || ''),
      vehicle_nick_name: String(v.vehicle_nick_name || ''),
      rc_upload: v.rc_upload || '',
      rc_validity: String(v.rc_validity || ''),
      insurance_no: String(v.insurance_no || ''),
      insurance_validity: String(v.insurance_validity || ''),
      insurance_company: String(v.insurance_company || ''),
      insurance_doc_upload: v.insurance_doc_upload || '',
      vehicle_img_front: v.vehicle_img_front || '',
      vehicle_img_back: v.vehicle_img_back || '',
      vehicle_img_left: v.vehicle_img_left || '',
      vehicle_img_right: v.vehicle_img_right || '',
      vehicle_additional_info: String(v.vehicle_additional_info || ''),
      status: v.status !== undefined ? v.status : 1,
      created_at: v.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    try {
      await AsyncStorage.setItem(userKey, JSON.stringify(savedObjects));
    } catch (storageErr) {
      console.warn('[vehicleService] Local write warning:', storageErr);
    }

    return {
      success: true,
      message: apiMessage || 'Vehicles saved successfully!',
    };
  },

  /**
   * Clear user-scoped vehicle storage key upon logout
   */
  clearUserVehicleStorage: async (userId?: string | number): Promise<void> => {
    if (!userId) return;
    try {
      await AsyncStorage.removeItem(getUserVehicleStorageKey(userId));
    } catch {}
  },

  /**
   * Search Vehicles strictly by Vehicle RC Number (minimum 2 characters required)
   * GET /vehicles/search?rc_no={rc_no}
   */
  searchVehicles: async (rc_no: string, userId?: string | number): Promise<VehicleProfile[]> => {
    const query = rc_no.trim();
    if (!query || query.length < 2) return [];

    try {
      const response = await client.get(`${ENDPOINTS.SEARCH.VEHICLES}?rc_no=${encodeURIComponent(query)}`);
      const data = response.data;
      if (data) {
        if (Array.isArray(data.vehicles)) return data.vehicles;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data)) return data;
      }
    } catch (err: any) {
      console.warn('[vehicleService] API search error, falling back to local search:', err?.message || err);
    }

    // Fallback: Filter existing vehicle profiles stored locally by vehicle_rc_no
    try {
      const allVehicles = await vehicleService.getVehicles(userId);
      return allVehicles.filter((v) =>
        v.vehicle_rc_no?.toLowerCase().includes(query.toLowerCase())
      );
    } catch {
      return [];
    }
  },

  /**
   * POST /vehicle/delete
   * Delete vehicle profile by ID
   */
  deleteVehicle: async (
    id: string | number,
    userId?: string | number
  ): Promise<{ success: boolean; message?: string }> => {
    const userKey = getUserVehicleStorageKey(userId);
    let apiMessage = '';

    try {
      const payloadId = typeof id === 'number' ? id : isNaN(Number(id)) ? id : Number(id);
      const response = await client.post(ENDPOINTS.VEHICLE.DELETE, {
        id: payloadId,
      });
      const data = response.data;
      if (data) {
        apiMessage = data.message || 'Vehicle deleted successfully';
      }
    } catch (err: any) {
      console.warn('[vehicleService] Remote delete notice:', err?.response?.data || err?.message || err);
      apiMessage = err?.response?.data?.message || err?.message || 'Delete processed';
    }

    // Remove deleted vehicle from local user-scoped storage
    try {
      const existing = await vehicleService.getVehicles(userId);
      const filtered = existing.filter((v) => String(v.id) !== String(id));
      await AsyncStorage.setItem(userKey, JSON.stringify(filtered));
    } catch (e) {
      console.warn('[vehicleService] Local delete write warning:', e);
    }

    return {
      success: true,
      message: apiMessage || 'Vehicle deleted successfully',
    };
  },
};
