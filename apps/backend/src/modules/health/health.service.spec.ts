import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports ok when mongo is connected and redis responds pong', async () => {
    const service = new HealthService({ readyState: 1 } as any, { ping: jest.fn().mockResolvedValue('PONG') } as any);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.mongo).toBe('ok');
    expect(result.redis).toBe('ok');
  });

  it('reports degraded when redis ping fails', async () => {
    const service = new HealthService({ readyState: 1 } as any, { ping: jest.fn().mockRejectedValue(new Error('down')) } as any);

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.mongo).toBe('ok');
    expect(result.redis).toBe('down');
  });
});
