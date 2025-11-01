import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database schema for chat sessions
 * 
 * CREATE TABLE chat_sessions (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   title TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   archived BOOLEAN DEFAULT FALSE,
 *   user_id UUID REFERENCES auth.users(id)
 * );
 * 
 * CREATE TABLE messages (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
 *   role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
 *   content TEXT NOT NULL,
 *   sources JSONB,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE INDEX idx_messages_session ON messages(session_id);
 * CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
 */

export interface DBChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  user_id?: string;
}

export interface DBMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: any;
  created_at: string;
}

// Session operations
export async function createSession(title: string): Promise<DBChatSession | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ title })
    .select()
    .single();

  if (error) {
    console.error('Create session error:', error);
    return null;
  }

  return data;
}

export async function getSessions(limit: number = 50): Promise<DBChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('archived', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get sessions error:', error);
    return [];
  }

  return data || [];
}

export async function updateSession(id: string, updates: Partial<DBChatSession>): Promise<boolean> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Update session error:', error);
    return false;
  }

  return true;
}

export async function deleteSession(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete session error:', error);
    return false;
  }

  return true;
}

// Message operations
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sources?: any
): Promise<DBMessage | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      sources,
    })
    .select()
    .single();

  if (error) {
    console.error('Save message error:', error);
    return null;
  }

  return data;
}

export async function getMessages(sessionId: string): Promise<DBMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Get messages error:', error);
    return [];
  }

  return data || [];
}
