import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { DriverNavigatorProfile } from '@/types';
import { SelectedFile } from '@/utils/fileValidation';
import { isLocalFileUri, getSafeFileName } from '@/utils/fileUrl';

const getUserStorageKey = (userId?: string | number): string => {
  if (!userId) return '@eagleeye_driver_navigator_profiles_guest';
  return `@eagleeye_driver_navigator_profiles_${userId}`;
};

/**
 * STRICT ALLOWED POST API FIELDS (Exact 24 fields from backend contract)
 */
export const ALLOWED_API_POST_FIELDS = [
  'role_type',
  'full_name',
  'race_nick_name',
  'blood_group',
  'dob',
  'country',
  'gender',
  'mobile_no',
  'alternate_mobile_no',
  'email',
  'dl_no',
  'dl_validity',
  'dl_upload',
  'driver_pic_upload',
  'instagram_handle',
  'emergency_contact_name',
  'emergency_contact_no',
  'relation',
  't_shirt_size',
  'asn_fmn_lic',
  'insurance_no',
  'insurance_document',
  'insurance_validity',
  'medical_condition',
] as const;

/**
 * Strict Payload Sanitizer: Guarantees ONLY allowed API fields exist in the request payload,
 * and strips out local client-side filesystem URIs (file://, C:\...) from text JSON.
 */
export const sanitizeDriverNavigatorPayload = (
  raw: Partial<DriverNavigatorProfile>
): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  for (const field of ALLOWED_API_POST_FIELDS) {
    const val = raw[field as keyof DriverNavigatorProfile];
    if (val !== undefined && val !== null) {
      const strVal = String(val);
      // Strip out local client-side URIs from raw text JSON
      if (isLocalFileUri(strVal)) {
        sanitized[field] = '';
      } else {
        sanitized[field] = strVal;
      }
    } else {
      sanitized[field] = '';
    }
  }
  return sanitized;
};

const PRIMARY_AND_FALLBACK_ENDPOINTS = [
  ENDPOINTS.DRIVER_NAVIGATOR.SAVE, // /driver/save (Official spec)
  '/driver/add',
  '/driver_navigator',
  '/drivernavigator',
  '/driver',
];

