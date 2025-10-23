"use strict";
// Constants for RendetaljeOS
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TYPES = exports.QUALITY_SCORES = exports.JOB_DURATIONS = exports.DEFAULT_SETTINGS = exports.STORAGE_KEYS = exports.API_ENDPOINTS = void 0;
exports.API_ENDPOINTS = {
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
        BY_ID: (id) => `/jobs/${id}`,
        ASSIGN: (id) => `/jobs/${id}/assign`,
        STATUS: (id) => `/jobs/${id}/status`,
        PHOTOS: (id) => `/jobs/${id}/photos`,
    },
    CUSTOMERS: {
        BASE: '/customers',
        BY_ID: (id) => `/customers/${id}`,
        MESSAGES: (id) => `/customers/${id}/messages`,
        REVIEWS: (id) => `/customers/${id}/reviews`,
    },
    TEAM: {
        BASE: '/team',
        BY_ID: (id) => `/team/${id}`,
        SCHEDULE: (id) => `/team/${id}/schedule`,
        TIME_ENTRIES: (id) => `/team/${id}/time-entries`,
    },
};
exports.STORAGE_KEYS = {
    ACCESS_TOKEN: 'rendetaljeos_access_token',
    REFRESH_TOKEN: 'rendetaljeos_refresh_token',
    USER_PROFILE: 'rendetaljeos_user_profile',
    THEME: 'rendetaljeos_theme',
    LANGUAGE: 'rendetaljeos_language',
};
exports.DEFAULT_SETTINGS = {
    THEME: 'light',
    LANGUAGE: 'da',
    TIMEZONE: 'Europe/Copenhagen',
    CURRENCY: 'DKK',
    DATE_FORMAT: 'dd/MM/yyyy',
    TIME_FORMAT: '24h',
};
exports.JOB_DURATIONS = {
    STANDARD: 120, // 2 hours
    DEEP: 240, // 4 hours
    WINDOW: 90, // 1.5 hours
    MOVEOUT: 180, // 3 hours
    OFFICE: 150, // 2.5 hours
};
exports.QUALITY_SCORES = {
    EXCELLENT: 5,
    GOOD: 4,
    AVERAGE: 3,
    POOR: 2,
    UNACCEPTABLE: 1,
};
exports.NOTIFICATION_TYPES = {
    JOB_ASSIGNED: 'job_assigned',
    JOB_STARTED: 'job_started',
    JOB_COMPLETED: 'job_completed',
    JOB_CANCELLED: 'job_cancelled',
    PAYMENT_RECEIVED: 'payment_received',
    CUSTOMER_MESSAGE: 'customer_message',
    QUALITY_ISSUE: 'quality_issue',
    SCHEDULE_CHANGE: 'schedule_change',
};
