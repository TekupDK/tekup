import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// PostgreSQL Enum Types
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export const calendarStatusEnum = pgEnum("calendar_status", [
  "confirmed",
  "tentative",
  "cancelled",
]);
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
]);
export const customerInvoiceStatusEnum = pgEnum("customer_invoice_status", [
  "draft",
  "approved",
  "sent",
  "paid",
  "overdue",
  "voided",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);
export const emailPipelineStageEnum = pgEnum("email_pipeline_stage", [
  "needs_action",
  "venter_pa_svar",
  "i_kalender",
  "finance",
  "afsluttet",
]);
export const themeEnum = pgEnum("theme", ["light", "dark"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table - stores chat conversation threads
 */
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - stores individual chat messages
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 64 }), // e.g., "gpt-4o", "claude-3.5", "gemini-2.0"
  attachments:
    jsonb("attachments").$type<
      Array<{ url: string; name: string; type: string }>
    >(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Email threads table - stores Gmail thread information
 */
export const emailThreads = pgTable("email_threads", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  gmailThreadId: varchar("gmailThreadId", { length: 255 }).notNull(),
  subject: text("subject"),
  participants:
    jsonb("participants").$type<Array<{ name: string; email: string }>>(),
  snippet: text("snippet"),
  labels: jsonb("labels").$type<string[]>(),
  lastMessageAt: timestamp("lastMessageAt"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailThread = typeof emailThreads.$inferSelect;
export type InsertEmailThread = typeof emailThreads.$inferInsert;

/**
 * Invoices table - stores Billy invoice references
 */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  billyInvoiceId: varchar("billyInvoiceId", { length: 255 }).notNull(),
  customerId: varchar("customerId", { length: 255 }),
  customerName: varchar("customerName", { length: 255 }),
  amount: integer("amount").notNull(), // stored in cents/øre
  currency: varchar("currency", { length: 3 }).default("DKK").notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Calendar events table - stores Google Calendar event references
 */
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  googleEventId: varchar("googleEventId", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  location: text("location"),
  status: calendarStatusEnum("status").default("confirmed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Leads table - stores customer leads from various sources
 */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  source: varchar("source", { length: 64 }).notNull(), // e.g., "gmail", "rengoring.nu", "leadpoint"
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  company: varchar("company", { length: 255 }),
  score: integer("score").default(0).notNull(), // AI-calculated lead score (0-100)
  status: leadStatusEnum("status").default("new").notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(), // flexible field for source-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Customer profiles table - aggregated customer data from leads, invoices, emails
 */
export const customerProfiles = pgTable("customer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  leadId: integer("leadId"), // reference to leads table
  billyCustomerId: varchar("billyCustomerId", { length: 255 }), // Billy customer ID
  billyOrganizationId: varchar("billyOrganizationId", { length: 255 }), // Billy organization ID
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  totalInvoiced: integer("totalInvoiced").default(0).notNull(), // in øre
  totalPaid: integer("totalPaid").default(0).notNull(), // in øre
  balance: integer("balance").default(0).notNull(), // in øre (totalInvoiced - totalPaid)
  invoiceCount: integer("invoiceCount").default(0).notNull(),
  emailCount: integer("emailCount").default(0).notNull(),
  aiResume: text("aiResume"), // AI-generated customer summary
  lastContactDate: timestamp("lastContactDate"),
  lastSyncDate: timestamp("lastSyncDate"), // last Billy sync
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

/**
 * Customer invoices junction table - links customers to their invoices
 */
export const customerInvoices = pgTable("customer_invoices", {
  id: serial("id").primaryKey(),
  customerId: integer("customerId").notNull(), // reference to customer_profiles
  invoiceId: integer("invoiceId"), // reference to invoices table (optional)
  billyInvoiceId: varchar("billyInvoiceId", { length: 255 }).notNull(),
  invoiceNo: varchar("invoiceNo", { length: 64 }),
  amount: integer("amount").notNull(), // in øre
  paidAmount: integer("paidAmount").default(0).notNull(), // in øre
  status: customerInvoiceStatusEnum("status").default("draft").notNull(),
  entryDate: timestamp("entryDate"),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CustomerInvoice = typeof customerInvoices.$inferSelect;
export type InsertCustomerInvoice = typeof customerInvoices.$inferInsert;

/**
 * Customer emails junction table - links customers to their email threads
 */
export const customerEmails = pgTable("customer_emails", {
  id: serial("id").primaryKey(),
  customerId: integer("customerId").notNull(), // reference to customer_profiles
  emailThreadId: integer("emailThreadId"), // reference to email_threads (optional)
  gmailThreadId: varchar("gmailThreadId", { length: 255 }).notNull(),
  subject: text("subject"),
  snippet: text("snippet"),
  lastMessageDate: timestamp("lastMessageDate"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerEmail = typeof customerEmails.$inferSelect;
export type InsertCustomerEmail = typeof customerEmails.$inferInsert;

/**
 * Customer conversations table - dedicated chat conversations per customer
 */
export const customerConversations = pgTable("customer_conversations", {
  id: serial("id").primaryKey(),
  customerId: integer("customerId").notNull(), // reference to customer_profiles
  conversationId: integer("conversationId").notNull(), // reference to conversations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerConversation = typeof customerConversations.$inferSelect;
export type InsertCustomerConversation =
  typeof customerConversations.$inferInsert;

/**
 * Tasks table - stores user tasks and reminders
 */
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  status: taskStatusEnum("status").default("todo").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  relatedTo: varchar("relatedTo", { length: 64 }), // e.g., "lead:123", "invoice:456"
  orderIndex: integer("orderIndex"), // For drag & drop reordering within groups
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Analytics events table - stores user actions for analytics
 */
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  eventType: varchar("eventType", { length: 64 }).notNull(), // e.g., "lead_created", "invoice_sent"
  eventData: jsonb("eventData").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Emails table - stores individual email messages from SMTP
 */
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull().unique(), // 'inbound-{messageId}'
  fromEmail: varchar("fromEmail", { length: 320 }).notNull(),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  subject: text("subject"),
  text: text("text"),
  html: text("html"),
  receivedAt: timestamp("receivedAt").notNull(),
  threadKey: varchar("threadKey", { length: 255 }), // For grouping emails into threads
  customerId: integer("customerId"), // Reference to customer_profiles
  emailThreadId: integer("emailThreadId"), // Optional reference to email_threads
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;

/**
 * Attachments table - stores email attachments
 */
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  emailId: integer("emailId").notNull(), // Reference to emails table
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  size: integer("size"), // Size in bytes
  storageKey: varchar("storageKey", { length: 512 }), // Path to stored file
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

/**
 * Email pipeline state table - tracks pipeline stage for email threads
 */
export const emailPipelineState = pgTable("email_pipeline_state", {
  threadId: varchar("threadId", { length: 255 }).primaryKey(), // Gmail thread ID or threadKey
  stage: emailPipelineStageEnum("stage").notNull(),
  source: varchar("source", { length: 64 }), // 'rengoring_nu', 'rengoring_aarhus', 'adhelp', 'direct'
  taskType: varchar("taskType", { length: 64 }), // 'fast_rengoring', 'flytterengoring', 'hovedrengoring', 'engangsopgaver'
  leadId: integer("leadId"), // Reference to leads table
  calendarEventId: varchar("calendarEventId", { length: 255 }), // Google Calendar event ID
  invoiceId: varchar("invoiceId", { length: 255 }), // Billy invoice ID
  transitionedAt: timestamp("transitionedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailPipelineState = typeof emailPipelineState.$inferSelect;
export type InsertEmailPipelineState = typeof emailPipelineState.$inferInsert;

/**
 * Email pipeline transitions table - history of pipeline stage changes
 */
export const emailPipelineTransitions = pgTable("email_pipeline_transitions", {
  id: serial("id").primaryKey(),
  threadId: varchar("threadId", { length: 255 }).notNull(),
  fromStage: varchar("fromStage", { length: 64 }),
  toStage: varchar("toStage", { length: 64 }).notNull(),
  triggeredBy: varchar("triggeredBy", { length: 255 }), // user_id or 'auto'
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailPipelineTransition =
  typeof emailPipelineTransitions.$inferSelect;
export type InsertEmailPipelineTransition =
  typeof emailPipelineTransitions.$inferInsert;

/**
 * Email label rules table - auto-labeling rules for emails
 */
export const emailLabelRules = pgTable("email_label_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  priority: integer("priority").default(0).notNull(),
  conditions: jsonb("conditions").$type<{
    from?: string;
    to?: string;
    subject?: string;
    body?: string;
  }>(),
  actions: jsonb("actions").$type<{
    addLabels?: string[];
    removeLabels?: string[];
  }>(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailLabelRule = typeof emailLabelRules.$inferSelect;
export type InsertEmailLabelRule = typeof emailLabelRules.$inferInsert;

/**
 * User preferences table - stores user-specific settings
 */
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  theme: themeEnum("theme").default("dark"),
  language: varchar("language", { length: 10 }).default("da"),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  pushNotifications: boolean("pushNotifications").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
