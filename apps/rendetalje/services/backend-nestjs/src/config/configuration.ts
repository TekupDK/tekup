export default () => ({
  // Application
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    encryptionKey: process.env.ENCRYPTION_KEY,
  },

  // External Integrations
  integrations: {
    tekupBilly: {
      url: process.env.TEKUP_BILLY_URL,
      apiKey: process.env.TEKUP_BILLY_API_KEY,
    },
    tekupVault: {
      url: process.env.TEKUPVAULT_URL,
      apiKey: process.env.TEKUPVAULT_API_KEY,
    },
    aiFriday: {
      url: process.env.AI_FRIDAY_URL,
      apiKey: process.env.AI_FRIDAY_API_KEY,
    },
    renosCalendar: {
      url: process.env.RENOS_CALENDAR_URL,
      apiKey: process.env.RENOS_CALENDAR_API_KEY,
    },
  },

  // Email
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.FROM_EMAIL,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
  },

  // Google Services
  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    calendarClientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    calendarClientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  },

  // Monitoring
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
  },

  // File Storage
  storage: {
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'rendetaljeos-files',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'application/pdf'
    ],
  },

  // Business Settings
  business: {
    currency: process.env.DEFAULT_CURRENCY || 'DKK',
    timezone: process.env.DEFAULT_TIMEZONE || 'Europe/Copenhagen',
    language: process.env.DEFAULT_LANGUAGE || 'da',
    rates: {
      standard: parseInt(process.env.STANDARD_CLEANING_RATE, 10) || 250,
      deep: parseInt(process.env.DEEP_CLEANING_RATE, 10) || 400,
      window: parseInt(process.env.WINDOW_CLEANING_RATE, 10) || 150,
      moveout: parseInt(process.env.MOVEOUT_CLEANING_RATE, 10) || 500,
    },
  },

  // Feature Flags
  features: {
    aiFriday: process.env.ENABLE_AI_FRIDAY === 'true',
    mobileApp: process.env.ENABLE_MOBILE_APP === 'true',
    voiceInput: process.env.ENABLE_VOICE_INPUT === 'true',
    offlineMode: process.env.ENABLE_OFFLINE_MODE === 'true',
    realTimeTracking: process.env.ENABLE_REAL_TIME_TRACKING === 'true',
    automaticInvoicing: process.env.ENABLE_AUTOMATIC_INVOICING === 'true',
  },

  // Security
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    sessionTimeoutHours: parseInt(process.env.SESSION_TIMEOUT_HOURS, 10) || 24,
  },

  // Performance
  performance: {
    databasePoolSize: parseInt(process.env.DATABASE_POOL_SIZE, 10) || 10,
    cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600,
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS, 10) || 50,
    imageCompressionQuality: parseInt(process.env.IMAGE_COMPRESSION_QUALITY, 10) || 80,
  },
});