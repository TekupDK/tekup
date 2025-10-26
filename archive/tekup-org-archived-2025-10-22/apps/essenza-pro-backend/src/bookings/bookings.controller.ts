import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TekUpAuthGuard, CurrentUser, CurrentTenant } from '@tekup/sso';
import { DanishBookingSystemService, BookingRequest, BookingModification } from './danish-booking-system.service';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: DanishBookingSystemService) {}

  @Post()
  @ApiOperation({ summary: 'Create new booking with Danish consumer protection' })
  async createBooking(
    @Body() request: BookingRequest,
    @CurrentTenant() tenant: any
  ) {
    return this.bookingsService.createBooking(request);
  }

  @Patch(':bookingId')
  @ApiOperation({ summary: 'Modify booking with Danish consumer law compliance' })
  async modifyBooking(
    @Param('bookingId') bookingId: string,
    @Body() modifications: BookingModification,
    @CurrentTenant() tenant: any
  ) {
    return this.bookingsService.modifyBooking(bookingId, modifications);
  }

  @Delete(':bookingId')
  @ApiOperation({ summary: 'Cancel booking according to Danish consumer protection' })
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancellationData: { reason: string },
    @CurrentTenant() tenant: any
  ) {
    return this.bookingsService.cancelBooking(bookingId, cancellationData.reason);
  }

  @Get('availability/:serviceId')
  @ApiOperation({ summary: 'Get availability calendar with Danish holidays' })
  async getAvailability(
    @Param('serviceId') serviceId: string,
    @Body() dateRange: { startDate: string; endDate: string },
    @CurrentTenant() tenant: any
  ) {
    return this.bookingsService.getAvailability(
      serviceId, 
      new Date(dateRange.startDate), 
      new Date(dateRange.endDate)
    );
  }

  @Post('reminders/send')
  @ApiOperation({ summary: 'Send appointment reminders in Danish' })
  async sendReminders(@CurrentTenant() tenant: any) {
    return this.bookingsService.sendAppointmentReminders();
  }
}
