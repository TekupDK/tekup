/**
 * Invoice Service (Sprint 3)
 * 
 * Manages invoice creation, Billy.dk integration, and payment tracking
 */

import { logger } from "../logger";
import { prisma } from "./databaseService";
import { sendGenericEmail } from "./gmailService";

export interface CreateInvoiceInput {
    bookingId?: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerAddress?: string;
    lineItems: InvoiceLineItemInput[];
    notes?: string;
    internalNotes?: string;
    dueInDays?: number; // Default 14
}

export interface InvoiceLineItemInput {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface InvoiceResult {
    id: string;
    invoiceNumber: string;
    total: number;
    dueDate: Date;
    status: string;
}

/**
 * Generate next invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Find last invoice of current year
    const lastInvoice = await prisma.invoice.findFirst({
        where: {
            invoiceNumber: {
                startsWith: `INV-${year}-`,
            },
        },
        orderBy: {
            invoiceNumber: "desc",
        },
    });

    let sequence = 1;
    if (lastInvoice) {
        const lastNumber = lastInvoice.invoiceNumber.split("-")[2];
        sequence = parseInt(lastNumber, 10) + 1;
    }

    return `INV-${year}-${sequence.toString().padStart(3, "0")}`;
}

/**
 * Create an invoice
 */
export async function createInvoice(
    input: CreateInvoiceInput
): Promise<InvoiceResult> {
    try {
        logger.info({ input }, "💰 Creating invoice");

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();

        // Calculate totals
        const subtotal = input.lineItems.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
        );
        const vatRate = 25.0; // Danish VAT
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;

        // Calculate due date
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (input.dueInDays || 14));

        // Create invoice
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                bookingId: input.bookingId,
                customerId: input.customerId,
                customerName: input.customerName,
                customerEmail: input.customerEmail,
                customerAddress: input.customerAddress,
                issueDate,
                dueDate,
                status: "draft",
                subtotal,
                vatRate,
                vatAmount,
                total,
                notes: input.notes,
                internalNotes: input.internalNotes,
                lineItems: {
                    create: input.lineItems.map((item, index) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.quantity * item.unitPrice,
                        sortOrder: index,
                    })),
                },
            },
            include: {
                lineItems: true,
            },
        });

        logger.info(
            { invoiceId: invoice.id, invoiceNumber, total },
            "✅ Invoice created successfully"
        );

        return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            total: invoice.total,
            dueDate: invoice.dueDate,
            status: invoice.status,
        };
    } catch (error) {
        logger.error({ error }, "❌ Failed to create invoice");
        throw error;
    }
}

/**
 * Create invoice from booking
 */
export async function createInvoiceFromBooking(
    bookingId: string
): Promise<InvoiceResult> {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            customer: true,
            planBooking: {
                include: {
                    plan: {
                        include: {
                            tasks: true,
                        },
                    },
                },
            },
        },
    });

    if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
    }

    if (!booking.customer) {
        throw new Error("Booking has no associated customer");
    }

    // Use actual duration if available, otherwise estimated
    const duration = booking.actualDuration || booking.estimatedDuration || 120;
    const hours = duration / 60;
    const hourlyRate = 300; // DKK per hour (can be configurable)

    // Create line items
    const lineItems: InvoiceLineItemInput[] = [
        {
            description: `${booking.serviceType || "Rengøring"} - ${booking.address || ""}`,
            quantity: hours,
            unitPrice: hourlyRate,
        },
    ];

    // Add extra items from cleaning plan tasks if available
    if (booking.planBooking?.plan) {
        const plan = booking.planBooking.plan;
        const specialTasks = plan.tasks.filter(
            t => t.pricePerTask && t.pricePerTask > 0
        );
        
        specialTasks.forEach(task => {
            lineItems.push({
                description: task.name,
                quantity: 1,
                unitPrice: task.pricePerTask!,
            });
        });
    }

    return createInvoice({
        bookingId: booking.id,
        customerId: booking.customer.id,
        customerName: booking.customer.name,
        customerEmail: booking.customer.email || undefined,
        customerAddress: booking.customer.address || undefined,
        lineItems,
        notes: booking.notes || undefined,
    });
}

