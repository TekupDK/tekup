import { Module } from '@nestjs/common';
import { GoogleWorkspaceService } from './google-workspace.service';
// import { GmailParserService } from './gmail-parser.service'; // TODO: Implement
import { CalendarBookingService } from './calendar-booking.service';
import { BillyInvoicingService } from './billy-invoicing.service';
import { RendetaljeLeadProcessor } from './lead-processor.service';
import { RendetaljeHubController } from './rendetalje-hub.controller';

@Module({
  providers: [
    GoogleWorkspaceService,
    // GmailParserService, // TODO: Implement
    CalendarBookingService,
    BillyInvoicingService,
    RendetaljeLeadProcessor,
  ],
  controllers: [RendetaljeHubController],
  exports: [
    GoogleWorkspaceService,
    // GmailParserService, // TODO: Implement
    CalendarBookingService,
    BillyInvoicingService,
    RendetaljeLeadProcessor,
  ],
})
export class RendetaljeHubModule {}
