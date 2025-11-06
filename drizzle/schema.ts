import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const fridayAi = pgSchema("friday_ai");
export const calendarStatusInFridayAi = fridayAi.enum("calendar_status", [
  "confirmed",
  "tentative",
  "cancelled",
]);
export const customerInvoiceStatusInFridayAi = fridayAi.enum(
  "customer_invoice_status",
  ["draft", "approved", "sent", "paid", "overdue", "voided"]
);
export const emailPipelineStageInFridayAi = fridayAi.enum(
  "email_pipeline_stage",
  ["needs_action", "venter_pa_svar", "i_kalender", "finance", "afsluttet"]
);
export const invoiceStatusInFridayAi = fridayAi.enum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export const leadStatusInFridayAi = fridayAi.enum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
]);
export const messageRoleInFridayAi = fridayAi.enum("message_role", [
  "user",
  "assistant",
  "system",
]);
export const taskPriorityInFridayAi = fridayAi.enum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);
export const taskStatusInFridayAi = fridayAi.enum("task_status", [
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);
export const themeInFridayAi = fridayAi.enum("theme", ["light", "dark"]);
export const userRoleInFridayAi = fridayAi.enum("user_role", ["user", "admin"]);

export const conversationsInFridayAi = fridayAi.table("conversations", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  title: varchar({ length: 255 }),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const messagesInFridayAi = fridayAi.table("messages", {
  id: serial().primaryKey().notNull(),
  conversationId: integer().notNull(),
  role: messageRoleInFridayAi().notNull(),
  content: text().notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const emailAttachmentsInFridayAi = fridayAi.table("email_attachments", {
  id: serial().primaryKey().notNull(),
  emailId: integer().notNull(),
  filename: varchar({ length: 255 }).notNull(),
  mimeType: varchar({ length: 100 }),
  size: integer(),
  attachmentId: varchar({ length: 255 }),
  storageUrl: text(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const calendarEventsInFridayAi = fridayAi.table(
  "calendar_events",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    googleEventId: varchar({ length: 255 }),
    calendarId: varchar({ length: 255 }),
    title: text(),
    description: text(),
    location: text(),
    startTime: timestamp({ mode: "string" }),
    endTime: timestamp({ mode: "string" }),
    isAllDay: boolean().default(false),
    status: calendarStatusInFridayAi().default("confirmed"),
    attendees: jsonb(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [unique("calendar_events_googleEventId_key").on(table.googleEventId)]
);

export const leadsInFridayAi = fridayAi.table("leads", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 320 }),
  phone: varchar({ length: 50 }),
  company: varchar({ length: 255 }),
  status: leadStatusInFridayAi().default("new"),
  source: varchar({ length: 100 }),
  notes: text(),
  lastContactedAt: timestamp({ mode: "string" }),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  score: integer().default(0).notNull(),
  metadata: jsonb(),
});

export const customerInvoicesInFridayAi = fridayAi.table("customer_invoices", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  customerId: integer(),
  billyInvoiceId: varchar({ length: 100 }),
  invoiceNumber: varchar({ length: 50 }),
  amount: numeric({ precision: 10, scale: 2 }),
  currency: varchar({ length: 3 }).default("DKK"),
  status: customerInvoiceStatusInFridayAi().default("draft"),
  dueDate: timestamp({ mode: "string" }),
  paidAt: timestamp({ mode: "string" }),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const tasksInFridayAi = fridayAi.table("tasks", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: taskStatusInFridayAi().default("todo"),
  priority: taskPriorityInFridayAi().default("medium"),
  orderIndex: integer().default(0).notNull(),
  dueDate: timestamp({ mode: "string" }),
  completedAt: timestamp({ mode: "string" }),
  relatedEmailId: integer(),
  relatedLeadId: integer(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const emailsInFridayAi = fridayAi.table(
  "emails",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    gmailId: varchar({ length: 255 }),
    threadId: varchar({ length: 255 }),
    subject: text(),
    fromEmail: varchar("from_email", { length: 320 }),
    toEmail: text("to_email"),
    cc: text(),
    bcc: text(),
    body: text(),
    snippet: text(),
    isRead: boolean().default(false),
    isStarred: boolean().default(false),
    labels: text(),
    hasAttachments: boolean().default(false),
    receivedAt: timestamp({ mode: "string" }).notNull(),
    sentAt: timestamp({ mode: "string" }),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    providerId: varchar({ length: 255 }).notNull(),
    threadKey: varchar({ length: 255 }),
    customerId: integer(),
    emailThreadId: integer(),
    text: text(),
    html: text(),
    // AI-generated fields
    aiSummary: text("ai_summary"),
    aiSummaryGeneratedAt: timestamp("ai_summary_generated_at", {
      mode: "string",
    }),
    aiLabelSuggestions: jsonb("ai_label_suggestions"),
    aiLabelsGeneratedAt: timestamp("ai_labels_generated_at", {
      mode: "string",
    }),
  },
  table => [
    unique("emails_gmailId_key").on(table.gmailId),
    unique("emails_providerid_unique").on(table.providerId),
  ]
);

export const invoicesInFridayAi = fridayAi.table(
  "invoices",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    invoiceNumber: varchar({ length: 50 }),
    customerName: varchar({ length: 255 }),
    customerEmail: varchar({ length: 320 }),
    amount: numeric({ precision: 10, scale: 2 }),
    currency: varchar({ length: 3 }).default("DKK"),
    status: invoiceStatusInFridayAi().default("draft"),
    dueDate: timestamp({ mode: "string" }),
    paidAt: timestamp({ mode: "string" }),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [unique("invoices_invoiceNumber_key").on(table.invoiceNumber)]
);

export const userCredentialsInFridayAi = fridayAi.table(
  "user_credentials",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    provider: varchar({ length: 50 }).notNull(),
    accessToken: text(),
    refreshToken: text(),
    expiresAt: timestamp({ mode: "string" }),
    scope: text(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [
    unique("user_credentials_userId_provider_key").on(
      table.userId,
      table.provider
    ),
  ]
);

export const billyRateLimitInFridayAi = fridayAi.table(
  "billy_rate_limit",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    requestCount: integer().default(0),
    resetAt: timestamp({ mode: "string" }).notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [unique("billy_rate_limit_userId_key").on(table.userId)]
);

export const billyApiCacheInFridayAi = fridayAi.table(
  "billy_api_cache",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    endpoint: varchar({ length: 255 }).notNull(),
    cacheKey: varchar({ length: 255 }).notNull(),
    data: jsonb().notNull(),
    expiresAt: timestamp({ mode: "string" }).notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [
    unique("billy_api_cache_userId_cacheKey_key").on(
      table.userId,
      table.cacheKey
    ),
  ]
);

export const aiInsightsInFridayAi = fridayAi.table("ai_insights", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  type: varchar({ length: 50 }).notNull(),
  relatedEntityType: varchar({ length: 50 }),
  relatedEntityId: integer(),
  insight: text().notNull(),
  confidence: numeric({ precision: 3, scale: 2 }),
  metadata: jsonb(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const emailAnalysisInFridayAi = fridayAi.table(
  "email_analysis",
  {
    id: serial().primaryKey().notNull(),
    emailId: integer().notNull(),
    sentiment: varchar({ length: 20 }),
    sentimentScore: numeric({ precision: 3, scale: 2 }),
    category: varchar({ length: 50 }),
    keyTopics: text(),
    suggestedActions: jsonb(),
    analyzedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [unique("email_analysis_emailId_key").on(table.emailId)]
);

export const auditLogsInFridayAi = fridayAi.table("audit_logs", {
  id: serial().primaryKey().notNull(),
  userId: integer(),
  action: varchar({ length: 100 }).notNull(),
  entityType: varchar({ length: 50 }),
  entityId: integer(),
  details: jsonb(),
  ipAddress: varchar({ length: 45 }),
  userAgent: text(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const notificationsInFridayAi = fridayAi.table("notifications", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  type: varchar({ length: 50 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  message: text(),
  isRead: boolean().default(false),
  actionUrl: text(),
  metadata: jsonb(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const userSettingsInFridayAi = fridayAi.table(
  "user_settings",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    theme: themeInFridayAi().default("light"),
    language: varchar({ length: 10 }).default("da"),
    emailNotifications: boolean().default(true),
    desktopNotifications: boolean().default(true),
    settings: jsonb(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [unique("user_settings_userId_key").on(table.userId)]
);

export const webhooksInFridayAi = fridayAi.table("webhooks", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  provider: varchar({ length: 50 }).notNull(),
  eventType: varchar({ length: 100 }).notNull(),
  payload: jsonb().notNull(),
  processedAt: timestamp({ mode: "string" }),
  error: text(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const usersInFridayAi = fridayAi.table(
  "users",
  {
    id: serial().primaryKey().notNull(),
    openId: varchar({ length: 64 }).notNull(),
    name: text(),
    email: varchar({ length: 320 }),
    loginMethod: varchar({ length: 64 }),
    role: userRoleInFridayAi().default("user").notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    lastSignedIn: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [unique("users_openId_key").on(table.openId)]
);

export const customersInFridayAi = fridayAi.table("customers", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 320 }),
  phone: varchar({ length: 50 }),
  company: varchar({ length: 255 }),
  address: text(),
  billyCustomerId: varchar({ length: 100 }),
  metadata: jsonb(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const emailThreadsInFridayAi = fridayAi.table(
  "email_threads",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    gmailThreadId: varchar({ length: 255 }).notNull(),
    subject: text(),
    participants: jsonb(),
    snippet: text(),
    labels: jsonb(),
    lastMessageAt: timestamp({ mode: "string" }),
    isRead: boolean().default(false).notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [unique("email_threads_gmailThreadId_key").on(table.gmailThreadId)]
);

export const customerEmailsInFridayAi = fridayAi.table(
  "customer_emails",
  {
    id: serial().primaryKey().notNull(),
    customerId: integer().notNull(),
    gmailThreadId: varchar({ length: 255 }).notNull(),
    subject: varchar({ length: 500 }),
    snippet: text(),
    lastMessageDate: timestamp({ mode: "string" }),
    isRead: boolean().default(false).notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [
    index("idx_customer_emails_customer_id").using(
      "btree",
      table.customerId.asc().nullsLast().op("int4_ops")
    ),
    index("idx_customer_emails_thread_id").using(
      "btree",
      table.gmailThreadId.asc().nullsLast().op("text_ops")
    ),
  ]
);

export const customerConversationsInFridayAi = fridayAi.table(
  "customer_conversations",
  {
    id: serial().primaryKey().notNull(),
    customerId: integer().notNull(),
    conversationId: integer().notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("idx_customer_conversations_customer").using(
      "btree",
      table.customerId.asc().nullsLast().op("int4_ops")
    ),
  ]
);

export const customerProfilesInFridayAi = fridayAi.table(
  "customer_profiles",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    leadId: integer(),
    billyCustomerId: varchar({ length: 255 }),
    billyOrganizationId: varchar({ length: 255 }),
    email: varchar({ length: 320 }).notNull(),
    name: varchar({ length: 255 }),
    phone: varchar({ length: 32 }),
    totalInvoiced: integer().default(0).notNull(),
    totalPaid: integer().default(0).notNull(),
    balance: integer().default(0).notNull(),
    invoiceCount: integer().default(0).notNull(),
    emailCount: integer().default(0).notNull(),
    aiResume: text(),
    lastContactDate: timestamp({ mode: "string" }),
    lastSyncDate: timestamp({ mode: "string" }),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [
    index("idx_customer_profiles_email").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops")
    ),
    index("idx_customer_profiles_lead_id").using(
      "btree",
      table.leadId.asc().nullsLast().op("int4_ops")
    ),
    index("idx_customer_profiles_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops")
    ),
  ]
);

export const emailPipelineStateInFridayAi = fridayAi.table(
  "email_pipeline_state",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    threadId: varchar({ length: 255 }).notNull(),
    stage: emailPipelineStageInFridayAi().notNull(),
    transitionedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [
    unique("email_pipeline_state_threadId_userId_key").on(
      table.threadId,
      table.userId
    ),
    index("idx_pipeline_state_stage_user").using(
      "btree",
      table.stage.asc().nullsLast(),
      table.userId.asc().nullsLast()
    ),
  ]
);

export const emailPipelineTransitionsInFridayAi = fridayAi.table(
  "email_pipeline_transitions",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    threadId: varchar({ length: 255 }).notNull(),
    fromStage: emailPipelineStageInFridayAi(),
    toStage: emailPipelineStageInFridayAi().notNull(),
    transitionedBy: varchar({ length: 255 }),
    reason: text(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [
    index("idx_pipeline_transitions_thread_user").using(
      "btree",
      table.threadId.asc().nullsLast().op("text_ops"),
      table.userId.asc().nullsLast().op("int4_ops")
    ),
  ]
);

export const analyticsEventsInFridayAi = fridayAi.table(
  "analytics_events",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    eventType: varchar({ length: 100 }).notNull(),
    eventData: jsonb(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [
    index("idx_analytics_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops")
    ),
    index("idx_analytics_event_type").using(
      "btree",
      table.eventType.asc().nullsLast().op("text_ops")
    ),
  ]
);

export const userPreferencesInFridayAi = fridayAi.table(
  "user_preferences",
  {
    id: serial().primaryKey().notNull(),
    userId: integer().notNull(),
    theme: themeInFridayAi().default("dark").notNull(),
    emailNotifications: boolean().default(true).notNull(),
    desktopNotifications: boolean().default(true).notNull(),
    preferences: jsonb(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  table => [unique("user_preferences_userId_key").on(table.userId)]
);

// Backward compatibility aliases for db.ts imports
export const emailPipelineState = emailPipelineStateInFridayAi;
export const emailPipelineTransitions = emailPipelineTransitionsInFridayAi;
export const analyticsEvents = analyticsEventsInFridayAi;
export const userPreferences = userPreferencesInFridayAi;
export const emailThreads = emailThreadsInFridayAi;
export const users = usersInFridayAi;
export const conversations = conversationsInFridayAi;
export const messages = messagesInFridayAi;
export const calendarEvents = calendarEventsInFridayAi;
export const leads = leadsInFridayAi;
export const invoices = invoicesInFridayAi;
export const tasks = tasksInFridayAi;
export const emails = emailsInFridayAi;
export const customerConversations = customerConversationsInFridayAi;
export const customerEmails = customerEmailsInFridayAi;
export const customerInvoices = customerInvoicesInFridayAi;
export const customerProfiles = customerProfilesInFridayAi;
export const emailAttachments = emailAttachmentsInFridayAi;
export const attachments = emailAttachmentsInFridayAi; // Alias for backward compatibility
export const userCredentials = userCredentialsInFridayAi;
export const billyRateLimit = billyRateLimitInFridayAi;
export const billyApiCache = billyApiCacheInFridayAi;
export const aiInsights = aiInsightsInFridayAi;
export const emailAnalysis = emailAnalysisInFridayAi;
export const auditLogs = auditLogsInFridayAi;
export const notifications = notificationsInFridayAi;
export const userSettings = userSettingsInFridayAi;
export const webhooks = webhooksInFridayAi;
export const customers = customersInFridayAi;

// Type aliases
export type EmailPipelineState =
  typeof emailPipelineStateInFridayAi.$inferSelect;
export type InsertEmailPipelineState =
  typeof emailPipelineStateInFridayAi.$inferInsert;
export type EmailPipelineTransition =
  typeof emailPipelineTransitionsInFridayAi.$inferSelect;
export type InsertEmailPipelineTransition =
  typeof emailPipelineTransitionsInFridayAi.$inferInsert;
export type AnalyticsEvent = typeof analyticsEventsInFridayAi.$inferSelect;
export type InsertAnalyticsEvent =
  typeof analyticsEventsInFridayAi.$inferInsert;
export type UserPreferences = typeof userPreferencesInFridayAi.$inferSelect;
export type InsertUserPreferences =
  typeof userPreferencesInFridayAi.$inferInsert;
export type EmailThread = typeof emailThreadsInFridayAi.$inferSelect;
export type InsertEmailThread = typeof emailThreadsInFridayAi.$inferInsert;
export type User = typeof usersInFridayAi.$inferSelect;
export type InsertUser = typeof usersInFridayAi.$inferInsert;
export type Conversation = typeof conversationsInFridayAi.$inferSelect;
export type InsertConversation = typeof conversationsInFridayAi.$inferInsert;
export type Message = typeof messagesInFridayAi.$inferSelect;
export type InsertMessage = typeof messagesInFridayAi.$inferInsert;
export type CalendarEvent = typeof calendarEventsInFridayAi.$inferSelect;
export type InsertCalendarEvent = typeof calendarEventsInFridayAi.$inferInsert;
export type Lead = typeof leadsInFridayAi.$inferSelect;
export type InsertLead = typeof leadsInFridayAi.$inferInsert;
export type Invoice = typeof invoicesInFridayAi.$inferSelect;
export type InsertInvoice = typeof invoicesInFridayAi.$inferInsert;
export type Task = typeof tasksInFridayAi.$inferSelect;
export type InsertTask = typeof tasksInFridayAi.$inferInsert;
export type CustomerConversation =
  typeof customerConversationsInFridayAi.$inferSelect;
export type InsertCustomerConversation =
  typeof customerConversationsInFridayAi.$inferInsert;
export type CustomerEmail = typeof customerEmailsInFridayAi.$inferSelect;
export type InsertCustomerEmail = typeof customerEmailsInFridayAi.$inferInsert;
export type CustomerInvoice = typeof customerInvoicesInFridayAi.$inferSelect;
export type InsertCustomerInvoice =
  typeof customerInvoicesInFridayAi.$inferInsert;
export type CustomerProfile = typeof customerProfilesInFridayAi.$inferSelect;
export type InsertCustomerProfile =
  typeof customerProfilesInFridayAi.$inferInsert;
