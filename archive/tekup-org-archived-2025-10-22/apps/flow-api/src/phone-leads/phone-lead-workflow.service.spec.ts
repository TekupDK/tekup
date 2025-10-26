import { Test, TestingModule } from '@nestjs/testing';
import { PhoneLeadWorkflowService } from './phone-lead-workflow.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SMSService } from '../sms/sms.service.js';
import { LeadService } from '../lead/lead.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLoggerService } from '../common/logging/structured-logger.service.js';

describe('PhoneLeadWorkflowService', () => {
  let service: PhoneLeadWorkflowService;
  let prismaService: PrismaService;
  let smsService: SMSService;

  const mockPrismaService = {
    lead: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    leadEvent: {
      create: jest.fn()
    },
    smsTracking: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    }
  };

  const mockSMSService = {
    sendPhoneLeadSMS: jest.fn(),
    getSMSAnalytics: jest.fn()
  };

  const mockMetricsService = {
    increment: jest.fn()
  };

  const mockStructuredLoggerService = {
    logBusinessEvent: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhoneLeadWorkflowService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SMSService, useValue: mockSMSService },
        { provide: LeadService, useValue: {} },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: StructuredLoggerService, useValue: mockStructuredLoggerService }
      ],
    }).compile();

    service = module.get<PhoneLeadWorkflowService>(PhoneLeadWorkflowService);
    prismaService = module.get<PrismaService>(PrismaService);
    smsService = module.get<SMSService>(SMSService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processPhoneLead', () => {
    it('should process phone lead and send SMS', async () => {
      const leadId = 'lead-123';
      const tenantId = 'tenant-123';
      const mockLead = {
        id: leadId,
        tenantId,
        source: 'leadpoint',
        payload: {
          lead_type: 'phone_call',
          phone: '+4512345678'
        }
      };

      mockPrismaService.lead.findFirst.mockResolvedValue(mockLead);
      mockPrismaService.smsTracking.findFirst.mockResolvedValue(null);
      mockSMSService.sendPhoneLeadSMS.mockResolvedValue({
        leadId,
        tenantId,
        phoneNumber: '+4512345678',
        messageId: 'msg-123',
        trackingUrl: 'https://api.tekup.dk/sms/track/tracking-123',
        sentAt: new Date()
      });
      mockPrismaService.lead.update.mockResolvedValue({ ...mockLead, status: 'CONTACTED' });
      mockPrismaService.leadEvent.create.mockResolvedValue({});

      await service.processPhoneLead(leadId, tenantId);

      expect(mockPrismaService.lead.findFirst).toHaveBeenCalledWith({
        where: { id: leadId, tenantId }
      });
      expect(mockSMSService.sendPhoneLeadSMS).toHaveBeenCalledWith(leadId, tenantId, '+4512345678');
      expect(mockPrismaService.lead.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: {
          status: 'CONTACTED',
          payload: {
            ...mockLead.payload,
            sms_sent: true,
            sms_sent_at: expect.any(String)
          }
        }
      });
      expect(mockPrismaService.leadEvent.create).toHaveBeenCalledWith({
        data: {
          leadId,
          fromStatus: 'NEW',
          toStatus: 'CONTACTED',
          notes: 'SMS sent automatically for phone call lead',
          metadata: {
            action: 'sms_sent',
            phone: '+4512345678',
            lead_type: 'phone_call'
          }
        }
      });
    });

    it('should skip processing if lead is not found', async () => {
      const leadId = 'lead-123';
      const tenantId = 'tenant-123';

      mockPrismaService.lead.findFirst.mockResolvedValue(null);

      await service.processPhoneLead(leadId, tenantId);

      expect(mockSMSService.sendPhoneLeadSMS).not.toHaveBeenCalled();
    });

    it('should skip processing if lead is not a phone call lead', async () => {
      const leadId = 'lead-123';
      const tenantId = 'tenant-123';
      const mockLead = {
        id: leadId,
        tenantId,
        source: 'leadpoint',
        payload: {
          lead_type: 'standard',
          phone: '+4512345678'
        }
      };

      mockPrismaService.lead.findFirst.mockResolvedValue(mockLead);

      await service.processPhoneLead(leadId, tenantId);

      expect(mockSMSService.sendPhoneLeadSMS).not.toHaveBeenCalled();
    });

    it('should skip processing if SMS already sent', async () => {
      const leadId = 'lead-123';
      const tenantId = 'tenant-123';
      const mockLead = {
        id: leadId,
        tenantId,
        source: 'leadpoint',
        payload: {
          lead_type: 'phone_call',
          phone: '+4512345678'
        }
      };

      mockPrismaService.lead.findFirst.mockResolvedValue(mockLead);
      mockPrismaService.smsTracking.findFirst.mockResolvedValue({
        id: 'sms-123',
        leadId,
        sentAt: new Date()
      });

      await service.processPhoneLead(leadId, tenantId);

      expect(mockSMSService.sendPhoneLeadSMS).not.toHaveBeenCalled();
    });
  });

  describe('processPendingPhoneLeads', () => {
    it('should process all pending phone leads', async () => {
      const tenantId = 'tenant-123';
      const mockLeads = [
        {
          id: 'lead-1',
          tenantId,
          source: 'leadpoint',
          status: 'NEW',
          payload: { lead_type: 'phone_call', phone: '+4512345678' }
        },
        {
          id: 'lead-2',
          tenantId,
          source: 'leadpoint',
          status: 'NEW',
          payload: { lead_type: 'phone_call', phone: '+4598765432' }
        }
      ];

      mockPrismaService.lead.findMany.mockResolvedValue(mockLeads);
      mockPrismaService.lead.findFirst.mockResolvedValue(mockLeads[0]);
      mockPrismaService.smsTracking.findFirst.mockResolvedValue(null);
      mockSMSService.sendPhoneLeadSMS.mockResolvedValue({});
      mockPrismaService.lead.update.mockResolvedValue({});
      mockPrismaService.leadEvent.create.mockResolvedValue({});

      const result = await service.processPendingPhoneLeads(tenantId);

      expect(result.processed).toBe(2);
      expect(result.errors).toBe(0);
      expect(mockSMSService.sendPhoneLeadSMS).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPhoneLeadStats', () => {
    it('should return phone lead statistics', async () => {
      const tenantId = 'tenant-123';
      const mockSMSAnalytics = {
        totalSent: 10,
        totalClicked: 5,
        totalConverted: 2,
        clickRate: 50,
        conversionRate: 20,
        clickToConversionRate: 40
      };

      mockPrismaService.lead.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // contacted
        .mockResolvedValueOnce(2); // converted
      mockSMSService.getSMSAnalytics.mockResolvedValue(mockSMSAnalytics);

      const result = await service.getPhoneLeadStats(tenantId);

      expect(result).toEqual({
        totalPhoneLeads: 10,
        contactedPhoneLeads: 5,
        convertedPhoneLeads: 2,
        contactRate: 50,
        conversionRate: 20,
        smsAnalytics: mockSMSAnalytics
      });
    });
  });
});