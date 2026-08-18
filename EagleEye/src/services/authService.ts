import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { SelectedFile } from '@/utils/fileValidation';
import { getSafeFileName } from '@/utils/fileUrl';

export interface LoginResponse {
  status: string;
  message: string;
  token: string;
  data: {
    id: string;
    username: string;
    email: string;
    profile_pic_path?: string;
    profile_pic_url?: string;
    name?: string;
    contact?: string;
  };
}

export interface GenericApiResponse {
  status: string;
  message: string;
  otp?: number;
  data?: any;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  contact: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profile_pic_file?: SelectedFile | null;
}

export interface RegisterResponse {
  status: string;
  name?: string;
  message: string;
  otp?: number;
  profile_pic_url?: string;
  profile_pic_path?: string;
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export const AuthService = {
  /**
   * 1. Login API
   * Transmits raw credentials via JSON without altering password casing or whitespace.
   */
  login: async (username: string, password?: string): Promise<LoginResponse> => {
    const trimmedUsername = (username || '').trim();
    const rawPassword = password || '';

    const response = await client.post<LoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      {
        username: trimmedUsername,
        password: rawPassword,
      }
    );

    const result = response.data;

    // Check backend status error in 200 OK responses
    if (result && (result.status === 'error' || (result as any).status === 0)) {
      throw new Error(result.message || 'Invalid username/email or password.');
    }

    if (!result || !result.token) {
      throw new Error(result?.message || 'Login failed. No authentication token received.');
    }

    // Securely persist token and user session data in centralized storage
    await AsyncStorage.setItem('authToken', result.token);
    if (result.data) {
      await AsyncStorage.setItem('user', JSON.stringify(result.data));
    }

    return result;
  },

  /**
   * 2. Request OTP API (For Forgot Password)
   */
  requestOtp: async (email: string): Promise<GenericApiResponse> => {
    const trimmedEmail = (email || '').trim();

    const response = await client.post<GenericApiResponse>(
      ENDPOINTS.AUTH.REQUEST_OTP,
      { email: trimmedEmail }
    );

    const result = response.data;
    if (result && (result.status === 'error' || (result as any).status === 0)) {
      throw new Error(result.message || 'Email not registered with us.');
    }

    return result;
  },

  /**
   * 3. Verify OTP API (For Forgot Password)
   */
  verifyOtp: async (email: string, otp: string): Promise<GenericApiResponse> => {
    const trimmedEmail = (email || '').trim();
    const cleanOtp = String(otp || '').trim();

    const response = await client.post<GenericApiResponse>(
      ENDPOINTS.AUTH.VERIFY_OTP,
      { email: trimmedEmail, otp: cleanOtp }
    );

    const result = response.data;
    if (result && (result.status === 'error' || (result as any).status === 0)) {
      throw new Error(result.message || 'Invalid or expired OTP code.');
    }

    return result;
  },

  /**
   * 4. Register / Signup API
   * Strictly preserves password integrity and supports optional profile photo multipart upload.
   */
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const trimmedName = (payload.name || '').trim();
    const trimmedUsername = (payload.username || '').trim();
    const trimmedEmail = (payload.email || '').trim();
    const rawPassword = payload.password; // Do not alter password
    const trimmedContact = (payload.contact || '').trim();
    const trimmedAddress = (payload.address || '').trim();
    const trimmedCity = (payload.city || '').trim();
    const trimmedState = (payload.state || '').trim();
    const trimmedPincode = (payload.pincode || '').trim();

    if (payload.profile_pic_file && payload.profile_pic_file.uri) {
      const formData = new FormData();
      formData.append('name', trimmedName);
      formData.append('username', trimmedUsername);
      formData.append('email', trimmedEmail);
      formData.append('password', rawPassword);
      formData.append('contact', trimmedContact);
      formData.append('address', trimmedAddress);
      formData.append('city', trimmedCity);
      formData.append('state', trimmedState);
      formData.append('pincode', trimmedPincode);

      const ext = payload.profile_pic_file.type?.includes('png') ? 'png' : 'jpg';
      const safeName = payload.profile_pic_file.name || getSafeFileName('profile_pic', undefined, ext);
      const fileBlob = {
        uri: payload.profile_pic_file.uri,
        name: safeName,
        type: payload.profile_pic_file.type || 'image/jpeg',
      };

      formData.append('profile_pic_upload', fileBlob as any);
      formData.append('profile_pic', fileBlob as any);
      formData.append('photo', fileBlob as any);

      const response = await client.post<RegisterResponse>(
        ENDPOINTS.AUTH.REGISTER,
        formData
      );

      const result = response.data;
      if (result && (result.status === 'error' || (result as any).status === 0)) {
        throw new Error(result.message || 'Registration failed.');
      }
      return result;
    }

    const cleanJson = {
      name: trimmedName,
      username: trimmedUsername,
      email: trimmedEmail,
      password: rawPassword,
      contact: trimmedContact,
      address: trimmedAddress,
      city: trimmedCity,
      state: trimmedState,
      pincode: trimmedPincode,
    };

    const response = await client.post<RegisterResponse>(
      ENDPOINTS.AUTH.REGISTER,
      cleanJson
    );

    const result = response.data;
    if (result && (result.status === 'error' || (result as any).status === 0)) {
      throw new Error(result.message || 'Registration failed.');
    }
    return result;
  },

  /**
   * 5. Verify Register OTP API (For Account Activation after Signup)
   */
  verifyRegisterOtp: async (email: string, otp: string): Promise<GenericApiResponse> => {
    const trimmedEmail = (email || '').trim();
    const cleanOtp = String(otp || '').trim();

    const response = await client.post<GenericApiResponse>(
      ENDPOINTS.AUTH.VERIFY_REGISTER_OTP,
      { email: trimmedEmail, otp: cleanOtp }
    );

    const result = response.data;
    if (result && (result.status === 'error' || (result as any).status === 0)) {
      throw new Error(result.message || 'Invalid or expired verification OTP.');
    }

    return result;
  },

  /**
   * 6. Reset Password API
   * Strictly updates user password without double hashing.
   */
  resetPassword: async (email: string, otp: string, new_password: string): Promise<GenericApiResponse> => {
    const trimmedEmail = (email || '').trim();
    const cleanOtp = String(otp || '').trim();
    const rawNewPassword = new_password; // Preserved raw

    const response = await client.post<GenericApiResponse>(
      ENDPOINTS.AUTH.RESET_PASSWORD,
      {
        email: trimmedEmail,
        otp: cleanOtp,
        new_password: rawNewPassword,
      }
    );

    const result = response.data;
    if (result && (result.status === 'error' || (result as any).status === 0)) {
      throw new Error(result.message || 'Failed to reset password. Please check your OTP.');
    }

    return result;
  },

  /**
   * Retrieve Persisted Token
   */
  getStoredToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch {
      return null;
    }
  },

  /**
   * Retrieve Persisted User
   */
  getStoredUser: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Save Session Helper
   */
  saveUserSession: async (token?: string, user?: any): Promise<void> => {
    try {
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    } catch (e) {
      console.warn('AsyncStorage saveUserSession error:', e);
    }
  },

  /**
   * Complete Logout Helper
   */
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.warn('AsyncStorage logout error:', e);
    }
  },
};

export const authService = AuthService;