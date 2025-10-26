/**
 * Billy.dk API Service
 * 
 * Handles integration with Billy.dk accounting system for:
 * - Invoice synchronization
 * - Revenue/financial data retrieval
 * - Payment status tracking
 */

import axios, { AxiosInstance } from "axios";
import { logger } from "../logger";
import { billyConfig, isBillyEnabled } from "../config";

const BILLY_API_BASE = "https://api.billysbilling.com/v2";

interface BillyInvoice {
    id: string;
    invoiceNo: string;
    state: string; // draft, approved, sent, paid
    contactId: string;
    currency: string;
    totalAmount: number;
    entryDate: string;
    paymentDate?: string;
}

interface BillyRevenueData {
    period: string;
    totalRevenue: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
}

class BillyApiClient {
    private client: AxiosInstance | null = null;

    constructor() {
        if (isBillyEnabled() && billyConfig.BILLY_API_KEY) {
            this.client = axios.create({
                baseURL: BILLY_API_BASE,
                headers: {
                    "X-Access-Token": billyConfig.BILLY_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            });
        }
    }

    /**
     * Check if Billy integration is configured and enabled
     */
    isConfigured(): boolean {
        return this.client !== null && isBillyEnabled();
    }

    /**
     * Fetch revenue data for a specific period
     */
    async getRevenueData(startDate: Date, endDate: Date): Promise<BillyRevenueData> {
        if (!this.isConfigured()) {
            logger.warn("Billy.dk integration not configured, returning mock data");
            return this.getMockRevenueData(startDate, endDate);
        }

        try {
            // Fetch invoices within date range
            const response = await this.client!.get("/invoices", {
                params: {
                    organizationId: billyConfig.BILLY_ORGANIZATION_ID,
                    entryDateGte: startDate.toISOString().split("T")[0],
                    entryDateLte: endDate.toISOString().split("T")[0],
                },
            });

            const invoices: BillyInvoice[] = response.data.invoices || [];

            // Calculate revenue metrics
            const paidInvoices = invoices.filter((inv) => inv.state === "paid");
            const pendingInvoices = invoices.filter(
                (inv) => inv.state === "approved" || inv.state === "sent"
            );
            const overdueInvoices = invoices.filter((inv) => {
                if (inv.state !== "paid" && inv.entryDate) {
                    const dueDate = new Date(inv.entryDate);
                    dueDate.setDate(dueDate.getDate() + 14); // Assume 14 day payment terms
                    return dueDate < new Date();
                }
                return false;
            });

            const totalRevenue = paidInvoices.reduce(
                (sum, inv) => sum + inv.totalAmount,
                0
            );

            return {
                period: `${startDate.toISOString().split("T")[0]} - ${endDate.toISOString().split("T")[0]}`,
                totalRevenue,
                paidInvoices: paidInvoices.length,
                pendingInvoices: pendingInvoices.length,
                overdueInvoices: overdueInvoices.length,
            };
        } catch (error) {
            logger.error({ error }, "Failed to fetch revenue from Billy.dk");
            // Fallback to database data
            return this.getRevenueFromDatabase(startDate, endDate);
        }
    }

    /**
     * Fallback: Get revenue from local database invoices
     */
    private async getRevenueFromDatabase(
        startDate: Date,
        endDate: Date
    ): Promise<BillyRevenueData> {
        const { prisma } = await import("./databaseService");

        const invoices = await prisma.invoice.findMany({
            where: {
                issueDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const paidInvoices = invoices.filter((inv) => inv.status === "paid");
        const pendingInvoices = invoices.filter(
            (inv) => inv.status === "sent" || inv.status === "draft"
        );
        const overdueInvoices = invoices.filter(
            (inv) => inv.status !== "paid" && inv.dueDate < new Date()
        );

        const totalRevenue = paidInvoices.reduce(
            (sum, inv) => sum + inv.total,
            0
        );

        return {
            period: `${startDate.toISOString().split("T")[0]} - ${endDate.toISOString().split("T")[0]}`,
            totalRevenue,
            paidInvoices: paidInvoices.length,
            pendingInvoices: pendingInvoices.length,
            overdueInvoices: overdueInvoices.length,
        };
    }

    /**
     * Mock data for development/testing
     */
    private getMockRevenueData(startDate: Date, endDate: Date): BillyRevenueData {
        // Calculate days in period
        const days = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Generate realistic mock data based on period length
        const avgDailyRevenue = 2500; // DKK per day average
        const totalRevenue = avgDailyRevenue * days;

        return {
            period: `${startDate.toISOString().split("T")[0]} - ${endDate.toISOString().split("T")[0]}`,
            totalRevenue: Math.round(totalRevenue),
            paidInvoices: Math.floor(days / 3),
            pendingInvoices: Math.floor(days / 7),
            overdueInvoices: Math.floor(days / 14),
        };
    }

    /**
     * Sync invoice to Billy.dk
     */
    async syncInvoice(invoiceId: string): Promise<boolean> {
        if (!this.isConfigured()) {
            logger.info({ invoiceId }, "Billy.dk not configured, skipping sync");
            return false;
        }

        try {
            const { prisma } = await import("./databaseService");
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: { lineItems: true },
            });

            if (!invoice) {
                throw new Error(`Invoice ${invoiceId} not found`);
            }

            // Only sync if not already synced
            if (invoice.billyInvoiceId) {
                logger.info(
                    { invoiceId, billyInvoiceId: invoice.billyInvoiceId },
                    "Invoice already synced to Billy.dk"
                );
                return true;
            }

            // Create invoice in Billy.dk
            const response = await this.client!.post("/invoices", {
                organizationId: billyConfig.BILLY_ORGANIZATION_ID,
                type: "invoice",
                entryDate: invoice.issueDate.toISOString().split("T")[0],
                paymentTermsMode: "net",
                paymentTermsDays: 14,
                lines: invoice.lineItems.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    productId: null, // Can map to Billy products if needed
                })),
            });

            const billyInvoiceId = response.data.invoice.id;

            // Update local invoice with Billy ID
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    billyInvoiceId,
                    billySyncedAt: new Date(),
                },
            });

            logger.info(
                { invoiceId, billyInvoiceId },
                "Invoice synced to Billy.dk successfully"
            );

            return true;
        } catch (error) {
            logger.error({ error, invoiceId }, "Failed to sync invoice to Billy.dk");
            return false;
        }
    }
}

// Export singleton instance
export const billyService = new BillyApiClient();

// Export types
export type { BillyRevenueData, BillyInvoice };
