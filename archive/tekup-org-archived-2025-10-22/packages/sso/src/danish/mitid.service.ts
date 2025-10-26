import { Injectable } from '@nestjs/common';
import { createLogger } from '@tekup/shared';

const logger = createLogger('tekup-mitid-service');

@Injectable()
export class MitIDService {
  private readonly mitIdBaseUrl = process.env.MITID_BASE_URL || 'https://pp.mitid.dk';
  private readonly clientId = process.env.MITID_CLIENT_ID;
  private readonly clientSecret = process.env.MITID_CLIENT_SECRET;

  /**
   * Initiate MitID authentication flow
   */
  async initiateMitIDLogin(redirectUri: string): Promise<MitIDAuthUrl> {
    const state = this.generateSecureState();
    const nonce = this.generateNonce();
    
    const authUrl = new URL(`${this.mitIdBaseUrl}/auth`);
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile cpr');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('ui_locales', 'da');

    logger.info(`MitID authentication initiated for redirect URI: ${redirectUri}`);

    return {
      authUrl: authUrl.toString(),
      state,
      nonce
    };
  }

  /**
   * Handle MitID callback and exchange code for token
   */
  async handleMitIDCallback(code: string, state: string, storedState: string): Promise<MitIDUserInfo> {
    if (state !== storedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    try {
      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);
      
      // Decode and verify ID token
      const userInfo = await this.verifyAndDecodeIDToken(tokenResponse.id_token);
      
      logger.info(`MitID authentication successful for user: ${userInfo.sub}`);
      
      return userInfo;
    } catch (error) {
      logger.error('MitID callback handling failed:', error);
      throw new Error('Failed to process MitID authentication');
    }
  }

  /**
   * Verify MitID token and extract user information
   */
  async verifyMitIDToken(idToken: string): Promise<MitIDUserInfo> {
    try {
      // In production, verify signature with MitID public keys
      const payload = this.decodeJWTPayload(idToken);
      
      return {
        sub: payload.sub,
        cpr: payload.cpr, // Danish CPR number
        name: payload.name,
        email: payload.email,
        verified: true,
        authTime: payload.auth_time
      };
    } catch (error) {
      logger.error('MitID token verification failed:', error);
      throw new Error('Invalid MitID token');
    }
  }

  /**
   * Link MitID identity with TekUp user account
   */
  async linkMitIDToTekUpUser(mitIdInfo: MitIDUserInfo, tekUpUserId: string): Promise<void> {
    // Store MitID linkage in database
    // This would integrate with the main user database
    logger.info(`Linked MitID ${mitIdInfo.sub} to TekUp user ${tekUpUserId}`);
  }

  private async exchangeCodeForTokens(code: string): Promise<MitIDTokenResponse> {
    const tokenEndpoint = `${this.mitIdBaseUrl}/token`;
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.MITID_REDIRECT_URI || 'http://localhost:3000/auth/mitid/callback'
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  private async verifyAndDecodeIDToken(idToken: string): Promise<MitIDUserInfo> {
    // In production: verify signature, issuer, audience, expiration
    // For now, just decode (NOT secure for production)
    const payload = this.decodeJWTPayload(idToken);
    
    return {
      sub: payload.sub,
      cpr: payload.cpr,
      name: payload.name,
      email: payload.email,
      verified: true,
      authTime: payload.auth_time
    };
  }

  private decodeJWTPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  }

  private generateSecureState(): string {
    return Buffer.from(require('crypto').randomBytes(32)).toString('base64url');
  }

  private generateNonce(): string {
    return Buffer.from(require('crypto').randomBytes(16)).toString('base64url');
  }
}

export interface MitIDAuthUrl {
  authUrl: string;
  state: string;
  nonce: string;
}

export interface MitIDTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export interface MitIDUserInfo {
  sub: string; // MitID subject identifier
  cpr?: string; // Danish CPR number
  name: string;
  email?: string;
  verified: boolean;
  authTime: number;
}
