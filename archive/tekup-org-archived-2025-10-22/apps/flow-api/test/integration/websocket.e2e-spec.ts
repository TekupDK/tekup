import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/modules/app.module';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { WebSocketGatewayImplementation } from '../../src/websocket/websocket.gateway.js';
import { JwtService } from '@nestjs/jwt';
import { io, Socket } from 'socket.io-client';
import * as request from 'supertest';

describe('WebSocket Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let wsGateway: WebSocketGatewayImplementation;
  
  const testTenantId = 'ws-test-tenant';
  const testApiKey = 'ws-test-api-key';
  const testUserId = 'ws-test-user';

  let clientSocket: Socket;
  let serverAddress: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    wsGateway = app.get<WebSocketGatewayImplementation>(WebSocketGatewayImplementation);

    await app.init();
    await app.listen(0); // Use random port

    const server = app.getHttpServer();
    const address = server.address();
    serverAddress = `http://localhost:${address.port}`;

    await setupWebSocketTestData();
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    await cleanupWebSocketTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Create a new client socket for each test
    const token = generateTestToken();
    
    clientSocket = io(`${serverAddress}/notifications`, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      clientSocket.on('connect', resolve);
      clientSocket.on('connect_error', reject);
      
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  describe('WebSocket Connection', () => {
    it('should establish connection with valid token', async () => {
      expect(clientSocket.connected).toBe(true);
      
      // Should receive welcome message
      const welcomeMessage = await new Promise((resolve) => {
        clientSocket.on('connected', resolve);
      });

      expect(welcomeMessage).toHaveProperty('message');
      expect(welcomeMessage).toHaveProperty('tenantId', testTenantId);
    });

    it('should reject connection with invalid token', async () => {
      const invalidSocket = io(`${serverAddress}/notifications`, {
        auth: {
          token: 'invalid-token',
        },
        transports: ['websocket'],
      });

      await expect(new Promise((resolve, reject) => {
        invalidSocket.on('connect', resolve);
        invalidSocket.on('connect_error', reject);
        
        setTimeout(() => reject(new Error('Should have been rejected')), 2000);
      })).rejects.toThrow();

      invalidSocket.disconnect();
    });

    it('should track connection statistics', () => {
      const stats = wsGateway.getConnectionStats();
      
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('connectionsByTenant');
      expect(stats.totalConnections).toBeGreaterThan(0);
      expect(stats.connectionsByTenant[testTenantId]).toBeGreaterThan(0);
    });
  });

  describe('Channel Subscription', () => {
    it('should subscribe to channels', async () => {
      const channels = ['lead:updates', 'status:changes'];
      
      clientSocket.emit('subscribe', { channels });

      const response = await new Promise((resolve) => {
        clientSocket.on('subscribed', resolve);
      });

      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('channels', channels);
    });

    it('should unsubscribe from channels', async () => {
      const channels = ['lead:updates'];
      
      // First subscribe
      clientSocket.emit('subscribe', { channels });
      await new Promise((resolve) => {
        clientSocket.on('subscribed', resolve);
      });

      // Then unsubscribe
      clientSocket.emit('unsubscribe', { channels });

      const response = await new Promise((resolve) => {
        clientSocket.on('unsubscribed', resolve);
      });

      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('channels', channels);
    });
  });

  describe('Real-time Notifications', () => {
    beforeEach(async () => {
      // Subscribe to lead updates
      clientSocket.emit('subscribe', { channels: ['lead:updates'] });
      await new Promise((resolve) => {
        clientSocket.on('subscribed', resolve);
      });
    });

    it('should receive lead update notifications', async () => {
      // Create a lead via HTTP API
      const createResponse = await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', testApiKey)
        .send({
          name: 'WebSocket Test Lead',
          email: 'wstest@example.com',
          source: 'test',
        })
        .expect(201);

      const leadId = createResponse.body.id;

      // Listen for WebSocket notification
      const notificationPromise = new Promise((resolve) => {
        clientSocket.on('lead.update', resolve);
      });

      // Update the lead
      await request(app.getHttpServer())
        .patch(`/leads/${leadId}`)
        .set('x-tenant-key', testApiKey)
        .send({ name: 'Updated WebSocket Test Lead' })
        .expect(200);

      // Should receive notification
      const notification = await notificationPromise;
      
      expect(notification).toHaveProperty('type', 'lead.update');
      expect(notification).toHaveProperty('data');
      expect(notification.data).toHaveProperty('leadId', leadId);
      expect(notification).toHaveProperty('tenantId', testTenantId);
    });

    it('should receive status change notifications', async () => {
      // Subscribe to status changes
      clientSocket.emit('subscribe', { channels: ['status:changes'] });
      await new Promise((resolve) => {
        clientSocket.on('subscribed', resolve);
      });

      // Create a lead
      const createResponse = await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', testApiKey)
        .send({
          name: 'Status Test Lead',
          email: 'statustest@example.com',
          source: 'test',
        })
        .expect(201);

      const leadId = createResponse.body.id;

      // Listen for status change notification
      const statusChangePromise = new Promise((resolve) => {
        clientSocket.on('lead.status.change', resolve);
      });

      // Change lead status
      await request(app.getHttpServer())
        .patch(`/leads/${leadId}/status`)
        .set('x-tenant-key', testApiKey)
        .send({ status: 'CONTACTED' })
        .expect(200);

      // Should receive status change notification
      const notification = await statusChangePromise;
      
      expect(notification).toHaveProperty('type', 'lead.status.change');
      expect(notification).toHaveProperty('data');
      expect(notification.data).toHaveProperty('leadId', leadId);
      expect(notification.data).toHaveProperty('toStatus', 'CONTACTED');
    });

    it('should only receive notifications for subscribed tenant', async () => {
      // Create another tenant and lead
      const otherTenantId = 'other-ws-tenant';
      const otherApiKey = 'other-ws-api-key';

      await prisma.tenant.create({
        data: {
          id: otherTenantId,
          slug: 'other-ws-tenant',
          name: 'Other WebSocket Tenant',
        },
      });

      await prisma.apiKey.create({
        data: {
          key: otherApiKey,
          tenantId: otherTenantId,
        },
      });

      // Set up notification listener
      let notificationReceived = false;
      clientSocket.on('lead.update', () => {
        notificationReceived = true;
      });

      // Create lead for other tenant
      await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', otherApiKey)
        .send({
          name: 'Other Tenant Lead',
          email: 'othertenant@example.com',
          source: 'test',
        })
        .expect(201);

      // Wait a bit to see if notification is received
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should not receive notification for other tenant
      expect(notificationReceived).toBe(false);

      // Cleanup
      await prisma.lead.deleteMany({ where: { tenantId: otherTenantId } });
      await prisma.apiKey.deleteMany({ where: { key: otherApiKey } });
      await prisma.tenant.deleteMany({ where: { id: otherTenantId } });
    });
  });

  describe('Connection Management', () => {
    it('should handle multiple concurrent connections', async () => {
      const connections: Socket[] = [];
      const connectionCount = 5;

      try {
        // Create multiple connections
        for (let i = 0; i < connectionCount; i++) {
          const token = generateTestToken();
          const socket = io(`${serverAddress}/notifications`, {
            auth: { token },
            transports: ['websocket'],
          });

          await new Promise<void>((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
          });

          connections.push(socket);
        }

        // Verify all connections are tracked
        const stats = wsGateway.getConnectionStats();
        expect(stats.totalConnections).toBeGreaterThanOrEqual(connectionCount);

      } finally {
        // Clean up connections
        connections.forEach(socket => socket.disconnect());
      }
    });

    it('should handle connection drops gracefully', async () => {
      const initialStats = wsGateway.getConnectionStats();
      
      // Disconnect the client
      clientSocket.disconnect();

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalStats = wsGateway.getConnectionStats();
      expect(finalStats.totalConnections).toBeLessThan(initialStats.totalConnections);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid subscription requests', async () => {
      let errorReceived = false;
      
      clientSocket.on('error', () => {
        errorReceived = true;
      });

      // Send invalid subscription
      clientSocket.emit('subscribe', { invalid: 'data' });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should handle gracefully without crashing
      expect(clientSocket.connected).toBe(true);
    });

    it('should handle message sending to disconnected clients', async () => {
      const leadId = 'test-lead-123';
      
      // Disconnect client
      clientSocket.disconnect();

      // Try to send notification (should not throw error)
      expect(() => {
        wsGateway.sendLeadUpdate(testTenantId, leadId, {
          name: 'Test Update',
        });
      }).not.toThrow();
    });
  });

  // Helper functions
  function generateTestToken(): string {
    return jwtService.sign({
      sub: testUserId,
      tenantId: testTenantId,
    });
  }

  async function setupWebSocketTestData() {
    // Create test tenant
    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId,
        slug: 'ws-test-tenant',
        name: 'WebSocket Test Tenant',
      },
    });

    // Create test API key
    await prisma.apiKey.upsert({
      where: { key: testApiKey },
      update: {},
      create: {
        key: testApiKey,
        tenantId: testTenantId,
      },
    });
  }

  async function cleanupWebSocketTestData() {
    await prisma.lead.deleteMany({
      where: { tenantId: testTenantId },
    });
    
    await prisma.apiKey.deleteMany({
      where: { key: testApiKey },
    });
    
    await prisma.tenant.deleteMany({
      where: { id: testTenantId },
    });
  }
});