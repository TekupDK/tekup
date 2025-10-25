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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let TeamService = class TeamService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllWithFilters(filters) {
        const { isActive, skills, hiredAfter, hiredBefore, search, page = 1, limit = 10 } = filters;
        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (skills && skills.length > 0) {
            where.skills = {
                hasEvery: skills,
            };
        }
        if (hiredAfter || hiredBefore) {
            where.hireDate = {};
            if (hiredAfter)
                where.hireDate.gte = new Date(hiredAfter);
            if (hiredBefore)
                where.hireDate.lte = new Date(hiredBefore);
        }
        if (search) {
            where.OR = [
                { employeeId: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const total = await this.prisma.renosTeamMember.count({ where });
        const skip = (page - 1) * limit;
        const members = await this.prisma.renosTeamMember.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        const data = members.map(member => this.toTeamMemberEntity(member));
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
        };
    }
    async findById(id) {
        const member = await this.prisma.renosTeamMember.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Team member with ID ${id} not found`);
        }
        return this.toTeamMemberEntity(member);
    }
    async create(createTeamMemberDto) {
        const user = await this.prisma.renosUser.findUnique({
            where: { id: createTeamMemberDto.userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${createTeamMemberDto.userId} not found`);
        }
        const existingMember = await this.prisma.renosTeamMember.findUnique({
            where: { userId: createTeamMemberDto.userId },
        });
        if (existingMember) {
            throw new common_1.ConflictException('Team member already exists for this user');
        }
        const employeeId = createTeamMemberDto.employeeId || await this.generateEmployeeId();
        const member = await this.prisma.renosTeamMember.create({
            data: {
                userId: createTeamMemberDto.userId,
                employeeId,
                skills: createTeamMemberDto.skills,
                hourlyRate: createTeamMemberDto.hourlyRate,
                availability: createTeamMemberDto.availability,
                performanceMetrics: this.getDefaultPerformanceMetrics(),
                isActive: true,
                hireDate: createTeamMemberDto.hireDate ? new Date(createTeamMemberDto.hireDate) : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        return this.toTeamMemberEntity(member);
    }
    async update(id, updateTeamMemberDto) {
        await this.findById(id);
        if (updateTeamMemberDto.userId) {
            const existingMember = await this.prisma.renosTeamMember.findFirst({
                where: {
                    userId: updateTeamMemberDto.userId,
                    id: { not: id },
                },
            });
            if (existingMember) {
                throw new common_1.ConflictException('Another team member already exists for this user');
            }
        }
        const member = await this.prisma.renosTeamMember.update({
            where: { id },
            data: {
                ...(updateTeamMemberDto.userId && { userId: updateTeamMemberDto.userId }),
                ...(updateTeamMemberDto.employeeId && { employeeId: updateTeamMemberDto.employeeId }),
                ...(updateTeamMemberDto.skills && { skills: updateTeamMemberDto.skills }),
                ...(updateTeamMemberDto.hourlyRate !== undefined && { hourlyRate: updateTeamMemberDto.hourlyRate }),
                ...(updateTeamMemberDto.availability && { availability: updateTeamMemberDto.availability }),
                ...(updateTeamMemberDto.hireDate && { hireDate: new Date(updateTeamMemberDto.hireDate) }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        return this.toTeamMemberEntity(member);
    }
    async deactivate(id) {
        await this.findById(id);
        const member = await this.prisma.renosTeamMember.update({
            where: { id },
            data: { isActive: false },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        return this.toTeamMemberEntity(member);
    }
    async activate(id) {
        await this.findById(id);
        const member = await this.prisma.renosTeamMember.update({
            where: { id },
            data: { isActive: true },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        return this.toTeamMemberEntity(member);
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.renosTeamMember.delete({
            where: { id },
        });
    }
    async getTeamMemberSchedule(teamMemberId, dateFrom, dateTo) {
        await this.findById(teamMemberId);
        const where = { teamMemberId };
        if (dateFrom || dateTo) {
            where.startTime = {};
            if (dateFrom)
                where.startTime.gte = new Date(dateFrom);
            if (dateTo)
                where.startTime.lte = new Date(dateTo);
        }
        const timeEntries = await this.prisma.renosTimeEntry.findMany({
            where,
            orderBy: { startTime: 'asc' },
        });
        return timeEntries;
    }
    async getTeamMemberPerformance(teamMemberId) {
        const teamMember = await this.findById(teamMemberId);
        const timeEntries = await this.prisma.renosTimeEntry.findMany({
            where: {
                teamMemberId,
                endTime: { not: null },
            },
        });
        const totalHours = this.calculateTotalHours(timeEntries);
        return {
            currentMetrics: teamMember.performanceMetrics,
            totalHoursWorked: totalHours.regular,
            overtimeHours: totalHours.overtime,
            totalTimeEntries: timeEntries.length,
        };
    }
    async createTimeEntry(createTimeEntryDto) {
        const teamMember = await this.prisma.renosTeamMember.findUnique({
            where: { id: createTimeEntryDto.teamMemberId },
        });
        if (!teamMember) {
            throw new common_1.NotFoundException(`Team member with ID ${createTimeEntryDto.teamMemberId} not found`);
        }
        await this.checkTimeEntryOverlap(createTimeEntryDto);
        const timeEntry = await this.prisma.renosTimeEntry.create({
            data: {
                teamMemberId: createTimeEntryDto.teamMemberId,
                leadId: createTimeEntryDto.leadId,
                bookingId: createTimeEntryDto.bookingId,
                startTime: new Date(createTimeEntryDto.startTime),
                endTime: createTimeEntryDto.endTime ? new Date(createTimeEntryDto.endTime) : null,
                breakDuration: createTimeEntryDto.breakDuration,
                notes: createTimeEntryDto.notes,
                location: createTimeEntryDto.location,
            },
        });
        return this.toTimeEntryEntity(timeEntry);
    }
    async findTimeEntries(filters) {
        const { teamMemberId, leadId, bookingId, dateFrom, dateTo, page = 1, limit = 10 } = filters;
        const where = {};
        if (teamMemberId)
            where.teamMemberId = teamMemberId;
        if (leadId)
            where.leadId = leadId;
        if (bookingId)
            where.bookingId = bookingId;
        if (dateFrom || dateTo) {
            where.startTime = {};
            if (dateFrom)
                where.startTime.gte = new Date(dateFrom);
            if (dateTo)
                where.startTime.lte = new Date(dateTo);
        }
        const total = await this.prisma.renosTimeEntry.count({ where });
        const skip = (page - 1) * limit;
        const entries = await this.prisma.renosTimeEntry.findMany({
            where,
            skip,
            take: limit,
            orderBy: { startTime: 'desc' },
        });
        const data = entries.map(entry => this.toTimeEntryEntity(entry));
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
        };
    }
    async findTimeEntryById(id) {
        const entry = await this.prisma.renosTimeEntry.findUnique({
            where: { id },
        });
        if (!entry) {
            throw new common_1.NotFoundException(`Time entry with ID ${id} not found`);
        }
        return this.toTimeEntryEntity(entry);
    }
    async updateTimeEntry(id, updateTimeEntryDto) {
        await this.findTimeEntryById(id);
        const entry = await this.prisma.renosTimeEntry.update({
            where: { id },
            data: {
                ...(updateTimeEntryDto.startTime && { startTime: new Date(updateTimeEntryDto.startTime) }),
                ...(updateTimeEntryDto.endTime && { endTime: new Date(updateTimeEntryDto.endTime) }),
                ...(updateTimeEntryDto.breakDuration !== undefined && { breakDuration: updateTimeEntryDto.breakDuration }),
                ...(updateTimeEntryDto.notes && { notes: updateTimeEntryDto.notes }),
                ...(updateTimeEntryDto.location && { location: updateTimeEntryDto.location }),
            },
        });
        return this.toTimeEntryEntity(entry);
    }
    async deleteTimeEntry(id) {
        await this.findTimeEntryById(id);
        await this.prisma.renosTimeEntry.delete({
            where: { id },
        });
    }
    async generateEmployeeId() {
        const year = new Date().getFullYear();
        const count = await this.prisma.renosTeamMember.count();
        return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    getDefaultPerformanceMetrics() {
        return {
            jobsCompleted: 0,
            averageJobDuration: 0,
            averageQualityScore: 0,
            customerSatisfaction: 0,
            punctualityScore: 0,
            efficiencyRating: 0,
            totalHoursWorked: 0,
            overtimeHours: 0,
        };
    }
    async checkTimeEntryOverlap(createTimeEntryDto) {
        const startTime = new Date(createTimeEntryDto.startTime);
        const endTime = createTimeEntryDto.endTime ? new Date(createTimeEntryDto.endTime) : null;
        if (!endTime)
            return;
        const overlapping = await this.prisma.renosTimeEntry.findFirst({
            where: {
                teamMemberId: createTimeEntryDto.teamMemberId,
                OR: [
                    {
                        AND: [
                            { startTime: { lte: startTime } },
                            { endTime: { gte: startTime } },
                        ],
                    },
                    {
                        AND: [
                            { startTime: { lte: endTime } },
                            { endTime: { gte: endTime } },
                        ],
                    },
                ],
            },
        });
        if (overlapping) {
            throw new common_1.ConflictException('Time entry overlaps with an existing entry');
        }
    }
    calculateTotalHours(timeEntries) {
        let totalMinutes = 0;
        timeEntries.forEach(entry => {
            if (entry.startTime && entry.endTime) {
                const start = new Date(entry.startTime);
                const end = new Date(entry.endTime);
                const minutes = (end.getTime() - start.getTime()) / 60000;
                totalMinutes += minutes - (entry.breakDuration || 0);
            }
        });
        const totalHours = totalMinutes / 60;
        const regularHours = Math.min(totalHours, 160);
        const overtimeHours = Math.max(0, totalHours - 160);
        return { regular: regularHours, overtime: overtimeHours };
    }
    toTeamMemberEntity(member) {
        return {
            id: member.id,
            userId: member.userId,
            employeeId: member.employeeId,
            skills: member.skills,
            hourlyRate: member.hourlyRate,
            availability: member.availability,
            performanceMetrics: member.performanceMetrics,
            isActive: member.isActive,
            hireDate: member.hireDate,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
        };
    }
    toTimeEntryEntity(entry) {
        return {
            id: entry.id,
            teamMemberId: entry.teamMemberId,
            leadId: entry.leadId,
            bookingId: entry.bookingId,
            startTime: entry.startTime,
            endTime: entry.endTime,
            breakDuration: entry.breakDuration,
            notes: entry.notes,
            location: entry.location,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
        };
    }
};
exports.TeamService = TeamService;
exports.TeamService = TeamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamService);
//# sourceMappingURL=team.service.js.map