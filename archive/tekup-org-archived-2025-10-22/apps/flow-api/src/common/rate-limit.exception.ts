import { HttpException, HttpStatus } from '@nestjs/common';

export class RateLimitException extends HttpException {
  constructor() {
    super({ error: 'rate_limited', message: 'Too many requests' }, HttpStatus.TOO_MANY_REQUESTS);
  }
}