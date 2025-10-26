import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RedisClusterService } from '../cache/redis-cluster.service.js';

export interface SessionAffinityConfig {
  enabled: boolean;
  cookieName: string;
  cookieMaxAge: number; // in milliseconds
  stickySessionTimeout: number; // in seconds
  useIpHashing: boolean;
  useHeaderBased: boolean;
  affinityHeader: string;
}

export interface SessionInfo {
  sessionId: string;
  nodeId: string;
  tenantId?: string;
  userId?: string;
  createdAt: Date;
  lastAccessed: Date;
  expiresAt: Date;
}

@Injectable()
export class SessionAffinityService {
  private readonly logger = new Logger(SessionAffinityService.name);
  private readonly defaultConfig: SessionAffinityConfig = {
    enabled: process.env.SESSION_AFFINITY_ENABLED === 'true',
    cookieName: process.env.SESSION_AFFINITY_COOKIE_NAME || 'PX_SESSION_AFFINITY',
    cookieMaxAge: parseInt(process.env.SESSION_AFFINITY_COOKIE_MAX_AGE || '3600000'), // 1 hour
    stickySessionTimeout: parseInt(process.env.SESSION_AFFINITY_STICKY_TIMEOUT || '3600'), // 1 hour
    useIpHashing: process.env.SESSION_AFFINITY_USE_IP_HASHING === 'true',
    useHeaderBased: process.env.SESSION_AFFINITY_USE_HEADER === 'true',
    affinityHeader: process.env.SESSION_AFFINITY_HEADER_NAME || 'x-px-session-affinity',
  };

  constructor(
    private readonly redisClusterService: RedisClusterService,
  ) {}

  /**
   * Get or create session affinity for a request
   */
  async getSessionAffinity(req: Request, res: Response): Promise<SessionInfo | null> {
    if (!this.defaultConfig.enabled) {
      return null;
    }

    try {
      // Try to get existing session ID
      let sessionId = this.extractSessionId(req, res);
      
      // If no session ID found, create a new one
      if (!sessionId) {
        sessionId = await this.createSession(req, res);
        if (!sessionId) {
          return null;
        }
      }

      // Get session info from Redis
      const sessionKey = this.getSessionKey(sessionId);
      const sessionInfo = await this.redisClusterService.get<SessionInfo>(sessionKey);
      
      if (sessionInfo) {
        // Update last accessed time
        sessionInfo.lastAccessed = new Date();
        sessionInfo.expiresAt = new Date(Date.now() + (this.defaultConfig.stickySessionTimeout * 1000));
        await this.redisClusterService.set(sessionKey, sessionInfo, this.defaultConfig.stickySessionTimeout);
        
        // Set affinity cookie/header if needed
        this.setSessionAffinityResponse(req, res, sessionId);
        
        return sessionInfo;
      }

      // Create new session info
      const newNodeId = await this.getNodeIdForSession(req);
      const newSessionInfo: SessionInfo = {
        sessionId,
        nodeId: newNodeId,
        tenantId: (req as any).tenantId,
        userId: (req as any).userId,
        createdAt: new Date(),
        lastAccessed: new Date(),
        expiresAt: new Date(Date.now() + (this.defaultConfig.stickySessionTimeout * 1000)),
      };

      // Store in Redis
      await this.redisClusterService.set(
        sessionKey, 
        newSessionInfo, 
        this.defaultConfig.stickySessionTimeout
      );

      // Set affinity response
      this.setSessionAffinityResponse(req, res, sessionId);

      return newSessionInfo;
    } catch (error) {
      this.logger.error('Failed to get session affinity:', error);
      return null;
    }
  }

