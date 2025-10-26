/**
 * Cleaning Plan Service
 * 
 * Handles creation and management of cleaning plans with task checklists
 * Part of Phase 1 - Sprint 1: Rengøringsplaner
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

const prisma = new PrismaClient();

// Types
export interface CleaningTask {
    name: string;
    description?: string;
    category: string;
    estimatedTime: number; // minutes
    isRequired?: boolean;
    pricePerTask?: number;
    sortOrder?: number;
}

export interface CreateCleaningPlanInput {
    customerId: string;
    name: string;
    description?: string;
    serviceType: string;
    frequency?: "once" | "weekly" | "biweekly" | "monthly";
    isTemplate?: boolean;
    squareMeters?: number;
    address?: string;
    notes?: string;
    tasks: CleaningTask[];
}

export interface UpdateCleaningPlanInput {
    name?: string;
    description?: string;
    frequency?: string;
    isActive?: boolean;
    squareMeters?: number;
    address?: string;
    notes?: string;
}

// Default task templates by service type
export const DEFAULT_TASK_TEMPLATES: Record<string, CleaningTask[]> = {
    "Fast Rengøring": [
        { name: "Støvsugning af alle gulve", category: "Cleaning", estimatedTime: 20, isRequired: true, sortOrder: 1 },
        { name: "Vask af gulve", category: "Cleaning", estimatedTime: 25, isRequired: true, sortOrder: 2 },
        { name: "Aftørring af overflader", category: "Cleaning", estimatedTime: 15, isRequired: true, sortOrder: 3 },
        { name: "Rengøring af køkken", category: "Kitchen", estimatedTime: 20, isRequired: true, sortOrder: 4 },
        { name: "Rengøring af badeværelse", category: "Bathroom", estimatedTime: 20, isRequired: true, sortOrder: 5 },
        { name: "Tømning af skraldespande", category: "Cleaning", estimatedTime: 5, isRequired: true, sortOrder: 6 },
    ],
    "Flytterengøring": [
        { name: "Dyb rengøring af køkken (ovn, køleskab, skabe)", category: "Kitchen", estimatedTime: 60, isRequired: true, sortOrder: 1 },
        { name: "Komplet badeværelsesrengøring", category: "Bathroom", estimatedTime: 40, isRequired: true, sortOrder: 2 },
        { name: "Vinduespolering indvendigt", category: "Windows", estimatedTime: 30, isRequired: true, sortOrder: 3 },
        { name: "Gulvvask alle rum", category: "Cleaning", estimatedTime: 45, isRequired: true, sortOrder: 4 },
        { name: "Støvsugning inkl. hjørner og lister", category: "Cleaning", estimatedTime: 30, isRequired: true, sortOrder: 5 },
        { name: "Aftørring af alle overflader og skabe", category: "Cleaning", estimatedTime: 40, isRequired: true, sortOrder: 6 },
        { name: "Rengøring af radiatorer", category: "Special", estimatedTime: 15, isRequired: false, sortOrder: 7 },
    ],
    "Hovedrengøring": [
        { name: "Komplet støvsugning inkl. møbler", category: "Cleaning", estimatedTime: 35, isRequired: true, sortOrder: 1 },
        { name: "Dybderengøring af køkken", category: "Kitchen", estimatedTime: 50, isRequired: true, sortOrder: 2 },
        { name: "Dybderengøring af badeværelse", category: "Bathroom", estimatedTime: 45, isRequired: true, sortOrder: 3 },
        { name: "Vinduespolering", category: "Windows", estimatedTime: 40, isRequired: true, sortOrder: 4 },
        { name: "Vask og polering af gulve", category: "Cleaning", estimatedTime: 40, isRequired: true, sortOrder: 5 },
        { name: "Aftørring af døre og karme", category: "Cleaning", estimatedTime: 20, isRequired: true, sortOrder: 6 },
        { name: "Rengøring af radiatorer", category: "Special", estimatedTime: 20, isRequired: false, sortOrder: 7 },
        { name: "Aftørring af lofter (spindelvæv)", category: "Special", estimatedTime: 15, isRequired: false, sortOrder: 8 },
    ],
    "Engangsopgave": [
        { name: "Generel rengøring", category: "Cleaning", estimatedTime: 60, isRequired: true, sortOrder: 1 },
        { name: "Specifik opgave (beskriv i notes)", category: "Special", estimatedTime: 30, isRequired: true, sortOrder: 2 },
    ],
};

/**
 * Create a new cleaning plan with tasks
 */
