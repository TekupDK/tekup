import { IntegrationService } from './integration.service';
import { TekupBillyService } from './tekup-billy/tekup-billy.service';
import { TekupVaultService } from './tekup-vault/tekup-vault.service';
import { RenosCalendarService } from './renos-calendar/renos-calendar.service';
export declare class IntegrationsController {
    private readonly integrationService;
    private readonly tekupBillyService;
    private readonly tekupVaultService;
    private readonly renosCalendarService;
    constructor(integrationService: IntegrationService, tekupBillyService: TekupBillyService, tekupVaultService: TekupVaultService, renosCalendarService: RenosCalendarService);
    getHealthStatus(): Promise<{
        overall: Record<string, any>;
        services: {
            'tekup-billy': any;
            'tekup-vault': any;
            'renos-calendar': any;
        };
    }>;
    searchBillyCustomers(query: string): Promise<import("./tekup-billy/tekup-billy.service").BillyCustomer[]>;
    getBillyProducts(): Promise<import("./tekup-billy/tekup-billy.service").BillyProduct[]>;
    createBillyInvoice(invoiceData: any): Promise<import("./tekup-billy/tekup-billy.service").BillyInvoice>;
    getBillyInvoice(id: string): Promise<import("./tekup-billy/tekup-billy.service").BillyInvoice>;
    sendBillyInvoice(id: string, email?: string): Promise<void>;
    getBillyFinancialReport(dateFrom: string, dateTo: string): Promise<any>;
    handleBillyWebhook(webhookData: any): Promise<void>;
    searchVault(searchQuery: any): Promise<import("./tekup-vault/tekup-vault.service").SearchResult[]>;
    getVaultFAQs(category?: string): Promise<import("./tekup-vault/tekup-vault.service").VaultDocument[]>;
    getVaultProcedures(category?: string): Promise<import("./tekup-vault/tekup-vault.service").VaultDocument[]>;
    createVaultDocument(documentData: any): Promise<import("./tekup-vault/tekup-vault.service").VaultDocument>;
    getTrainingMaterials(): Promise<import("./tekup-vault/tekup-vault.service").VaultDocument[]>;
    getVaultSearchAnalytics(dateFrom: string, dateTo: string): Promise<any>;
    checkCalendarAvailability(query: any): Promise<import("./renos-calendar/renos-calendar.service").TimeSlot[]>;
    detectCalendarConflicts(eventData: any): Promise<import("./renos-calendar/renos-calendar.service").ConflictDetection>;
    getCalendarEvents(startDate: string, endDate: string, teamMemberId?: string): Promise<import("./renos-calendar/renos-calendar.service").CalendarEvent[]>;
    getOvertimeAlerts(req: any): Promise<import("./renos-calendar/renos-calendar.service").OvertimeAlert[]>;
    getCustomerMemory(customerId: string): Promise<import("./renos-calendar/renos-calendar.service").CustomerMemory>;
    getOptimalSchedule(scheduleData: any): Promise<any>;
    calculateTravelTime(travelData: any): Promise<{
        duration: number;
        distance: number;
    }>;
    createInvoiceFromJob(jobId: string, jobData: any): Promise<import("./tekup-billy/tekup-billy.service").BillyInvoice>;
    scheduleJob(jobId: string, scheduleData: any): Promise<import("./renos-calendar/renos-calendar.service").CalendarEvent>;
    searchCustomerSupport(query: string): Promise<import("./tekup-vault/tekup-vault.service").SearchResult[]>;
    searchCleaningProcedures(query: string): Promise<import("./tekup-vault/tekup-vault.service").SearchResult[]>;
}