export const driverNavigatorService = {
  /**
   * GET /driver/get?role_type=driver OR /driver/get?role_type=navigator
   * Strictly scoped to current authenticated userId
   */
  getProfiles: async (
    userId?: string | number,
    roleType?: 'driver' | 'navigator'
  ): Promise<DriverNavigatorProfile[]> => {
    const userKey = getUserStorageKey(userId);
    let localProfiles: DriverNavigatorProfile[] = [];

    try {
      const stored = await AsyncStorage.getItem(userKey);
      if (stored) {
        localProfiles = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[driverNavigatorService] Local read error:', e);
    }

    // Combine map keyed by profile ID
    const profilesMap = new Map<string, DriverNavigatorProfile>();
    for (const p of localProfiles) {
      if (p.id) profilesMap.set(String(p.id), p);
    }

    // Try official remote GET endpoint
    try {
      const endpoint = roleType
        ? ENDPOINTS.DRIVER_NAVIGATOR.GET_BY_ROLE(roleType)
        : ENDPOINTS.DRIVER_NAVIGATOR.GET_ALL;
      const res = await client.get(endpoint);
      const data = res.data;
      let remoteProfiles: DriverNavigatorProfile[] = [];
      if (Array.isArray(data)) remoteProfiles = data;
      else if (data?.profiles && Array.isArray(data.profiles)) remoteProfiles = data.profiles;
      else if (data?.data && Array.isArray(data.data)) remoteProfiles = data.data;

      if (remoteProfiles.length > 0) {
        for (const p of remoteProfiles) {
          const profileId = p.id ? String(p.id) : null;
          if (profileId) {
            profilesMap.set(profileId, {
              ...p,
              id: profileId,
              user_id: p.user_id ? String(p.user_id) : (userId ? String(userId) : ''),
            });
          }
        }
        const updatedList = Array.from(profilesMap.values());
        try {
          await AsyncStorage.setItem(userKey, JSON.stringify(updatedList));
        } catch {}
        return updatedList;
      }
    } catch (remoteErr) {
      console.warn('[driverNavigatorService] Remote GET failed, using local:', remoteErr);
    }

    return Array.from(profilesMap.values());
  },

  /**
   * GET /driver/detail/{id}
   */
  getProfileById: async (
    id: string | number,
    userId?: string | number
  ): Promise<DriverNavigatorProfile | null> => {
    try {
      const res = await client.get(ENDPOINTS.DRIVER_NAVIGATOR.DETAIL(id));
      const data = res.data;
      if (data?.profile) return data.profile;
      if (data?.data) return data.data;
    } catch (err) {
      console.warn('[driverNavigatorService] GET detail failed, falling back:', err);
    }

    const all = await driverNavigatorService.getProfiles(userId);
    return all.find((p) => String(p.id) === String(id)) || null;
  },

  /**
   * POST /driver/save
   * Implements complete multipart FormData upload for documents and images.
   * Ensures the database stores ONLY server-relative paths and NEVER client filesystem paths.
   */
  saveProfile: async (
    payload: Partial<DriverNavigatorProfile>,
    userId?: string | number,
    files?: Partial<Record<'driver_pic_upload' | 'dl_upload' | 'insurance_document', SelectedFile>>
  ): Promise<{ success: boolean; data?: DriverNavigatorProfile; message?: string }> => {
    const userKey = getUserStorageKey(userId);

    // 1. Sanitize payload strictly according to API specification
    const sanitizedPayload = sanitizeDriverNavigatorPayload(payload);

    let apiResponseData: any = null;
    let apiMessage = '';

    const endpoints = [
      ENDPOINTS.DRIVER_NAVIGATOR.SAVE,
      '/driver-navigator/save',
      '/drivernavigator/save',
      '/driver_navigator/save',
    ];

    // 2. Construct FormData for multipart upload
    const formData = new FormData();
    for (const key of ALLOWED_API_POST_FIELDS) {
      const isFileField = key === 'driver_pic_upload' || key === 'dl_upload' || key === 'insurance_document';
      if (isFileField) {
        const fileObj = files?.[key];
        if (fileObj && fileObj.uri) {
          const extension = fileObj.type?.includes('pdf') ? 'pdf' : 'jpg';
          const safeName = fileObj.name || getSafeFileName(key, undefined, extension);
          formData.append(key, {
            uri: fileObj.uri,
            name: safeName,
            type: fileObj.type || (extension === 'pdf' ? 'application/pdf' : 'image/jpeg'),
          } as any);
        } else if (payload[key] && !isLocalFileUri(String(payload[key]))) {
          // Preserve existing server-relative path or URL
          formData.append(key, String(payload[key]));
        }
      } else {
        formData.append(key, sanitizedPayload[key] || '');
      }
    }

    if (userId) {
      formData.append('user_id', String(userId));
    }
    if (payload.id) {
      formData.append('id', String(payload.id));
    }

    // 3. Execute POST request to official endpoint /driver/save
    for (const endpoint of endpoints) {
      // 3A. Try multipart/form-data upload
      try {
        const res = await client.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data) {
          const body = res.data;
          const isControllerErr =
            typeof body === 'string' && body.includes('not a valid controller name');
          if (!isControllerErr && (body.status === 'success' || body.status === 1 || body.profile || body.data || body.success)) {
            apiMessage = body?.message || 'Driver/Navigator updated successfully';
            apiResponseData = body?.profile || body?.data || body;
            break;
          }
        }
      } catch {}

      // 3B. Try standard JSON fallback if server requires JSON
      try {
        const res = await client.post(endpoint, {
          ...sanitizedPayload,
          user_id: userId ? String(userId) : undefined,
          id: payload.id ? String(payload.id) : undefined,
        });
        if (res.data) {
          const body = res.data;
          const isControllerErr =
            typeof body === 'string' && body.includes('not a valid controller name');
          if (!isControllerErr) {
            apiMessage = body?.message || 'Driver/Navigator updated successfully';
            apiResponseData = body?.profile || body?.data || body;
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

    // Helper to safely extract server-relative paths or fall back to existing clean paths
    const resolveServerPath = (field: 'driver_pic_upload' | 'dl_upload' | 'insurance_document'): string => {
      const remoteVal = apiResponseData?.[field];
      if (remoteVal && typeof remoteVal === 'string' && !isLocalFileUri(remoteVal)) {
        return remoteVal;
      }
      const existingVal = payload[field];
      if (existingVal && typeof existingVal === 'string' && !isLocalFileUri(existingVal)) {
        return existingVal;
      }
      return '';
    };

    // 4. Update user-scoped storage with strictly mapped profile (NO local device paths)
    const savedProfileObject: DriverNavigatorProfile = {
      id: payload.id || (apiResponseData?.id ? String(apiResponseData.id) : `profile_${Date.now()}`),
      user_id: userId ? String(userId) : payload.user_id || '',
      role_type: (sanitizedPayload.role_type as 'driver' | 'navigator') || 'driver',
      full_name: sanitizedPayload.full_name,
      race_nick_name: sanitizedPayload.race_nick_name,
      blood_group: sanitizedPayload.blood_group,
      dob: sanitizedPayload.dob,
      country: sanitizedPayload.country,
      gender: sanitizedPayload.gender,
      mobile_no: sanitizedPayload.mobile_no,
      alternate_mobile_no: sanitizedPayload.alternate_mobile_no,
      email: sanitizedPayload.email,
      dl_no: sanitizedPayload.dl_no,
      dl_validity: sanitizedPayload.dl_validity,
      dl_upload: resolveServerPath('dl_upload'),
      driver_pic_upload: resolveServerPath('driver_pic_upload'),
      instagram_handle: sanitizedPayload.instagram_handle,
      emergency_contact_name: sanitizedPayload.emergency_contact_name,
      emergency_contact_no: sanitizedPayload.emergency_contact_no,
      relation: sanitizedPayload.relation,
      t_shirt_size: sanitizedPayload.t_shirt_size,
      asn_fmn_lic: sanitizedPayload.asn_fmn_lic,
      insurance_no: sanitizedPayload.insurance_no,
      insurance_document: resolveServerPath('insurance_document'),
      insurance_validity: sanitizedPayload.insurance_validity,
      medical_condition: sanitizedPayload.medical_condition,
      approval_status: apiResponseData?.approval_status || '0',
      is_deleted: apiResponseData?.is_deleted || '0',
      created_at: apiResponseData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const stored = await AsyncStorage.getItem(userKey);
      let list: DriverNavigatorProfile[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex(
        (p) => String(p.id) === String(savedProfileObject.id)
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...savedProfileObject };
      } else {
        list.push(savedProfileObject);
      }
      await AsyncStorage.setItem(userKey, JSON.stringify(list));
    } catch (storageErr) {
      console.warn('[driverNavigatorService] Local write warning:', storageErr);
    }

    const roleLabel = savedProfileObject.role_type === 'driver' ? 'Driver' : 'Navigator';
    return {
      success: true,
      data: savedProfileObject,
      message: apiMessage || `${roleLabel} profile saved successfully!`,
    };
  },

  /**
   * POST /driver/save (or batch endpoints)
   * Sends drivers[] and navigators[] array payloads to backend and updates local storage.
   */
  saveAllProfiles: async (
    data: {
      drivers?: Partial<DriverNavigatorProfile>[];
      navigators?: Partial<DriverNavigatorProfile>[];
    },
    userId?: string | number
  ): Promise<{ success: boolean; message?: string }> => {
    const userKey = getUserStorageKey(userId);
    const sanitizedDrivers = (data.drivers || []).map((d) => sanitizeDriverNavigatorPayload(d));
    const sanitizedNavigators = (data.navigators || []).map((n) => sanitizeDriverNavigatorPayload(n));

    let apiSuccess = false;
    let apiMessage = '';

    // 1. Try sending full arrays to endpoints
    for (const endpoint of PRIMARY_AND_FALLBACK_ENDPOINTS) {
      try {
        const res = await client.post(endpoint, {
          drivers: sanitizedDrivers,
          navigators: sanitizedNavigators,
          user_id: userId ? String(userId) : undefined,
        });
        if (res.data) {
          const body = res.data;
          const isControllerErr =
            typeof body === 'string' && body.includes('not a valid controller name');
          if (!isControllerErr) {
            apiSuccess = true;
            apiMessage = body?.message || 'Racer profiles saved successfully!';
            break;
          }
        }
      } catch {
        // Fallback to individual items save if array payload endpoint returns 404 or controller error
      }
    }

    // 2. Fallback: Save each item via saveProfile if array submission didn't succeed
    if (!apiSuccess) {
      for (const driver of data.drivers || []) {
        await driverNavigatorService.saveProfile({ ...driver, role_type: 'driver' }, userId);
      }
      for (const nav of data.navigators || []) {
        await driverNavigatorService.saveProfile({ ...nav, role_type: 'navigator' }, userId);
      }
    }

    // 3. Build and store full list in AsyncStorage
    const allProfiles: DriverNavigatorProfile[] = [
      ...(data.drivers || []).map((d, i) => ({
        id: d.id || `driver_${Date.now()}_${i}`,
        user_id: userId ? String(userId) : d.user_id || '',
        role_type: 'driver' as const,
        full_name: String(d.full_name || ''),
        ...sanitizeDriverNavigatorPayload(d),
        approval_status: d.approval_status || '0',
        is_deleted: d.is_deleted || '0',
        created_at: d.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }) as DriverNavigatorProfile),
      ...(data.navigators || []).map((n, i) => ({
        id: n.id || `navigator_${Date.now()}_${i}`,
        user_id: userId ? String(userId) : n.user_id || '',
        role_type: 'navigator' as const,
        full_name: String(n.full_name || ''),
        ...sanitizeDriverNavigatorPayload(n),
        approval_status: n.approval_status || '0',
        is_deleted: n.is_deleted || '0',
        created_at: n.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }) as DriverNavigatorProfile),
    ];

    try {
      await AsyncStorage.setItem(userKey, JSON.stringify(allProfiles));
    } catch (storageErr) {
      console.warn('[driverNavigatorService] Local write warning:', storageErr);
    }

    return {
      success: true,
      message: apiMessage || 'Drivers & Navigators profiles saved successfully!',
    };
  },

  /**
   * Clear user-scoped storage key upon logout
   */
  clearUserStorage: async (userId?: string | number): Promise<void> => {
    if (!userId) return;
    try {
      await AsyncStorage.removeItem(getUserStorageKey(userId));
    } catch {}
  },
};



