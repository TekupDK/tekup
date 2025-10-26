import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../src/health/health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health status', () => {
    const health = service.getHealthStatus();
    expect(health).toHaveProperty('status', 'ok');
    expect(health).toHaveProperty('version');
    expect(health).toHaveProperty('uptime');
  });
});