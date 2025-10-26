/**
 * Zod validation schemas for email types
 */

import { z } from 'zod'

export const EmailAddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
})

export const AttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number().min(0),
  contentId: z.string().optional(),
  disposition: z.enum(['attachment', 'inline']).optional(),
  data: z.instanceof(Buffer).optional(),
})

export const EmailBodySchema = z.object({
  text: z.string().optional(),
  html: z.string().optional(),
})

export const EmailFlagsSchema = z.object({
  seen: z.boolean(),
  answered: z.boolean(),
  flagged: z.boolean(),
  deleted: z.boolean(),
  draft: z.boolean(),
  recent: z.boolean(),
})

export const ActionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  dueDate: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  completed: z.boolean(),
  extractedAt: z.date(),
})

export const AIMetadataSchema = z.object({
  summary: z.string().optional(),
  category: z.enum([
    'personal',
    'work',
    'finance',
    'social',
    'promotions',
    'newsletters',
    'automated',
    'support',
    'legal',
    'other'
  ]).optional(),
  priority: z.number().min(1).max(5).optional(),
  actionItems: z.array(ActionItemSchema).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  keywords: z.array(z.string()).optional(),
  processedAt: z.date(),
  provider: z.string(),
  model: z.string(),
})

export const EmailSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  messageId: z.string(),
  threadId: z.string().optional(),
  subject: z.string(),
  from: EmailAddressSchema,
  to: z.array(EmailAddressSchema),
  cc: z.array(EmailAddressSchema).optional(),
  bcc: z.array(EmailAddressSchema).optional(),
  replyTo: z.array(EmailAddressSchema).optional(),
  date: z.date(),
  receivedDate: z.date(),
  body: EmailBodySchema,
  attachments: z.array(AttachmentSchema),
  flags: EmailFlagsSchema,
  folder: z.string(),
  size: z.number().min(0),
  headers: z.record(z.string()),
  aiMetadata: AIMetadataSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const EmailThreadSchema = z.object({
  id: z.string(),
  subject: z.string(),
  emails: z.array(EmailSchema),
  participants: z.array(EmailAddressSchema),
  lastActivity: z.date(),
  messageCount: z.number().min(0),
  unreadCount: z.number().min(0),
  hasAttachments: z.boolean(),
  folder: z.string(),
})

export const EmailFolderSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string(),
  path: z.string(),
  type: z.enum(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'custom']),
  unreadCount: z.number().min(0),
  totalCount: z.number().min(0),
  parent: z.string().optional(),
  children: z.array(z.string()),
  attributes: z.array(z.string()),
  delimiter: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const EmailActionSchema = z.object({
  type: z.enum(['mark_read', 'mark_unread', 'flag', 'unflag', 'delete', 'move', 'copy', 'archive']),
  emailIds: z.array(z.string()).min(1),
  targetFolder: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const EmailCompositionSchema = z.object({
  to: z.array(EmailAddressSchema).min(1),
  cc: z.array(EmailAddressSchema).optional(),
  bcc: z.array(EmailAddressSchema).optional(),
  subject: z.string(),
  body: EmailBodySchema,
  attachments: z.array(AttachmentSchema).optional(),
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).optional(),
  priority: z.number().min(1).max(5).optional(),
  isDraft: z.boolean(),
  scheduledSendTime: z.date().optional(),
})

export const EmailContextSchema = z.object({
  originalEmail: EmailSchema.optional(),
  type: z.enum(['reply', 'reply_all', 'forward', 'new']),
  customContext: z.string().optional(),
})

export const SearchQuerySchema = z.object({
  text: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  folder: z.string().optional(),
  hasAttachments: z.boolean().optional(),
  category: z.enum([
    'personal',
    'work',
    'finance',
    'social',
    'promotions',
    'newsletters',
    'automated',
    'support',
    'legal',
    'other'
  ]).optional(),
  priority: z.number().min(1).max(5).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
  flags: EmailFlagsSchema.partial().optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['date', 'subject', 'sender', 'size']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const SearchResultSchema = z.object({
  emails: z.array(EmailSchema),
  totalCount: z.number().min(0),
  hasMore: z.boolean(),
  query: SearchQuerySchema,
  executionTime: z.number().min(0),
})

// Type inference helpers
export type EmailAddressInput = z.input<typeof EmailAddressSchema>
export type EmailInput = z.input<typeof EmailSchema>
export type EmailCompositionInput = z.input<typeof EmailCompositionSchema>
export type SearchQueryInput = z.input<typeof SearchQuerySchema>