import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/auth/login/route';

// Mock the database/auth service
jest.mock('@/lib/auth', () => ({
  validateCredentials: jest.fn(),
  generateToken: jest.fn(),
}));

describe('/api/auth/login', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 200 with token for valid credentials', async () => {
      const { validateCredentials, generateToken } = require('@/lib/auth');
      
      validateCredentials.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      
      generateToken.mockReturnValue('mock-jwt-token');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('token', 'mock-jwt-token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe('test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const { validateCredentials } = require('@/lib/auth');
      
      validateCredentials.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 400 for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET', () => {
    it('should return 405 Method Not Allowed', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login');
      const response = await GET(request);

      expect(response.status).toBe(405);
    });
  });
});