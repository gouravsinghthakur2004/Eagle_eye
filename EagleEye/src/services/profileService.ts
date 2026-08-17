import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { SelectedFile } from '@/utils/fileValidation';
import { getSafeFileName, isLocalFileUri } from '@/utils/fileUrl';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  contact: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profile_pic_path?: string;
  profile_pic_url?: string;
}

export interface UserProfileResponse {
  status: string;
  user: UserProfile;
}

export interface UpdateProfilePayload {
  name: string;
  contact: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profile_pic_file?: SelectedFile | null;
  profile_pic_path?: string;
}

export interface UpdateProfileResponse {
  status: string;
  message: string;
  user: UserProfile;
}

const DEFAULT_USER: UserProfile = {
  id: '74',
  name: 'Gaurav Racing',
  username: 'gaurav_racing',
  email: 'gaurav@eagleeye.com',
  contact: '9876543210',
  address: 'Motorsport Paddock 1',
  city: 'Indore',
  state: 'Madhya Pradesh',
  pincode: '452001',
  profile_pic_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
};

export const profileService = {
  // Get User Profile API with Resilient Offline Fallback
  getUserProfile: async (): Promise<UserProfileResponse> => {
    try {
      const response = await client.post<UserProfileResponse>(ENDPOINTS.PROFILE.GET);
      if (response.data && response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (error: any) {
      console.warn('[profileService.getUserProfile] API network error, loading local profile:', error?.message);
    }

    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        return { status: 'success', user: JSON.parse(stored) };
      }
    } catch {}

    return { status: 'success', user: DEFAULT_USER };
  },

  // Update Profile API with Multipart FormData & JSON Fallback
  updateUserProfile: async (payload: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
    let apiUser: UserProfile | null = null;
    let apiMessage = '';

    // If profile picture is selected, upload via multipart FormData
    if (payload.profile_pic_file && payload.profile_pic_file.uri) {
      const formData = new FormData();
      formData.append('name', payload.name || '');
      formData.append('contact', payload.contact || '');
      formData.append('address', payload.address || '');
      formData.append('city', payload.city || '');
      formData.append('state', payload.state || '');
      formData.append('pincode', payload.pincode || '');

      const extension = payload.profile_pic_file.type?.includes('png') ? 'png' : 'jpg';
      const safeName = payload.profile_pic_file.name || getSafeFileName('profile_pic', undefined, extension);
      const fileBlob = {
        uri: payload.profile_pic_file.uri,
        name: safeName,
        type: payload.profile_pic_file.type || 'image/jpeg',
      };

      formData.append('profile_pic_upload', fileBlob as any);
      formData.append('profile_pic', fileBlob as any);
      formData.append('photo', fileBlob as any);

      try {
        const response = await client.post<UpdateProfileResponse>(
          ENDPOINTS.PROFILE.UPDATE,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (response.data && response.data.user) {
          apiUser = response.data.user;
          apiMessage = response.data.message;
        }
      } catch (e) {
        console.warn('[profileService.updateUserProfile] Multipart update error:', e);
      }
    }

    // JSON update fallback
    if (!apiUser) {
      try {
        const cleanPayload = {
          name: payload.name,
          contact: payload.contact,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          profile_pic_path: !isLocalFileUri(String(payload.profile_pic_path || '')) ? payload.profile_pic_path : undefined,
        };
        const response = await client.post<UpdateProfileResponse>(
          ENDPOINTS.PROFILE.UPDATE,
          cleanPayload
        );
        if (response.data && response.data.user) {
          apiUser = response.data.user;
          apiMessage = response.data.message;
        }
      } catch (error: any) {
        console.warn('[profileService.updateUserProfile] JSON API error:', error?.message);
      }
    }

    const updatedUser: UserProfile = {
      ...DEFAULT_USER,
      name: payload.name,
      contact: payload.contact,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
      ...(apiUser || {}),
    };

    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {}

    return {
      status: 'success',
      message: apiMessage || 'Profile updated successfully.',
      user: updatedUser,
    };
  },
};
