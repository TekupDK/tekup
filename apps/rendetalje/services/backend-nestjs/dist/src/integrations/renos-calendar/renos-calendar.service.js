"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RenosCalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenosCalendarService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const integration_service_1 = require("../integration.service");
let RenosCalendarService = RenosCalendarService_1 = class RenosCalendarService {
    constructor(integrationService, configService) {
        this.integrationService = integrationService;
        this.configService = configService;
        this.logger = new common_1.Logger(RenosCalendarService_1.name);
        this.config = {
            baseUrl: this.configService.get('integrations.renosCalendar.url'),
            apiKey: this.configService.get('integrations.renosCalendar.apiKey'),
            timeout: 30000,
            retries: 2,
        };
        if (!this.config.baseUrl || !this.config.apiKey) {
            this.logger.warn('renos-calendar-mcp integration not configured properly');
        }
    }
    async createEvent(eventData) {
        try {
            this.logger.debug('Creating calendar event', { title: eventData.title });
            const response = await this.integrationService.post('renos-calendar', this.config, '/events', eventData);
            this.logger.log(`Calendar event created: ${response.id}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to create calendar event', error);
            throw new common_1.BadRequestException(`Failed to create calendar event: ${error.message}`);
        }
    }
    async updateEvent(eventId, eventData) {
        try {
            this.logger.debug('Updating calendar event', { eventId });
            const response = await this.integrationService.put('renos-calendar', this.config, `/events/${eventId}`, eventData);
            this.logger.log(`Calendar event updated: ${eventId}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to update calendar event', error);
            throw new common_1.BadRequestException(`Failed to update calendar event: ${error.message}`);
        }
    }
    async deleteEvent(eventId) {
        try {
            await this.integrationService.delete('renos-calendar', this.config, `/events/${eventId}`);
            this.logger.log(`Calendar event deleted: ${eventId}`);
        }
        catch (error) {
            this.logger.error('Failed to delete calendar event', error);
            throw new common_1.BadRequestException(`Failed to delete calendar event: ${error.message}`);
        }
    }
    async getEvents(startDate, endDate, teamMemberId) {
        try {
            let endpoint = `/events?start=${startDate}&end=${endDate}`;
            if (teamMemberId) {
                endpoint += `&teamMemberId=${teamMemberId}`;
            }
            const response = await this.integrationService.get('renos-calendar', this.config, endpoint);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get calendar events', error);
            throw new common_1.BadRequestException(`Failed to get calendar events: ${error.message}`);
        }
    }
    async checkAvailability(query) {
        try {
            this.logger.debug('Checking availability', {
                startDate: query.startDate,
                endDate: query.endDate,
                duration: query.duration
            });
            const response = await this.integrationService.post('renos-calendar', this.config, '/availability/check', query);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to check availability', error);
            throw new common_1.BadRequestException(`Failed to check availability: ${error.message}`);
        }
    }
    async detectConflicts(eventData) {
        try {
            this.logger.debug('Detecting conflicts for event', { title: eventData.title });
            const response = await this.integrationService.post('renos-calendar', this.config, '/conflicts/detect', eventData);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to detect conflicts', error);
            throw new common_1.BadRequestException(`Failed to detect conflicts: ${error.message}`);
        }
    }
    async resolveConflicts(eventData, preferences = {}) {
        try {
            this.logger.debug('Resolving conflicts for event', { title: eventData.title });
            const response = await this.integrationService.post('renos-calendar', this.config, '/conflicts/resolve', { event: eventData, preferences });
            return response;
        }
        catch (error) {
            this.logger.error('Failed to resolve conflicts', error);
            throw new common_1.BadRequestException(`Failed to resolve conflicts: ${error.message}`);
        }
    }
    async trackOvertime(teamMemberId, weekStartDate) {
        try {
            const response = await this.integrationService.get('renos-calendar', this.config, `/overtime/track?teamMemberId=${teamMemberId}&weekStart=${weekStartDate}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to track overtime', error);
            throw new common_1.BadRequestException(`Failed to track overtime: ${error.message}`);
        }
    }
    async getOvertimeAlerts(organizationId) {
        try {
            const response = await this.integrationService.get('renos-calendar', this.config, `/overtime/alerts?organizationId=${organizationId}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get overtime alerts', error);
            throw new common_1.BadRequestException(`Failed to get overtime alerts: ${error.message}`);
        }
    }
    async setOvertimeThreshold(teamMemberId, weeklyHours) {
        try {
            await this.integrationService.post('renos-calendar', this.config, '/overtime/threshold', { teamMemberId, weeklyHours });
            this.logger.log(`Overtime threshold set for team member: ${teamMemberId}`);
        }
        catch (error) {
            this.logger.error('Failed to set overtime threshold', error);
            throw new common_1.BadRequestException(`Failed to set overtime threshold: ${error.message}`);
        }
    }
    async getCustomerMemory(customerId) {
        try {
            const response = await this.integrationService.get('renos-calendar', this.config, `/customers/${customerId}/memory`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get customer memory', error);
            throw new common_1.BadRequestException(`Failed to get customer memory: ${error.message}`);
        }
    }
    async updateCustomerMemory(customerId, memoryData) {
        try {
            this.logger.debug('Updating customer memory', { customerId });
            const response = await this.integrationService.put('renos-calendar', this.config, `/customers/${customerId}/memory`, memoryData);
            this.logger.log(`Customer memory updated: ${customerId}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to update customer memory', error);
            throw new common_1.BadRequestException(`Failed to update customer memory: ${error.message}`);
        }
    }
    async analyzeCustomerPatterns(customerId) {
        try {
            const response = await this.integrationService.get('renos-calendar', this.config, `/customers/${customerId}/patterns`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to analyze customer patterns', error);
            throw new common_1.BadRequestException(`Failed to analyze customer patterns: ${error.message}`);
        }
    }
    async syncWithGoogleCalendar(teamMemberId, googleCalendarId) {
        try {
            await this.integrationService.post('renos-calendar', this.config, '/sync/google', { teamMemberId, googleCalendarId });
            this.logger.log(`Google Calendar sync enabled for team member: ${teamMemberId}`);
        }
        catch (error) {
            this.logger.error('Failed to sync with Google Calendar', error);
            throw new common_1.BadRequestException(`Failed to sync with Google Calendar: ${error.message}`);
        }
    }
    async syncWithOutlook(teamMemberId, outlookCalendarId) {
        try {
            await this.integrationService.post('renos-calendar', this.config, '/sync/outlook', { teamMemberId, outlookCalendarId });
            this.logger.log(`Outlook Calendar sync enabled for team member: ${teamMemberId}`);
        }
        catch (error) {
            this.logger.error('Failed to sync with Outlook Calendar', error);
            throw new common_1.BadRequestException(`Failed to sync with Outlook Calendar: ${error.message}`);
        }
    }
    async suggestOptimalSchedule(jobs, teamMembers, constraints = {}) {
        try {
            this.logger.debug('Requesting optimal schedule suggestion', {
                jobCount: jobs.length,
                teamMemberCount: teamMembers.length
            });
            const response = await this.integrationService.post('renos-calendar', this.config, '/schedule/optimize', { jobs, teamMembers, constraints });
            return response;
        }
        catch (error) {
            this.logger.error('Failed to suggest optimal schedule', error);
            throw new common_1.BadRequestException(`Failed to suggest optimal schedule: ${error.message}`);
        }
    }
    async calculateTravelTime(fromLocation, toLocation, travelMode = 'driving') {
        try {
            const response = await this.integrationService.post('renos-calendar', this.config, '/travel/calculate', { from: fromLocation, to: toLocation, mode: travelMode });
            return response;
        }
        catch (error) {
            this.logger.error('Failed to calculate travel time', error);
            throw new common_1.BadRequestException(`Failed to calculate travel time: ${error.message}`);
        }
    }
    async scheduleJob(jobData, teamMemberIds) {
        const eventData = {
            title: `${jobData.service_type} - ${jobData.job_number}`,
            description: jobData.special_instructions,
            startTime: jobData.scheduled_date,
            endTime: this.calculateEndTime(jobData.scheduled_date, jobData.estimated_duration),
            location: this.formatAddress(jobData.location),
            attendees: teamMemberIds,
            type: 'job',
            status: 'scheduled',
            metadata: {
                jobId: jobData.id,
                customerId: jobData.customer_id,
                serviceType: jobData.service_type,
            },
        };
        const conflicts = await this.detectConflicts(eventData);
        if (conflicts.hasConflict) {
            const highSeverityConflicts = conflicts.conflicts.filter(c => c.severity === 'high');
            if (highSeverityConflicts.length > 0) {
                throw new common_1.BadRequestException(`Cannot schedule job due to conflicts: ${highSeverityConflicts.map(c => c.message).join(', ')}`);
            }
        }
        return this.createEvent(eventData);
    }
    async rescheduleJob(jobId, newDateTime, duration) {
        const events = await this.getEvents(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
        const existingEvent = events.find(e => e.metadata?.jobId === jobId);
        if (!existingEvent) {
            throw new common_1.BadRequestException('Job event not found in calendar');
        }
        return this.updateEvent(existingEvent.id, {
            startTime: newDateTime,
            endTime: this.calculateEndTime(newDateTime, duration),
        });
    }
    async getTeamSchedule(teamMemberId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return this.getEvents(startOfDay.toISOString(), endOfDay.toISOString(), teamMemberId);
    }
    calculateEndTime(startTime, durationMinutes) {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        return end.toISOString();
    }
    formatAddress(address) {
        return `${address.street}, ${address.city}, ${address.postal_code} ${address.country}`;
    }
    async healthCheck() {
        try {
            await this.integrationService.get('renos-calendar', this.config, '/health');
            return true;
        }
        catch (error) {
            this.logger.error('renos-calendar-mcp health check failed', error);
            return false;
        }
    }
};
exports.RenosCalendarService = RenosCalendarService;
exports.RenosCalendarService = RenosCalendarService = RenosCalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService,
        config_1.ConfigService])
], RenosCalendarService);
//# sourceMappingURL=renos-calendar.service.js.map