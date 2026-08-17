/**
 * Centralized API Endpoints for EagleEye Motorsports
 */

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    REQUEST_OTP: '/request-otp',
    VERIFY_OTP: '/verify-otp',
    REGISTER: '/register',
    VERIFY_REGISTER_OTP: '/verify-register-otp',
    RESET_PASSWORD: '/reset-password',
  },
  PROFILE: {
    GET: '/user-profile',
    UPDATE: '/update-profile',
  },
  EVENTS: {
    LIST: '/events',
    DETAIL: (eventId: string | number) => `/events/${eventId}`,
    CATEGORIES: (eventId: string | number) => `/events/${eventId}/categories`,
    CLASSES: (eventId: string | number, categoryId: string | number) => `/events/${eventId}/categories/${categoryId}/classes`,
    JOIN: '/events/join',
    MY_EVENTS: '/events/myevents',
  },
  BANNERS: '/banners',
  DRIVER_NAVIGATOR: {
    SAVE: '/driver/save',
    GET_BY_ROLE: (roleType: 'driver' | 'navigator') => `/driver/get?role_type=${roleType}`,
    GET_ALL: '/driver/get',
    DETAIL: (id: string | number) => `/driver/detail/${id}`,
  },
  VEHICLE: {
    SAVE: '/vehicle/save',
    LIST: '/vehicle/list',
    GET: '/vehicle/get',
    DETAIL: (id: string | number) => `/vehicle/detail/${id}`,
    DELETE: '/vehicle/delete',
  },
  SEARCH: {
    DRIVERS: '/drivers/search',
    NAVIGATORS: '/navigators/search',
    VEHICLES: '/vehicles/search',
  },
} as const;