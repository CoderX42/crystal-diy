import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  check() {
    return this.service.check();
  }
}
