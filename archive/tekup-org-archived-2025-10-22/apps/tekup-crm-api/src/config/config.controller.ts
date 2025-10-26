import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { loadConfig } from '@tekup/config';

@Controller('config')
export class ConfigController {
  @Get()
  @Public()
  getConfig() {
    if (process.env.NODE_ENV === 'production') {
      return { message: 'Not available in production' };
    }
    const { redacted } = loadConfig();
    return redacted;
  }
}

