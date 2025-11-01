/**
 * Google Authentication Utility
 * Handles service account authentication with domain-wide delegation
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { DEFAULT_CONFIG, getGoogleMcpConfig } from '../config.js';
import { log, logError } from './logger.js';

// Cache auth clients by scope combination
const authClientCache = new Map<string, JWT>();

/**
 * Get Google authentication client with specified scopes
 * Uses service account with domain-wide delegation
 */
export function getGoogleAuthClient(scopes?: string[]): JWT | null {
  const config = getGoogleMcpConfig();
  
  if (!config.google.isConfigured) {
    log.warn('Google credentials not configured - running in dry-run mode', {
      hasClientEmail: !!config.google.clientEmail,
      hasPrivateKey: !!config.google.privateKey,
    });
    return null;
  }
  
  const scopesToUse = scopes || DEFAULT_CONFIG.SCOPES;
  const subject = config.google.impersonatedUser;
  
  // Create cache key based on scopes and subject
  const cacheKey = `${[...scopesToUse].sort().join(',')}:${subject}`;
  
  // Return cached client if exists
  if (authClientCache.has(cacheKey)) {
    return authClientCache.get(cacheKey)!;
  }
  
  try {
    // Normalize private key (handle escaped newlines)
    const privateKey = (config.google.privateKey || '')
      .replace(/\\n/g, '\n')
      .replace(/\r/g, '');
    
    const authClient = new JWT({
      email: config.google.clientEmail,
      key: privateKey,
      scopes: [...scopesToUse],
      subject, // Impersonate this user
    });
    
    // Cache the client
    authClientCache.set(cacheKey, authClient);
    
    log.info('Google auth client initialized', {
      impersonatedUser: subject,
      scopes: scopesToUse.length,
    });
    
    return authClient;
  } catch (error) {
    logError('Failed to create Google auth client', error);
    return null;
  }
}

/**
 * Get authenticated Google Calendar API client
 */
export function getCalendarClient() {
  const auth = getGoogleAuthClient([
    'https://www.googleapis.com/auth/calendar',
  ]);
  
  if (!auth) {
    throw new Error('Google Calendar client not available - credentials not configured');
  }
  
  return google.calendar({ version: 'v3', auth });
}

/**
 * Get authenticated Gmail API client
 */
export function getGmailClient() {
  const auth = getGoogleAuthClient([
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ]);
  
  if (!auth) {
    throw new Error('Gmail client not available - credentials not configured');
  }
  
  return google.gmail({ version: 'v1', auth });
}

/**
 * Clear authentication cache (useful for testing or credential rotation)
 */
export function clearAuthCache(): void {
  authClientCache.clear();
  log.info('Authentication cache cleared');
}