export async function createCleaningPlan(input: CreateCleaningPlanInput) {
    logger.info(`Creating cleaning plan: ${input.name} for customer ${input.customerId}`);

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
        where: { id: input.customerId },
    });

    if (!customer) {
        throw new Error(`Customer ${input.customerId} not found`);
    }

    // Calculate estimated duration and price from tasks
    const estimatedDuration = input.tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const estimatedPrice = input.tasks.reduce((sum, task) => sum + (task.pricePerTask || 0), 0) || undefined;

    // Create plan with tasks in a transaction
    const plan = await prisma.cleaningPlan.create({
        data: {
            customerId: input.customerId,
            name: input.name,
            description: input.description,
            serviceType: input.serviceType,
            frequency: input.frequency || "once",
            isTemplate: input.isTemplate || false,
            squareMeters: input.squareMeters,
            address: input.address,
            notes: input.notes,
            estimatedDuration,
            estimatedPrice,
            tasks: {
                create: input.tasks.map(task => ({
                    name: task.name,
                    description: task.description,
                    category: task.category,
                    estimatedTime: task.estimatedTime,
                    isRequired: task.isRequired !== undefined ? task.isRequired : true,
                    pricePerTask: task.pricePerTask,
                    sortOrder: task.sortOrder || 0,
                })),
            },
        },
        include: {
            tasks: {
                orderBy: { sortOrder: "asc" },
            },
            customer: true,
        },
    });

    logger.info(`Created cleaning plan ${plan.id} with ${plan.tasks.length} tasks`);
    return plan;
}

/**
 * Get cleaning plan by ID with tasks
 */
