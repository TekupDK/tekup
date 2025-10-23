// Constants for RendetaljeOS

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  JOBS: {
    BASE: '/jobs',
    BY_ID: (id: string) => `/jobs/${id}`,
    ASSIGN: (id: string) => `/jobs/${id}/assign`,
    STATUS: (id: string) => `/jobs/${id}/status`,
    PHOTOS: (id: string) => `/jobs/${id}/photos`,
  },
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id: string) => `/customers/${id}`,
    MESSAGES: (id: string) => `/customers/${id}/messages`,
    REVIEWS: (id: string) => `/customers/${id}/reviews`,
  },
  TEAM: {
    BASE: '/team',
    BY_ID: (id: string) => `/team/${id}`,
    SCHEDULE: (id: string) => `/team/${id}/schedule`,
    TIME_ENTRIES: (id: string) => `/team/${id}/time-entries`,
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'rendetaljeos_access_token',
  REFRESH_TOKEN: 'rendetaljeos_refresh_token',
  USER_PROFILE: 'rendetaljeos_user_profile',
  THEME: 'rendetaljeos_theme',
  LANGUAGE: 'rendetaljeos_language',
} as const;

export const DEFAULT_SETTINGS = {
  THEME: 'light',
  LANGUAGE: 'da',
  TIMEZONE: 'Europe/Copenhagen',
  CURRENCY: 'DKK',
  DATE_FORMAT: 'dd/MM/yyyy',
  TIME_FORMAT: '24h',
} as const;

export const JOB_DURATIONS = {
  STANDARD: 120, // 2 hours
  DEEP: 240, // 4 hours
  WINDOW: 90, // 1.5 hours
  MOVEOUT: 180, // 3 hours
  OFFICE: 150, // 2.5 hours
} as const;

export const QUALITY_SCORES = {
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  POOR: 2,
  UNACCEPTABLE: 1,
} as const;

export const NOTIFICATION_TYPES = {
  JOB_ASSIGNED: 'job_assigned',
  JOB_STARTED: 'job_started',
  JOB_COMPLETED: 'job_completed',
  JOB_CANCELLED: 'job_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  CUSTOMER_MESSAGE: 'customer_message',
  QUALITY_ISSUE: 'quality_issue',
  SCHEDULE_CHANGE: 'schedule_change',
} as const;