import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TekUpAuthGuard, CurrentUser, CurrentTenant } from '@tekup/sso';
import { DanishPOSService, SaleRequest, BookingModification } from './danish-pos.service';

@ApiTags('pos')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('pos')
export class POSController {
  constructor(private readonly posService: DanishPOSService) {}

  @Post('sales')
  @ApiOperation({ summary: 'Process sale with Danish VAT compliance' })
  async processSale(
    @Body() saleRequest: SaleRequest,
    @CurrentTenant() tenant: any,
    @CurrentUser() user: any
  ) {
    return this.posService.processSale(saleRequest);
  }

  @Get('sales/reports/:truckId/:date')
  @ApiOperation({ summary: 'Generate daily sales report' })
  async getDailySalesReport(
    @Param('truckId') truckId: string,
    @Param('date') date: string,
    @CurrentTenant() tenant: any
  ) {
    return this.posService.generateDailySalesReport(truckId, new Date(date));
  }

  @Post('refunds/:saleId')
  @ApiOperation({ summary: 'Process refund with Danish VAT reversal' })
  async processRefund(
    @Param('saleId') saleId: string,
    @Body() refundData: { reason: string },
    @CurrentTenant() tenant: any
  ) {
    return this.posService.processRefund(saleId, refundData.reason);
  }
}