/**
 * Send invoice email to customer
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            lineItems: true,
        },
    });

    if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (!invoice.customerEmail) {
        throw new Error("Invoice has no customer email");
    }

    if (invoice.status === "draft") {
        throw new Error("Cannot send draft invoice");
    }

    // Format line items for email
    const lineItemsText = invoice.lineItems
        .map(
            item =>
                `${item.description} - ${item.quantity} × ${item.unitPrice} kr = ${item.amount} kr`
        )
        .join("\n");

    // Create email body
    const body = `
Hej ${invoice.customerName},

Tak for din forretning! Her er din faktura:

────────────────────────────────────────
FAKTURA ${invoice.invoiceNumber}
Udstedelsesdato: ${invoice.issueDate.toLocaleDateString("da-DK")}
Betalingsfrist: ${invoice.dueDate.toLocaleDateString("da-DK")}
────────────────────────────────────────

${lineItemsText}

────────────────────────────────────────
Subtotal:     ${invoice.subtotal.toFixed(2)} kr
Moms (25%):   ${invoice.vatAmount.toFixed(2)} kr
TOTAL:        ${invoice.total.toFixed(2)} kr
────────────────────────────────────────

Betalingsoplysninger:
Reg: 1234
Konto: 567890123
MobilePay: +45 12 34 56 78

Venligst angiv fakturanummer ${invoice.invoiceNumber} ved betaling.

${invoice.notes ? `\nBemærkninger:\n${invoice.notes}` : ""}

Med venlig hilsen,
Rendetalje.dk
    `.trim();

    // Send email
    await sendGenericEmail({
        to: invoice.customerEmail,
        subject: `Faktura ${invoice.invoiceNumber} - Rendetalje.dk`,
        body,
    });

    // Update invoice
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            status: "sent",
            sentAt: new Date(),
        },
    });

    logger.info(
        { invoiceId, invoiceNumber: invoice.invoiceNumber },
        "📧 Invoice email sent"
    );
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(
    invoiceId: string,
    paymentMethod?: string,
    paymentRef?: string
): Promise<void> {
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            status: "paid",
            paidAt: new Date(),
            paidAmount: undefined, // Will be set to total by default
            paymentMethod,
            paymentRef,
        },
    });

    logger.info({ invoiceId }, "✅ Invoice marked as paid");
}

/**
 * Get overdue invoices
 */
export async function getOverdueInvoices() {
    const now = new Date();

    const invoices = await prisma.invoice.findMany({
        where: {
            status: "sent",
            dueDate: {
                lt: now,
            },
        },
        include: {
            lineItems: true,
        },
        orderBy: {
            dueDate: "asc",
        },
    });

    // Update status to overdue
    for (const invoice of invoices) {
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: "overdue" },
        });
    }

    return invoices;
}

/**
 * Send payment reminder
 */
export async function sendPaymentReminder(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
    });

    if (!invoice || !invoice.customerEmail) {
        throw new Error("Invoice not found or has no email");
    }

    const daysOverdue = Math.floor(
        (new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const body = `
Hej ${invoice.customerName},

Dette er en påmindelse om, at faktura ${invoice.invoiceNumber} er forfalden.

Forfaldsdato: ${invoice.dueDate.toLocaleDateString("da-DK")}
Dage overskredet: ${daysOverdue}
Beløb: ${invoice.total.toFixed(2)} kr

Venligst betal snarest muligt for at undgå yderligere gebyrer.

Betalingsoplysninger:
Reg: 1234
Konto: 567890123
MobilePay: +45 12 34 56 78

Med venlig hilsen,
Rendetalje.dk
    `.trim();

    await sendGenericEmail({
        to: invoice.customerEmail,
        subject: `Betalingspåmindelse - Faktura ${invoice.invoiceNumber}`,
        body,
    });

    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { reminderSentAt: new Date() },
    });

    logger.info({ invoiceId }, "📧 Payment reminder sent");
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(options: {
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
}) {
    const { startDate, endDate, customerId } = options;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
        where.issueDate = {};
        if (startDate) where.issueDate.gte = startDate;
        if (endDate) where.issueDate.lte = endDate;
    }

    const invoices = await prisma.invoice.findMany({
        where,
        include: { lineItems: true },
    });

    const stats = {
        total: invoices.length,
        draft: invoices.filter(i => i.status === "draft").length,
        sent: invoices.filter(i => i.status === "sent").length,
        paid: invoices.filter(i => i.status === "paid").length,
        overdue: invoices.filter(i => i.status === "overdue").length,
        totalRevenue: invoices
            .filter(i => i.status === "paid")
            .reduce((sum, i) => sum + i.total, 0),
        pendingRevenue: invoices
            .filter(i => i.status === "sent")
            .reduce((sum, i) => sum + i.total, 0),
        overdueRevenue: invoices
            .filter(i => i.status === "overdue")
            .reduce((sum, i) => sum + i.total, 0),
    };

    return stats;
}
