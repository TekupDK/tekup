/**
 * Core email types and interfaces for AI IMAP Inbox
 */

export interface EmailAddress {
  email: string
  name?: string
}

export interface Attachment {
  id: string
  filename: string
  contentType: string
  size: number
  contentId?: string
  disposition?: 'attachment' | 'inline'
  data?: Buffer
}

export interface EmailBody {
  text?: string
  html?: string
}

export interface EmailFlags {
  seen: boolean
  answered: boolean
  flagged: boolean
  deleted: boolean
  draft: boolean
  recent: boolean
}

export interface AIMetadata {
  summary?: string
  category?: EmailCategory
  priority?: EmailPriority
  actionItems?: ActionItem[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  keywords?: string[]
  processedAt: Date
  provider: string
  model: string
}

export interface ActionItem {
  id: string
  text: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  extractedAt: Date
}

export interface Email {
  id: string
  accountId: string
  messageId: string
  threadId?: string
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  replyTo?: EmailAddress[]
  date: Date
  receivedDate: Date
  body: EmailBody
  attachments: Attachment[]
  flags: EmailFlags
  folder: string
  size: number
  headers: Record<string, string>
  aiMetadata?: AIMetadata
  createdAt: Date
  updatedAt: Date
}

export interface EmailThread {
  id: string
  subject: string
  emails: Email[]
  participants: EmailAddress[]
  lastActivity: Date
  messageCount: number
  unreadCount: number
  hasAttachments: boolean
  folder: string
}

export interface EmailFolder {
  id: string
  accountId: string
  name: string
  path: string
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom'
  unreadCount: number
  totalCount: number
  parent?: string
  children: string[]
  attributes: string[]
  delimiter: string
  createdAt: Date
  updatedAt: Date
}

export type EmailCategory = 
  | 'personal'
  | 'work'
  | 'finance'
  | 'social'
  | 'promotions'
  | 'newsletters'
  | 'automated'
  | 'support'
  | 'legal'
  | 'shopping'
  | 'travel'
  | 'spam'
  | 'other'

export type EmailPriority = 'high' | 'medium' | 'normal' | 'low' // Priority levels

export interface EmailAction {
  type: 'mark_read' | 'mark_unread' | 'flag' | 'unflag' | 'delete' | 'move' | 'copy' | 'archive'
  emailIds: string[]
  targetFolder?: string
  metadata?: Record<string, any>
}

export interface EmailComposition {
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  subject: string
  body: EmailBody
  attachments?: Attachment[]
  inReplyTo?: string
  references?: string[]
  priority?: EmailPriority
  isDraft: boolean
  scheduledSendTime?: Date
}

export interface EmailContext {
  originalEmail?: Email
  type: 'reply' | 'reply_all' | 'forward' | 'new'
  customContext?: string
  emailId?: string
  subject?: string
  sender?: EmailAddress
  recipients?: EmailAddress[]
  date?: Date
  content?: string
  hasAttachments?: boolean
  isReply?: boolean
  isForward?: boolean
}

export interface AIComposeContext {
  originalEmail?: Email
  type: 'reply' | 'reply_all' | 'forward' | 'new'
  prompt?: string
  customContext?: string
  emailId?: string
}

export interface SearchQuery {
  text?: string
  from?: string
  to?: string
  subject?: string
  folder?: string
  hasAttachments?: boolean
  category?: EmailCategory
  priority?: EmailPriority
  dateRange?: {
    start: Date
    end: Date
  }
  flags?: Partial<EmailFlags>
  filters?: any
  limit?: number
  offset?: number
  sortBy?: 'date' | 'subject' | 'sender' | 'size'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  emails: Email[]
  totalCount: number
  hasMore: boolean
  query: SearchQuery
  executionTime: number
}