import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';
import { ChatConversation, ChatMessage } from '../../shared/types/chatbot';
import { Email, EmailThread } from '../../shared/types/email';

export class DatabaseService {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-main-service');

  private db: Database.Database;
  private isInitialized = false;

  constructor() {
    const dbPath = join(app.getPath('userData'), 'inbox-ai.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    try {
      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');

      // Create tables
      this.createTables();
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private createTables(): void {
    // Conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'standard',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        context TEXT
      )
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )
    `);

    // Emails table (for caching and search)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        folder_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        thread_id TEXT,
        subject TEXT,
        from_email TEXT,
        from_name TEXT,
        to_emails TEXT,
        cc_emails TEXT,
        bcc_emails TEXT,
        body_text TEXT,
        body_html TEXT,
        date INTEGER,
        flags TEXT,
        attachments TEXT,
        ai_metadata TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // AI cache table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_cache (
        id TEXT PRIMARY KEY,
        email_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        result TEXT NOT NULL,
        model TEXT,
        tokens INTEGER,
        created_at INTEGER NOT NULL,
        expires_at INTEGER
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations (updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp);
      CREATE INDEX IF NOT EXISTS idx_emails_account_folder ON emails (account_id, folder_id);
      CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails (thread_id);
      CREATE INDEX IF NOT EXISTS idx_emails_date ON emails (date DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_cache_email_operation ON ai_cache (email_id, operation);
    `);
  }

  // Conversation methods
  async saveConversation(conversation: ChatConversation): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO conversations (id, title, mode, created_at, updated_at, context)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      conversation.id,
      conversation.title,
      conversation.mode,
      conversation.createdAt.getTime(),
      conversation.updatedAt.getTime(),
      JSON.stringify(conversation.context || {})
    );

    // Save messages
    const deleteMessagesStmt = this.db.prepare('DELETE FROM messages WHERE conversation_id = ?');
    deleteMessagesStmt.run(conversation.id);

    const insertMessageStmt = this.db.prepare(`
      INSERT INTO messages (id, conversation_id, content, role, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const message of conversation.messages) {
      insertMessageStmt.run(
        message.id,
        conversation.id,
        message.content,
        message.role,
        message.timestamp.getTime(),
        JSON.stringify(message.metadata || {})
      );
    }
  }

  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    const conversationStmt = this.db.prepare('SELECT * FROM conversations WHERE id = ?');
    const conversationRow = conversationStmt.get(conversationId) as any;

    if (!conversationRow) {
      return null;
    }

    const messagesStmt = this.db.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC'
    );
    const messageRows = messagesStmt.all(conversationId) as any[];

    const messages: ChatMessage[] = messageRows.map(row => ({
      id: row.id,
      content: row.content,
      role: row.role,
      timestamp: new Date(row.timestamp),
      metadata: JSON.parse(row.metadata || '{}')
    }));

    return {
      id: conversationRow.id,
      title: conversationRow.title,
      mode: conversationRow.mode,
      createdAt: new Date(conversationRow.created_at),
      updatedAt: new Date(conversationRow.updated_at),
      context: JSON.parse(conversationRow.context || '{}'),
      messages
    };
  }

  async getConversations(limit = 50): Promise<ChatConversation[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations 
      ORDER BY updated_at DESC 
      LIMIT ?
    `);
    const rows = stmt.all(limit) as any[];

    const conversations: ChatConversation[] = [];
    
    for (const row of rows) {
      const conversation = await this.getConversation(row.id);
      if (conversation) {
        conversations.push(conversation);
      }
    }

    return conversations;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const deleteMessagesStmt = this.db.prepare('DELETE FROM messages WHERE conversation_id = ?');
    const deleteConversationStmt = this.db.prepare('DELETE FROM conversations WHERE id = ?');
    
    deleteMessagesStmt.run(conversationId);
    deleteConversationStmt.run(conversationId);
  }

  // Email methods
  async saveEmail(email: Email): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO emails (
        id, account_id, folder_id, message_id, thread_id, subject,
        from_email, from_name, to_emails, cc_emails, bcc_emails,
        body_text, body_html, date, flags, attachments, ai_metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      email.id,
      email.accountId,
      email.folderId,
      email.messageId,
      email.threadId,
      email.subject,
      email.from.email,
      email.from.name,
      JSON.stringify(email.to),
      JSON.stringify(email.cc || []),
      JSON.stringify(email.bcc || []),
      email.body.text,
      email.body.html,
      email.date.getTime(),
      JSON.stringify(email.flags),
      JSON.stringify(email.attachments || []),
      JSON.stringify(email.aiMetadata || {}),
      Date.now(),
      Date.now()
    );
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    const stmt = this.db.prepare('SELECT * FROM emails WHERE id = ?');
    const row = stmt.get(emailId) as any;

    if (!row) {
      return null;
    }

    return this.rowToEmail(row);
  }

  async searchEmails(query: string, limit = 50): Promise<Email[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM emails 
      WHERE subject LIKE ? OR body_text LIKE ? OR from_email LIKE ?
      ORDER BY date DESC
      LIMIT ?
    `);
    
    const searchTerm = `%${query}%`;
    const rows = stmt.all(searchTerm, searchTerm, searchTerm, limit) as any[];
    
    return rows.map(row => this.rowToEmail(row));
  }

  private rowToEmail(row: any): Email {
    return {
      id: row.id,
      accountId: row.account_id,
      folderId: row.folder_id,
      messageId: row.message_id,
      threadId: row.thread_id,
      subject: row.subject,
      from: {
        email: row.from_email,
        name: row.from_name
      },
      to: JSON.parse(row.to_emails || '[]'),
      cc: JSON.parse(row.cc_emails || '[]'),
      bcc: JSON.parse(row.bcc_emails || '[]'),
      body: {
        text: row.body_text,
        html: row.body_html
      },
      date: new Date(row.date),
      flags: JSON.parse(row.flags || '{}'),
      attachments: JSON.parse(row.attachments || '[]'),
      aiMetadata: JSON.parse(row.ai_metadata || '{}')
    };
  }

  // AI Cache methods
  async getCachedAIResult(emailId: string, operation: string): Promise<any | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_cache 
      WHERE email_id = ? AND operation = ? AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    const row = stmt.get(emailId, operation, Date.now()) as any;
    
    if (!row) {
      return null;
    }
    
    return JSON.parse(row.result);
  }

  async setCachedAIResult(
    emailId: string, 
    operation: string, 
    result: any, 
    model?: string, 
    tokens?: number,
    expiresIn?: number
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_cache (id, email_id, operation, result, model, tokens, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const id = `${emailId}-${operation}-${Date.now()}`;
    const expiresAt = expiresIn ? Date.now() + expiresIn : null;
    
    stmt.run(
      id,
      emailId,
      operation,
      JSON.stringify(result),
      model,
      tokens,
      Date.now(),
      expiresAt
    );
  }

  // Cleanup methods
  async cleanupExpiredCache(): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM ai_cache WHERE expires_at IS NOT NULL AND expires_at < ?');
    stmt.run(Date.now());
  }

  async vacuum(): Promise<void> {
    this.db.exec('VACUUM');
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  get isReady(): boolean {
    return this.isInitialized;
  }
}