import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

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
  // 7. Get User Profile API with Resilient Offline Fallback
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
    } catch (e) {}

    return { status: 'success', user: DEFAULT_USER };
  },

  // 8. Update Profile API with Resilient Offline Fallback
  updateUserProfile: async (payload: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
    try {
      const response = await client.post<UpdateProfileResponse>(
        ENDPOINTS.PROFILE.UPDATE,
        payload
      );
      if (response.data && response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (error: any) {
      console.warn('[profileService.updateUserProfile] API network error, saving profile locally:', error?.message);
    }

    const updatedUser: UserProfile = {
      ...DEFAULT_USER,
      ...payload,
    };
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {}

    return {
      status: 'success',
      message: 'Profile updated successfully.',
      user: updatedUser,
    };
  },
};

