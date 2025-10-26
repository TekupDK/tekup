/**
 * Cleaning Plans API Routes
 * 
 * RESTful API for managing cleaning plans and tasks
 * Part of Phase 1 - Sprint 1: Rengøringsplaner
 */

import { Router } from "express";
import { z } from "zod";
import {
    createCleaningPlan,
    getCleaningPlan,
    getCustomerCleaningPlans,
    getTemplatePlans,
    updateCleaningPlan,
    addTaskToPlan,
    updateTask,
    deleteTask,
    deleteCleaningPlan,
    createPlanFromTemplate,
    linkBookingToPlan,
    calculateCleaningPrice,
    DEFAULT_TASK_TEMPLATES,
    type CreateCleaningPlanInput,
    type CleaningTask,
} from "../services/cleaningPlanService";
import { logger } from "../logger";

const router = Router();

// Validation schemas
const CreateCleaningPlanSchema = z.object({
    customerId: z.string().cuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    serviceType: z.string(),
    frequency: z.enum(["once", "weekly", "biweekly", "monthly"]).optional(),
    isTemplate: z.boolean().optional(),
    squareMeters: z.number().positive().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    tasks: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.string(),
        estimatedTime: z.number().int().positive(),
        isRequired: z.boolean().optional(),
        pricePerTask: z.number().optional(),
        sortOrder: z.number().int().optional(),
    })),
});

const UpdateCleaningPlanSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    frequency: z.enum(["once", "weekly", "biweekly", "monthly"]).optional(),
    isActive: z.boolean().optional(),
    squareMeters: z.number().positive().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
});

const AddTaskSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string(),
    estimatedTime: z.number().int().positive(),
    isRequired: z.boolean().optional(),
    pricePerTask: z.number().optional(),
    sortOrder: z.number().int().optional(),
});

/**
 * GET /api/cleaning-plans/templates
 * Get default task templates for all service types
 */
router.get("/templates/tasks", async (req, res) => {
    try {
        res.json({
            success: true,
            data: DEFAULT_TASK_TEMPLATES,
        });
    } catch (error: any) {
        logger.error({ error }, "Error fetching task templates");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/cleaning-plans/templates
 * Get all template plans
 */
router.get("/templates", async (req, res) => {
    try {
        const templates = await getTemplatePlans();
        res.json({
            success: true,
            data: templates,
        });
    } catch (error: any) {
        logger.error({ error }, "Error fetching template plans");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/cleaning-plans/templates/:templateId/create
 * Create a new plan from template
 */
router.post("/templates/:templateId/create", async (req, res) => {
    try {
        const { templateId } = req.params;
        const { customerId, name, description, address, squareMeters, notes } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: "customerId is required",
            });
        }

        const plan = await createPlanFromTemplate(templateId, customerId, {
            name,
            description,
            address,
            squareMeters,
            notes,
        });

        res.status(201).json({
            success: true,
            data: plan,
        });
    } catch (error: any) {
        logger.error({ error }, "Error creating plan from template");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/cleaning-plans
 * Create a new cleaning plan
 */
router.post("/", async (req, res) => {
    try {
        const input = CreateCleaningPlanSchema.parse(req.body) as CreateCleaningPlanInput;
        const plan = await createCleaningPlan(input);

        res.status(201).json({
            success: true,
            data: plan,
        });
    } catch (error: any) {
        logger.error({ error }, "Error creating cleaning plan");

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: "Invalid input",
                details: error.errors,
            });
        }

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/cleaning-plans/:planId
 * Get cleaning plan by ID with tasks
 */
router.get("/:planId", async (req, res) => {
    try {
        const { planId } = req.params;
        const plan = await getCleaningPlan(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                error: "Cleaning plan not found",
            });
        }

        res.json({
            success: true,
            data: plan,
        });
    } catch (error: any) {
        logger.error({ error }, "Error fetching cleaning plan");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/cleaning-plans/customer/:customerId
 * Get all cleaning plans for a customer
 */
router.get("/customer/:customerId", async (req, res) => {
    try {
        const { customerId } = req.params;
        const activeOnly = req.query.activeOnly === "true";

        const plans = await getCustomerCleaningPlans(customerId, activeOnly);

        res.json({
            success: true,
            data: plans,
        });
    } catch (error: any) {
        logger.error({ error }, "Error fetching customer cleaning plans");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/cleaning-plans/:planId
 * Update cleaning plan
 */
router.patch("/:planId", async (req, res) => {
    try {
        const { planId } = req.params;
        const input = UpdateCleaningPlanSchema.parse(req.body);

        const plan = await updateCleaningPlan(planId, input);

        res.json({
            success: true,
            data: plan,
        });
    } catch (error: any) {
        logger.error({ error }, "Error updating cleaning plan");

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: "Invalid input",
                details: error.errors,
            });
        }

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * DELETE /api/cleaning-plans/:planId
 * Delete cleaning plan
 */
router.delete("/:planId", async (req, res) => {
    try {
        const { planId } = req.params;
        await deleteCleaningPlan(planId);

        res.json({
            success: true,
            message: "Cleaning plan deleted",
        });
    } catch (error: any) {
        logger.error({ error }, "Error deleting cleaning plan");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/cleaning-plans/:planId/tasks
 * Add task to plan
 */
router.post("/:planId/tasks", async (req, res) => {
    try {
        const { planId } = req.params;
        const task = AddTaskSchema.parse(req.body) as CleaningTask;

        const newTask = await addTaskToPlan(planId, task);

        res.status(201).json({
            success: true,
            data: newTask,
        });
    } catch (error: any) {
        logger.error({ error }, "Error adding task to plan");

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: "Invalid input",
                details: error.errors,
            });
        }

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/cleaning-plans/tasks/:taskId
 * Update task
 */
router.patch("/tasks/:taskId", async (req, res) => {
    try {
        const { taskId } = req.params;
        const updates = req.body;

        const task = await updateTask(taskId, updates);

        res.json({
            success: true,
            data: task,
        });
    } catch (error: any) {
        logger.error({ error }, "Error updating task");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * DELETE /api/cleaning-plans/tasks/:taskId
 * Delete task
 */
router.delete("/tasks/:taskId", async (req, res) => {
    try {
        const { taskId } = req.params;
        await deleteTask(taskId);

        res.json({
            success: true,
            message: "Task deleted",
        });
    } catch (error: any) {
        logger.error({ error }, "Error deleting task");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/cleaning-plans/:planId/bookings/:bookingId
 * Link booking to plan and record completed tasks
 */
router.post("/:planId/bookings/:bookingId", async (req, res) => {
    try {
        const { planId, bookingId } = req.params;
        const { completedTaskIds } = req.body;

        const planBooking = await linkBookingToPlan(
            bookingId,
            planId,
            completedTaskIds || []
        );

        res.status(201).json({
            success: true,
            data: planBooking,
        });
    } catch (error: any) {
        logger.error({ error }, "Error linking booking to plan");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/cleaning-plans/calculate-price
 * Calculate price for cleaning plan
 */
router.post("/calculate-price", async (req, res) => {
    try {
        const { serviceType, squareMeters } = req.body;

        if (!serviceType) {
            return res.status(400).json({
                success: false,
                error: "serviceType is required",
            });
        }

        const price = calculateCleaningPrice(serviceType, squareMeters);

        res.json({
            success: true,
            data: {
                serviceType,
                squareMeters,
                estimatedPrice: price,
                currency: "DKK",
            },
        });
    } catch (error: any) {
        logger.error({ error }, "Error calculating price");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
