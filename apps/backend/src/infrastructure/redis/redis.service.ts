import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      port: this.config.get<number>('REDIS_PORT', 6379),
    });
  }

  getClient() {
    return this.client;
  }

  async ping() {
    if (this.client.status === 'wait') await this.client.connect();
    return this.client.ping();
  }

  async onModuleDestroy() {
    if (this.client.status !== 'end') await this.client.quit();
  }
}