export async function getCleaningPlan(planId: string) {
    return prisma.cleaningPlan.findUnique({
        where: { id: planId },
        include: {
            tasks: {
                orderBy: { sortOrder: "asc" },
            },
            customer: true,
            planBookings: {
                include: {
                    booking: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });
}

/**
 * Get all cleaning plans for a customer
 */
export async function getCustomerCleaningPlans(customerId: string, activeOnly = false) {
    return prisma.cleaningPlan.findMany({
        where: {
            customerId,
            ...(activeOnly && { isActive: true }),
        },
        include: {
            tasks: {
                orderBy: { sortOrder: "asc" },
            },
            planBookings: {
                include: {
                    booking: true,
                },
                orderBy: { createdAt: "desc" },
                take: 1, // Latest booking only
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Get all template plans (can be used to create new plans)
 */
export async function getTemplatePlans() {
    return prisma.cleaningPlan.findMany({
        where: { isTemplate: true },
        include: {
            tasks: {
                orderBy: { sortOrder: "asc" },
            },
        },
        orderBy: { name: "asc" },
    });
}

/**
 * Update cleaning plan
 */
export async function updateCleaningPlan(planId: string, input: UpdateCleaningPlanInput) {
    logger.info(`Updating cleaning plan ${planId}`);

    return prisma.cleaningPlan.update({
        where: { id: planId },
        data: input,
        include: {
            tasks: {
                orderBy: { sortOrder: "asc" },
            },
            customer: true,
        },
    });
}

/**
 * Add task to existing plan
 */
export async function addTaskToPlan(planId: string, task: CleaningTask) {
    logger.info(`Adding task to plan ${planId}: ${task.name}`);

    const newTask = await prisma.cleaningTask.create({
        data: {
            planId,
            name: task.name,
            description: task.description,
            category: task.category,
            estimatedTime: task.estimatedTime,
            isRequired: task.isRequired !== undefined ? task.isRequired : true,
            pricePerTask: task.pricePerTask,
            sortOrder: task.sortOrder || 0,
        },
    });

    // Recalculate plan's estimated duration and price
    await recalculatePlanEstimates(planId);

    return newTask;
}

/**
 * Update task
 */
export async function updateTask(taskId: string, updates: Partial<CleaningTask>) {
    const task = await prisma.cleaningTask.update({
        where: { id: taskId },
        data: updates,
    });

    // Recalculate plan estimates
    await recalculatePlanEstimates(task.planId);

    return task;
}

/**
 * Delete task
 */
export async function deleteTask(taskId: string) {
    const task = await prisma.cleaningTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");

    await prisma.cleaningTask.delete({ where: { id: taskId } });

    // Recalculate plan estimates
    await recalculatePlanEstimates(task.planId);

    return true;
}

/**
 * Recalculate plan's estimated duration and price from tasks
 */
async function recalculatePlanEstimates(planId: string) {
    const tasks = await prisma.cleaningTask.findMany({
        where: { planId },
    });

    const estimatedDuration = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const totalPrice = tasks.reduce((sum, task) => sum + (task.pricePerTask || 0), 0);
    const estimatedPrice = totalPrice > 0 ? totalPrice : undefined;

    await prisma.cleaningPlan.update({
        where: { id: planId },
        data: { estimatedDuration, estimatedPrice },
    });
}

/**
 * Create cleaning plan from template
 */
export async function createPlanFromTemplate(templateId: string, customerId: string, overrides?: Partial<CreateCleaningPlanInput>) {
    logger.info(`Creating plan from template ${templateId} for customer ${customerId}`);

    const template = await getCleaningPlan(templateId);
    if (!template) throw new Error("Template not found");
    if (!template.isTemplate) throw new Error("Plan is not a template");

    const input: CreateCleaningPlanInput = {
        customerId,
        name: overrides?.name || template.name,
        description: overrides?.description || template.description || undefined,
        serviceType: overrides?.serviceType || template.serviceType,
        frequency: overrides?.frequency || template.frequency as any,
        squareMeters: overrides?.squareMeters || template.squareMeters || undefined,
        address: overrides?.address || template.address || undefined,
        notes: overrides?.notes || template.notes || undefined,
        tasks: template.tasks.map(task => ({
            name: task.name,
            description: task.description || undefined,
            category: task.category,
            estimatedTime: task.estimatedTime,
            isRequired: task.isRequired,
            pricePerTask: task.pricePerTask || undefined,
            sortOrder: task.sortOrder,
        })),
    };

    return createCleaningPlan(input);
}

/**
 * Link booking to cleaning plan and record completed tasks
 */
export async function linkBookingToPlan(bookingId: string, planId: string, completedTaskIds: string[] = []) {
    logger.info(`Linking booking ${bookingId} to plan ${planId}`);

    // Verify booking and plan exist
    const [booking, plan] = await Promise.all([
        prisma.booking.findUnique({ where: { id: bookingId } }),
        prisma.cleaningPlan.findUnique({ where: { id: planId } }),
    ]);

    if (!booking) throw new Error("Booking not found");
    if (!plan) throw new Error("Cleaning plan not found");

    return prisma.cleaningPlanBooking.create({
        data: {
            bookingId,
            planId,
            completedTasks: completedTaskIds,
        },
        include: {
            plan: {
                include: {
                    tasks: true,
                },
            },
            booking: true,
        },
    });
}

/**
 * Calculate price for cleaning plan based on service type and square meters
 */
export function calculateCleaningPrice(serviceType: string, squareMeters?: number): number {
    // Base hourly rate (can be configured)
    const HOURLY_RATE = 350; // DKK per hour

    // Price per square meter by service type
    const PRICE_PER_SQM: Record<string, number> = {
        "Fast Rengøring": 3.5,
        "Flytterengøring": 15,
        "Hovedrengøring": 8,
        "Engangsopgave": 5,
    };

    const pricePerSqm = PRICE_PER_SQM[serviceType] || 5;

    if (squareMeters && squareMeters > 0) {
        return Math.round(squareMeters * pricePerSqm);
    }

    // Fallback: estimate based on default duration
    const defaultDurations: Record<string, number> = {
        "Fast Rengøring": 120,
        "Flytterengøring": 240,
        "Hovedrengøring": 180,
        "Engangsopgave": 120,
    };

    const durationMinutes = defaultDurations[serviceType] || 120;
    return Math.round((durationMinutes / 60) * HOURLY_RATE);
}

/**
 * Delete cleaning plan
 */
export async function deleteCleaningPlan(planId: string) {
    logger.info(`Deleting cleaning plan ${planId}`);

    await prisma.cleaningPlan.delete({
        where: { id: planId },
    });

    return true;
}