  /**
   * Extract session ID from request (cookie or header)
   */
  private extractSessionId(req: Request, res: Response): string | null {
    // Try header first if configured
    if (this.defaultConfig.useHeaderBased && this.defaultConfig.affinityHeader) {
      const headerValue = req.headers[this.defaultConfig.affinityHeader.toLowerCase()];
      if (headerValue && typeof headerValue === 'string') {
        return headerValue;
      }
    }

    // Try cookie
    if (req.cookies && req.cookies[this.defaultConfig.cookieName]) {
      return req.cookies[this.defaultConfig.cookieName];
    }

    // Try IP-based hashing if configured
    if (this.defaultConfig.useIpHashing && req.ip) {
      // Generate deterministic session ID based on IP
      return this.generateIpBasedSessionId(req.ip);
    }

    return null;
  }

  /**
   * Create a new session
   */
  private async createSession(req: Request, res: Response): Promise<string | null> {
    try {
      const sessionId = uuidv4();
      
      // Set in response
      this.setSessionAffinityResponse(req, res, sessionId);
      
      return sessionId;
    } catch (error) {
      this.logger.error('Failed to create session:', error);
      return null;
    }
  }

  /**
   * Set session affinity in response (cookie or header)
   */
  private setSessionAffinityResponse(req: Request, res: Response, sessionId: string): void {
    try {
      // Set header if configured
      if (this.defaultConfig.useHeaderBased && this.defaultConfig.affinityHeader) {
        res.setHeader(this.defaultConfig.affinityHeader, sessionId);
      }

      // Set cookie
      res.cookie(this.defaultConfig.cookieName, sessionId, {
        maxAge: this.defaultConfig.cookieMaxAge,
        httpOnly: true,
        secure: req.secure,
        sameSite: 'lax',
      });
    } catch (error) {
      this.logger.error('Failed to set session affinity response:', error);
    }
  }

  /**
   * Generate deterministic session ID based on IP
   */
  private generateIpBasedSessionId(ip: string): string {
    // Simple hash function for IP-based session ID
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `ip_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get node ID for session (in a real implementation, this would determine
   * which node should handle the request based on load balancing strategy)
   */
  private async getNodeIdForSession(req: Request): Promise<string> {
    try {
      // In a real implementation, we would determine the node ID based on:
      // 1. Current server instance ID
      // 2. Load balancing algorithm
      // 3. Node health status
      // 4. Geographic proximity
      
      // For now, we'll use a simple approach based on server info
      const serverId = process.env.HOSTNAME || process.env.SERVER_ID || 'node_1';
      const nodeId = `${serverId}_${process.pid}`;
      
      return nodeId;
    } catch (error) {
      this.logger.error('Failed to determine node ID:', error);
      return 'node_unknown';
    }
  }

  /**
   * Get session key for Redis storage
   */
  private getSessionKey(sessionId: string): string {
    return `session_affinity:${sessionId}`;
  }

  /**
   * Remove session affinity (logout/expire)
   */
  async removeSessionAffinity(sessionId: string): Promise<boolean> {
    if (!this.defaultConfig.enabled) {
      return true;
    }

    try {
      const sessionKey = this.getSessionKey(sessionId);
      return await this.redisClusterService.delete(sessionKey);
    } catch (error) {
      this.logger.error(`Failed to remove session affinity for ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get session affinity configuration
   */
  getConfig(): SessionAffinityConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Health check for session affinity service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; error?: string }> {
    try {
      if (!this.defaultConfig.enabled) {
        return { status: 'healthy', error: 'Session affinity disabled' };
      }

      // Test Redis connectivity
      const testSessionId = `health_check_${Date.now()}`;
      const testSessionInfo: SessionInfo = {
        sessionId: testSessionId,
        nodeId: 'test_node',
        createdAt: new Date(),
        lastAccessed: new Date(),
        expiresAt: new Date(Date.now() + 60000), // 1 minute
      };

      const sessionKey = this.getSessionKey(testSessionId);
      await this.redisClusterService.set(sessionKey, testSessionInfo, 60);
      const retrieved = await this.redisClusterService.get<SessionInfo>(sessionKey);
      await this.redisClusterService.delete(sessionKey);

      if (!retrieved || retrieved.sessionId !== testSessionId) {
        return { status: 'degraded', error: 'Session storage test failed' };
      }

      return { status: 'healthy' };
    } catch (error: any) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}