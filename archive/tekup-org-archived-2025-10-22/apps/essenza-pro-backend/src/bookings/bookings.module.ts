import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DanishBookingSystemService } from './danish-booking-system.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BookingsController],
  providers: [DanishBookingSystemService],
  exports: [DanishBookingSystemService],
})
export class BookingsModule {}
