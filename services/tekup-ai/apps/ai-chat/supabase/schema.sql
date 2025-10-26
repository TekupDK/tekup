-- Tekup AI Assistant Database Schema
-- Platform: Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB,
  code_blocks JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Preferences Table (future authentication)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Analytics Table (optional)
CREATE TABLE IF NOT EXISTS chat_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_sessions_user 
  ON chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_updated 
  ON chat_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_archived 
  ON chat_sessions(archived) WHERE NOT archived;

CREATE INDEX IF NOT EXISTS idx_messages_session 
  ON messages(session_id);

CREATE INDEX IF NOT EXISTS idx_messages_created 
  ON messages(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_role 
  ON messages(role);

CREATE INDEX IF NOT EXISTS idx_analytics_session 
  ON chat_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_event 
  ON chat_analytics(event_type);

-- Functions
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for future auth integration)
-- For now, allow all operations (will be restricted with auth)

-- Chat Sessions Policies
CREATE POLICY "Users can view their own sessions"
  ON chat_sessions FOR SELECT
  USING (true); -- Replace with: user_id = auth.uid()::text

CREATE POLICY "Users can create their own sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (true); -- Replace with: user_id = auth.uid()::text

CREATE POLICY "Users can update their own sessions"
  ON chat_sessions FOR UPDATE
  USING (true); -- Replace with: user_id = auth.uid()::text

CREATE POLICY "Users can delete their own sessions"
  ON chat_sessions FOR DELETE
  USING (true); -- Replace with: user_id = auth.uid()::text

-- Messages Policies
CREATE POLICY "Users can view messages in their sessions"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = messages.session_id
      -- AND chat_sessions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create messages in their sessions"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = messages.session_id
      -- AND chat_sessions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update messages in their sessions"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = messages.session_id
      -- AND chat_sessions.user_id = auth.uid()::text
    )
  );

-- User Preferences Policies
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (true); -- Replace with: user_id = auth.uid()::text

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (true); -- Replace with: user_id = auth.uid()::text

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (true); -- Replace with: user_id = auth.uid()::text

-- Chat Analytics Policies
CREATE POLICY "Users can view analytics for their sessions"
  ON chat_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_analytics.session_id
      -- AND chat_sessions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create analytics for their sessions"
  ON chat_analytics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_analytics.session_id
      -- AND chat_sessions.user_id = auth.uid()::text
    )
  );

-- Sample Data (for testing)
-- Uncomment to insert demo data

-- INSERT INTO chat_sessions (user_id, title)
-- VALUES ('demo-user', 'Getting Started with Tekup');

-- INSERT INTO messages (session_id, role, content)
-- SELECT id, 'assistant', 'Welcome to Tekup AI Assistant! How can I help you today?'
-- FROM chat_sessions
-- WHERE title = 'Getting Started with Tekup';

-- Views for Analytics
CREATE OR REPLACE VIEW session_stats AS
SELECT
  user_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE archived = false) as active_sessions,
  COUNT(*) FILTER (WHERE archived = true) as archived_sessions,
  MAX(updated_at) as last_activity
FROM chat_sessions
GROUP BY user_id;

CREATE OR REPLACE VIEW message_stats AS
SELECT
  s.user_id,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE m.role = 'user') as user_messages,
  COUNT(*) FILTER (WHERE m.role = 'assistant') as assistant_messages,
  AVG(LENGTH(m.content)) as avg_message_length
FROM messages m
JOIN chat_sessions s ON m.session_id = s.id
GROUP BY s.user_id;

-- Migration Info
COMMENT ON TABLE chat_sessions IS 'Stores chat conversation sessions';
COMMENT ON TABLE messages IS 'Stores individual messages within chat sessions';
COMMENT ON TABLE user_preferences IS 'Stores user-specific preferences and settings';
COMMENT ON TABLE chat_analytics IS 'Stores analytics events for usage tracking';

-- Grant permissions (if needed for specific roles)
-- GRANT ALL ON chat_sessions TO authenticated;
-- GRANT ALL ON messages TO authenticated;
-- GRANT ALL ON user_preferences TO authenticated;
-- GRANT ALL ON chat_analytics TO authenticated;
