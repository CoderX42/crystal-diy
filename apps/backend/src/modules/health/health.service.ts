import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const mongo = this.connection.readyState === 1 ? 'ok' : 'down';
    let redis = 'down';
    try {
      redis = (await this.redis.ping()) === 'PONG' ? 'ok' : 'down';
    } catch {
      redis = 'down';
    }
    return {
      status: mongo === 'ok' && redis === 'ok' ? 'ok' : 'degraded',
      mongo,
      redis,
      checkedAt: new Date().toISOString(),
    };
  }
}
