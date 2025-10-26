import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API responses for testing
const handlers = [
  // FoodTruck OS API mocks
  rest.get('http://localhost:3010/api/v1/menu/items', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          name: 'Burger',
          description: 'Klassisk burger',
          price: 85,
          category: 'Main',
          allergens: ['gluten'],
          ingredients: ['beef', 'bun', 'lettuce'],
          available: true
        },
        {
          id: '2',
          name: 'Pommes Frites',
          description: 'Sprøde pommes frites',
          price: 35,
          category: 'Sides',
          allergens: [],
          ingredients: ['potatoes', 'salt'],
          available: true
        }
      ])
    );
  }),

  rest.post('http://localhost:3010/api/v1/pos/sales', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'sale-123',
        receiptNumber: 'R-2024-001',
        totalAmount: 120,
        vatAmount: 24,
        timestamp: new Date().toISOString()
      })
    );
  }),

  // RendetaljeOS API mocks
  rest.get('http://localhost:3011/api/v1/teams', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'team-1',
          name: 'Team København',
          baseLocation: 'København',
          status: 'ACTIVE',
          members: []
        }
      ])
    );
  }),

  rest.post('http://localhost:3011/api/v1/scheduling/optimize', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        optimizedRoute: {
          totalDistance: 25.5,
          estimatedDuration: 180,
          stops: []
        }
      })
    );
  }),

  // EssenzaPro API mocks
  rest.get('http://localhost:3012/api/v1/services', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'service-1',
          name: 'Manicure',
          description: 'Professionel manicure',
          price: 350,
          duration: 60,
          category: 'Nail Care'
        }
      ])
    );
  }),

  rest.post('http://localhost:3012/api/v1/bookings', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'booking-123',
        clientId: 'client-1',
        serviceId: 'service-1',
        dateTime: new Date().toISOString(),
        status: 'CONFIRMED'
      })
    );
  }),

  // MCP Studio API mocks
  rest.get('http://localhost:3013/api/v1/mcp/projects', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'project-1',
          name: 'My MCP Server',
          description: 'Custom MCP server implementation',
          status: 'DEVELOPMENT'
        }
      ])
    );
  }),

  rest.post('http://localhost:3013/api/v1/mcp/projects', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'project-new',
        name: req.body?.name || 'New Project',
        status: 'DEVELOPMENT'
      })
    );
  }),
];

export const server = setupServer(...handlers);
