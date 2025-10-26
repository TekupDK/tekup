/**
 * Invoice API Routes (Sprint 3)
 */

import { Router, Request, Response } from "express";
import { logger } from "../logger";
import {
    createInvoice,
    createInvoiceFromBooking,
    sendInvoiceEmail,
    markInvoiceAsPaid,
    getOverdueInvoices,
    sendPaymentReminder,
    getInvoiceStats,
} from "../services/invoiceService";
import { prisma } from "../services/databaseService";

const router = Router();

/**
 * POST /api/invoices
 * Create a new invoice
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const invoice = await createInvoice(req.body);
        
        res.status(201).json({
            success: true,
            data: invoice,
        });
    } catch (error: any) {
        logger.error({ error, body: req.body }, "Failed to create invoice");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/invoices/from-booking/:bookingId
 * Create invoice from a booking
 */
router.post("/from-booking/:bookingId", async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const invoice = await createInvoiceFromBooking(bookingId);
        
        res.status(201).json({
            success: true,
            data: invoice,
        });
    } catch (error: any) {
        logger.error({ error, bookingId: req.params.bookingId }, "Failed to create invoice from booking");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/invoices
 * List all invoices with optional filters
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { customerId, status, limit = "50", offset = "0" } = req.query;
        
        const where: any = {};
        if (customerId) where.customerId = customerId;
        if (status) where.status = status;
        
        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                lineItems: true,
                booking: {
                    select: {
                        id: true,
                        serviceType: true,
                        scheduledAt: true,
                    },
                },
            },
            orderBy: { issueDate: "desc" },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
        });
        
        const total = await prisma.invoice.count({ where });
        
        res.json({
            success: true,
            data: invoices,
            pagination: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
            },
        });
    } catch (error: any) {
        logger.error({ error }, "Failed to list invoices");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                lineItems: {
                    orderBy: { sortOrder: "asc" },
                },
                booking: {
                    include: {
                        customer: true,
                    },
                },
            },
        });
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: "Invoice not found",
            });
        }
        
        res.json({
            success: true,
            data: invoice,
        });
    } catch (error: any) {
        logger.error({ error, invoiceId: req.params.id }, "Failed to get invoice");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/invoices/:id/send
 * Send invoice email to customer
 */
router.post("/:id/send", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        await sendInvoiceEmail(id);
        
        res.json({
            success: true,
            message: "Invoice email sent successfully",
        });
    } catch (error: any) {
        logger.error({ error, invoiceId: req.params.id }, "Failed to send invoice email");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/invoices/:id/mark-paid
 * Mark invoice as paid
 */
router.post("/:id/mark-paid", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { paymentMethod, paymentRef } = req.body;
        
        await markInvoiceAsPaid(id, paymentMethod, paymentRef);
        
        res.json({
            success: true,
            message: "Invoice marked as paid",
        });
    } catch (error: any) {
        logger.error({ error, invoiceId: req.params.id }, "Failed to mark invoice as paid");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/invoices/overdue/list
 * Get all overdue invoices
 */
router.get("/overdue/list", async (req: Request, res: Response) => {
    try {
        const invoices = await getOverdueInvoices();
        
        res.json({
            success: true,
            data: invoices,
        });
    } catch (error: any) {
        logger.error({ error }, "Failed to get overdue invoices");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/invoices/:id/send-reminder
 * Send payment reminder
 */
router.post("/:id/send-reminder", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        await sendPaymentReminder(id);
        
        res.json({
            success: true,
            message: "Payment reminder sent",
        });
    } catch (error: any) {
        logger.error({ error, invoiceId: req.params.id }, "Failed to send payment reminder");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/invoices/stats/summary
 * Get invoice statistics
 */
router.get("/stats/summary", async (req: Request, res: Response) => {
    try {
        const { customerId, startDate, endDate } = req.query;
        
        const stats = await getInvoiceStats({
            customerId: customerId as string | undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });
        
        res.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        logger.error({ error }, "Failed to get invoice stats");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * DELETE /api/invoices/:id
 * Delete an invoice (only drafts can be deleted)
 */
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Check if invoice is draft
        const invoice = await prisma.invoice.findUnique({
            where: { id },
        });
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: "Invoice not found",
            });
        }
        
        if (invoice.status !== "draft") {
            return res.status(400).json({
                success: false,
                error: "Only draft invoices can be deleted",
            });
        }
        
        await prisma.invoice.delete({
            where: { id },
        });
        
        res.json({
            success: true,
            message: "Invoice deleted",
        });
    } catch (error: any) {
        logger.error({ error, invoiceId: req.params.id }, "Failed to delete invoice");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/invoices/:id
 * Update invoice (only drafts can be updated)
 */
router.patch("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { customerName, customerEmail, customerAddress, notes, dueDate } = req.body;
        
        // Check if invoice is draft
        const invoice = await prisma.invoice.findUnique({
            where: { id },
        });
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: "Invoice not found",
            });
        }
        
        if (invoice.status !== "draft") {
            return res.status(400).json({
                success: false,
                error: "Only draft invoices can be updated",
            });
        }
        
        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                customerName,
                customerEmail,
                customerAddress,
                notes,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            },
        });
        
        res.json({
            success: true,
            data: updated,
        });
    } catch (error: any) {
        logger.error({ error, invoiceId: req.params.id }, "Failed to update invoice");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
