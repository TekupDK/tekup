import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('diagnostics')
export class DiagnosticsController {
  @Get()
  @Public()
  get() {
    if (process.env.NODE_ENV === 'production') return { message: 'disabled' };
    return {
      now: new Date().toISOString(),
      node: process.version,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        HAS_DB: Boolean(process.env.DATABASE_URL),
        HAS_JWT: Boolean(process.env.JWT_SECRET),
      },
    };
  }
}

