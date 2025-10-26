/**
 * Database migrations for AI IMAP Inbox
 */

import { Migration } from '@shared/types'

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_initial_schema',
    sql: `
      -- Email accounts table
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL CHECK (provider IN ('gmail', 'google-workspace', 'outlook', 'outlook365', 'yahoo', 'icloud', 'fastmail', 'protonmail', 'generic')),
        display_name TEXT NOT NULL,
        email_address TEXT NOT NULL UNIQUE,
        imap_config TEXT NOT NULL, -- Encrypted JSON
        smtp_config TEXT, -- Encrypted JSON
        folders TEXT NOT NULL DEFAULT '[]', -- JSON array
        quota_used INTEGER DEFAULT 0,
        quota_limit INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'authenticating', 'syncing', 'offline')),
        last_error TEXT,
        features TEXT NOT NULL DEFAULT '{}', -- JSON object
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_sync_at DATETIME
      );

      -- Email folders table
      CREATE TABLE folders (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'custom')),
        unread_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        parent TEXT,
        children TEXT DEFAULT '[]', -- JSON array
        attributes TEXT DEFAULT '[]', -- JSON array
        delimiter TEXT DEFAULT '/',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        UNIQUE (account_id, path)
      );

      -- Emails table
      CREATE TABLE emails (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        thread_id TEXT,
        subject TEXT NOT NULL DEFAULT '',
        sender TEXT NOT NULL, -- JSON EmailAddress
        recipients TEXT NOT NULL, -- JSON EmailAddress[]
        cc TEXT, -- JSON EmailAddress[]
        bcc TEXT, -- JSON EmailAddress[]
        reply_to TEXT, -- JSON EmailAddress[]
        date DATETIME NOT NULL,
        received_date DATETIME NOT NULL,
        body_text TEXT,
        body_html TEXT,
        folder TEXT NOT NULL,
        size INTEGER DEFAULT 0,
        headers TEXT, -- JSON object
        flags TEXT NOT NULL DEFAULT '{}', -- JSON EmailFlags
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        UNIQUE (account_id, message_id)
      );

      -- Email attachments table
      CREATE TABLE attachments (
        id TEXT PRIMARY KEY,
        email_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        content_id TEXT,
        disposition TEXT CHECK (disposition IN ('attachment', 'inline')),
        data BLOB, -- Store small attachments inline
        file_path TEXT, -- Path to larger attachments on disk
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
      );

      -- AI providers table
      CREATE TABLE ai_providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL CHECK (name IN ('openai', 'anthropic', 'local', 'azure-openai', 'google-palm')),
        display_name TEXT NOT NULL,
        api_key TEXT, -- Encrypted
        endpoint TEXT,
        model TEXT NOT NULL,
        models TEXT NOT NULL DEFAULT '[]', -- JSON array
        max_tokens INTEGER DEFAULT 4096,
        temperature REAL DEFAULT 0.7,
        enabled BOOLEAN DEFAULT 1,
        rate_limit TEXT, -- JSON object
        features TEXT NOT NULL DEFAULT '{}', -- JSON object
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- AI requests table
      CREATE TABLE ai_requests (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('summarize', 'compose', 'categorize', 'extract_actions', 'sentiment', 'generate_subject', 'improve_writing', 'translate', 'detect_language', 'smart_reply')),
        email_id TEXT,
        context TEXT, -- JSON EmailContext
        prompt TEXT,
        options TEXT, -- JSON options
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        result TEXT, -- JSON result
        error TEXT,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
      );

      -- AI cache table
      CREATE TABLE ai_cache (
        id TEXT PRIMARY KEY,
        email_id TEXT NOT NULL,
        request_type TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        result TEXT NOT NULL, -- JSON result
        confidence REAL DEFAULT 1.0,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        hit_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE,
        UNIQUE (email_id, request_type, request_hash)
      );

      -- AI usage tracking table
      CREATE TABLE ai_usage (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        request_type TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        date DATE NOT NULL,
        success BOOLEAN DEFAULT 1,
        processing_time INTEGER DEFAULT 0, -- milliseconds
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- AI batches table
      CREATE TABLE ai_batches (
        id TEXT PRIMARY KEY,
        emails TEXT NOT NULL, -- JSON array of email IDs
        request_type TEXT NOT NULL,
        options TEXT, -- JSON options
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        progress INTEGER DEFAULT 0,
        results TEXT DEFAULT '{}', -- JSON object
        errors TEXT DEFAULT '{}', -- JSON object
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        total_tokens INTEGER DEFAULT 0,
        total_cost REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME
      );

      -- App settings table
      CREATE TABLE app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL, -- JSON value
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Secure storage table
      CREATE TABLE secure_storage (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL, -- Encrypted value
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sync status table
      CREATE TABLE sync_status (
        account_id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'syncing', 'error', 'paused')),
        progress INTEGER DEFAULT 0,
        current_folder TEXT,
        last_sync DATETIME,
        next_sync DATETIME,
        error TEXT,
        emails_processed INTEGER DEFAULT 0,
        emails_total INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
      );

      -- Create indexes for performance
      CREATE INDEX idx_emails_account_folder ON emails(account_id, folder);
      CREATE INDEX idx_emails_date ON emails(date DESC);
      CREATE INDEX idx_emails_thread ON emails(thread_id);
      CREATE INDEX idx_emails_flags ON emails(flags);
      CREATE INDEX idx_emails_subject ON emails(subject);
      CREATE INDEX idx_emails_sender ON emails(sender);
      CREATE INDEX idx_folders_account ON folders(account_id);
      CREATE INDEX idx_folders_type ON folders(type);
      CREATE INDEX idx_attachments_email ON attachments(email_id);
      CREATE INDEX idx_ai_cache_email ON ai_cache(email_id);
      CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
      CREATE INDEX idx_ai_requests_email ON ai_requests(email_id);
      CREATE INDEX idx_ai_requests_status ON ai_requests(status);
      CREATE INDEX idx_ai_usage_date ON ai_usage(date);
      CREATE INDEX idx_ai_usage_provider ON ai_usage(provider, model);

      -- Create full-text search index for emails
      CREATE VIRTUAL TABLE emails_fts USING fts5(
        subject, 
        body_text, 
        sender,
        content='emails',
        content_rowid='rowid'
      );

      -- Triggers to keep FTS index in sync
      CREATE TRIGGER emails_fts_insert AFTER INSERT ON emails BEGIN
        INSERT INTO emails_fts(rowid, subject, body_text, sender) 
        VALUES (new.rowid, new.subject, new.body_text, new.sender);
      END;

      CREATE TRIGGER emails_fts_delete AFTER DELETE ON emails BEGIN
        INSERT INTO emails_fts(emails_fts, rowid, subject, body_text, sender) 
        VALUES('delete', old.rowid, old.subject, old.body_text, old.sender);
      END;

      CREATE TRIGGER emails_fts_update AFTER UPDATE ON emails BEGIN
        INSERT INTO emails_fts(emails_fts, rowid, subject, body_text, sender) 
        VALUES('delete', old.rowid, old.subject, old.body_text, old.sender);
        INSERT INTO emails_fts(rowid, subject, body_text, sender) 
        VALUES (new.rowid, new.subject, new.body_text, new.sender);
      END;

      -- Triggers to update timestamps
      CREATE TRIGGER update_accounts_timestamp AFTER UPDATE ON accounts BEGIN
        UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
      END;

      CREATE TRIGGER update_folders_timestamp AFTER UPDATE ON folders BEGIN
        UPDATE folders SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
      END;

      CREATE TRIGGER update_emails_timestamp AFTER UPDATE ON emails BEGIN
        UPDATE emails SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
      END;

      CREATE TRIGGER update_ai_providers_timestamp AFTER UPDATE ON ai_providers BEGIN
        UPDATE ai_providers SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
      END;

      CREATE TRIGGER update_app_settings_timestamp AFTER UPDATE ON app_settings BEGIN
        UPDATE app_settings SET updated_at = CURRENT_TIMESTAMP WHERE key = new.key;
      END;

      CREATE TRIGGER update_secure_storage_timestamp AFTER UPDATE ON secure_storage BEGIN
        UPDATE secure_storage SET updated_at = CURRENT_TIMESTAMP WHERE key = new.key;
      END;

      CREATE TRIGGER update_sync_status_timestamp AFTER UPDATE ON sync_status BEGIN
        UPDATE sync_status SET updated_at = CURRENT_TIMESTAMP WHERE account_id = new.account_id;
      END;

      -- Insert default app settings
      INSERT INTO app_settings (key, value) VALUES 
        ('theme', '"auto"'),
        ('language', '"en"'),
        ('timezone', '"UTC"'),
        ('dateFormat', '"YYYY-MM-DD"'),
        ('timeFormat', '"24h"'),
        ('markAsReadOnView', 'true'),
        ('showNotifications', 'true'),
        ('soundEnabled', 'true'),
        ('autoSync', 'true'),
        ('syncInterval', '5'),
        ('autoSummarize', 'false'),
        ('autoCategorize', 'true'),
        ('autoExtractActions', 'true'),
        ('aiConfidence', '0.7'),
        ('sendUsageData', 'false'),
        ('enableLocalAI', 'false'),
        ('dataRetentionDays', '365'),
        ('compactView', 'false'),
        ('showPreview', 'true'),
        ('threadsEnabled', 'true'),
        ('keyboardShortcuts', 'true'),
        ('emailsPerPage', '50'),
        ('preloadEmails', '10'),
        ('cacheSize', '100');
    `,
  },
  {
    version: 2,
    name: 'add_ai_metadata_to_emails',
    sql: `
      -- Add AI metadata column to emails table
      ALTER TABLE emails ADD COLUMN ai_metadata TEXT; -- JSON AIMetadata

      -- Create index for AI metadata
      CREATE INDEX idx_emails_ai_metadata ON emails(ai_metadata);

      -- Add AI statistics tracking
      CREATE TABLE ai_statistics (
        id TEXT PRIMARY KEY,
        total_requests INTEGER DEFAULT 0,
        successful_requests INTEGER DEFAULT 0,
        failed_requests INTEGER DEFAULT 0,
        total_tokens_used INTEGER DEFAULT 0,
        total_cost REAL DEFAULT 0,
        average_processing_time REAL DEFAULT 0,
        requests_by_type TEXT DEFAULT '{}', -- JSON object
        requests_by_provider TEXT DEFAULT '{}', -- JSON object
        cache_hit_rate REAL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert initial statistics record
      INSERT INTO ai_statistics (id) VALUES ('global');
    `,
  },
  {
    version: 3,
    name: 'add_email_threads_support',
    sql: `
      -- Create email threads table
      CREATE TABLE email_threads (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        participants TEXT NOT NULL, -- JSON EmailAddress[]
        last_activity DATETIME NOT NULL,
        message_count INTEGER DEFAULT 0,
        unread_count INTEGER DEFAULT 0,
        has_attachments BOOLEAN DEFAULT 0,
        folder TEXT NOT NULL,
        account_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
      );

      -- Create index for threads
      CREATE INDEX idx_threads_account ON email_threads(account_id);
      CREATE INDEX idx_threads_last_activity ON email_threads(last_activity DESC);
      CREATE INDEX idx_threads_folder ON email_threads(folder);

      -- Create trigger to update thread timestamp
      CREATE TRIGGER update_threads_timestamp AFTER UPDATE ON email_threads BEGIN
        UPDATE email_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
      END;
    `,
  },
  {
    version: 4,
    name: 'add_notification_settings',
    sql: `
      -- Create notifications table
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('new_email', 'important_email', 'sync_error', 'account_error', 'ai_error')),
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        email_id TEXT,
        account_id TEXT,
        data TEXT, -- JSON additional data
        read BOOLEAN DEFAULT 0,
        shown BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
      );

      -- Create index for notifications
      CREATE INDEX idx_notifications_type ON notifications(type);
      CREATE INDEX idx_notifications_read ON notifications(read);
      CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

      -- Add notification configuration to app settings
      INSERT OR REPLACE INTO app_settings (key, value) VALUES 
        ('notificationConfig', '{"enabled": true, "types": ["new_email", "important_email"], "sound": true, "badge": true, "desktop": true, "emailPreview": true}');
    `,
  },
  {
    version: 5,
    name: 'add_backup_and_security',
    sql: `
      -- Create backups table
      CREATE TABLE backups (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        size INTEGER DEFAULT 0,
        type TEXT NOT NULL CHECK (type IN ('manual', 'automatic', 'scheduled')),
        status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index for backups
      CREATE INDEX idx_backups_created ON backups(created_at DESC);
      CREATE INDEX idx_backups_status ON backups(status);

      -- Add backup and security settings
      INSERT OR REPLACE INTO app_settings (key, value) VALUES 
        ('backupConfig', '{"enabled": true, "location": "", "frequency": "daily", "retention": 30, "includeAttachments": false, "encryption": false}'),
        ('securityConfig', '{"biometricAuth": false, "sessionTimeout": 60, "requireAuthForSettings": false, "requireAuthForAccounts": true}');
    `,
  },
]