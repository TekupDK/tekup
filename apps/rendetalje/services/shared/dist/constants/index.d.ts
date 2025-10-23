export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly REFRESH: "/auth/refresh";
        readonly PROFILE: "/auth/profile";
        readonly FORGOT_PASSWORD: "/auth/forgot-password";
        readonly RESET_PASSWORD: "/auth/reset-password";
        readonly CHANGE_PASSWORD: "/auth/change-password";
    };
    readonly JOBS: {
        readonly BASE: "/jobs";
        readonly BY_ID: (id: string) => string;
        readonly ASSIGN: (id: string) => string;
        readonly STATUS: (id: string) => string;
        readonly PHOTOS: (id: string) => string;
    };
    readonly CUSTOMERS: {
        readonly BASE: "/customers";
        readonly BY_ID: (id: string) => string;
        readonly MESSAGES: (id: string) => string;
        readonly REVIEWS: (id: string) => string;
    };
    readonly TEAM: {
        readonly BASE: "/team";
        readonly BY_ID: (id: string) => string;
        readonly SCHEDULE: (id: string) => string;
        readonly TIME_ENTRIES: (id: string) => string;
    };
};
export declare const STORAGE_KEYS: {
    readonly ACCESS_TOKEN: "rendetaljeos_access_token";
    readonly REFRESH_TOKEN: "rendetaljeos_refresh_token";
    readonly USER_PROFILE: "rendetaljeos_user_profile";
    readonly THEME: "rendetaljeos_theme";
    readonly LANGUAGE: "rendetaljeos_language";
};
export declare const DEFAULT_SETTINGS: {
    readonly THEME: "light";
    readonly LANGUAGE: "da";
    readonly TIMEZONE: "Europe/Copenhagen";
    readonly CURRENCY: "DKK";
    readonly DATE_FORMAT: "dd/MM/yyyy";
    readonly TIME_FORMAT: "24h";
};
export declare const JOB_DURATIONS: {
    readonly STANDARD: 120;
    readonly DEEP: 240;
    readonly WINDOW: 90;
    readonly MOVEOUT: 180;
    readonly OFFICE: 150;
};
export declare const QUALITY_SCORES: {
    readonly EXCELLENT: 5;
    readonly GOOD: 4;
    readonly AVERAGE: 3;
    readonly POOR: 2;
    readonly UNACCEPTABLE: 1;
};
export declare const NOTIFICATION_TYPES: {
    readonly JOB_ASSIGNED: "job_assigned";
    readonly JOB_STARTED: "job_started";
    readonly JOB_COMPLETED: "job_completed";
    readonly JOB_CANCELLED: "job_cancelled";
    readonly PAYMENT_RECEIVED: "payment_received";
    readonly CUSTOMER_MESSAGE: "customer_message";
    readonly QUALITY_ISSUE: "quality_issue";
    readonly SCHEDULE_CHANGE: "schedule_change";
};
