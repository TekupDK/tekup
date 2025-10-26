import { MetricsMiddleware } from './metrics.middleware';
import { MetricsService } from './metrics.service';

describe('MetricsMiddleware', () => {
  let middleware: MetricsMiddleware;
  let metricsService: any;

  beforeEach(() => {
    metricsService = {
      increment: jest.fn(),
      histogram: jest.fn(),
    };
    middleware = new MetricsMiddleware(metricsService);
  });

  describe('use', () => {
    it('should record metrics on response finish', () => {
      const req = {
        method: 'GET',
        path: '/leads/123',
        route: { path: '/leads/:id' },
      } as any;
      const res = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
        }),
      } as any;
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
  });

  describe('normalizeRoute', () => {
    it('should normalize route paths', () => {
      // Test the actual implementation of normalizeRoute
      expect(middleware['normalizeRoute']('/leads/123')).toBe('/leads/:id/');
      expect(middleware['normalizeRoute']('/leads/123/')).toBe('/leads/:id/');
      // Test edge cases
      expect(middleware['normalizeRoute']('/leads')).toBe('/leads');
      expect(middleware['normalizeRoute']('/')).toBe('/');
    });
  });
});