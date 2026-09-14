import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { ok: true, service: 'smomo-api', time: new Date().toISOString() };
  }
}
