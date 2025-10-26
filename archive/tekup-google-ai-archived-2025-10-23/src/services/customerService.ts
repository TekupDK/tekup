import { Customer, Conversation, EmailMessage, Prisma } from "@prisma/client";
import { prisma } from "./databaseService";
import { logger } from "../logger";

/**
 * Customer Service
 * 
 * Handles CRUD operations for customers, conversations, and email messages.
 * Integrates with Gmail thread tracking and lead management.
 */

// Type definitions
export interface CreateCustomerInput {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    notes?: string;
    tags?: string[];
}

export interface UpdateCustomerInput {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    notes?: string;
    tags?: string[];
    status?: string;
}

export interface CreateConversationInput {
    customerId?: string;
    leadId?: string;
    subject?: string;
    channel?: string;
    gmailThreadId?: string;
}

export interface CreateEmailMessageInput {
    conversationId: string;
    gmailMessageId?: string;
    gmailThreadId: string;
    from: string;
    to: string | string[];
    subject?: string;
    body: string;
    bodyPreview?: string;
    direction: "inbound" | "outbound";
    isAiGenerated?: boolean;
    aiModel?: string;
    sentAt: Date;
}

export interface CustomerFilters {
    status?: string;
    tags?: string[];
    email?: string;
}

// Customer CRUD Operations

/**
 * Create a new customer
 */
export async function createCustomer(
    input: CreateCustomerInput
): Promise<Customer> {
    try {
        const customer = await prisma.customer.create({
            data: {
                name: input.name,
                email: input.email,
                phone: input.phone,
                address: input.address,
                companyName: input.companyName,
                notes: input.notes,
                tags: input.tags || [],
            },
        });

        logger.info(
            { customerId: customer.id, name: customer.name },
            "Customer created"
        );

        return customer;
    } catch (error) {
        logger.error({ error, input }, "Failed to create customer");
        throw error;
    }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(
    customerId: string,
    includeRelations = false
): Promise<Customer | null> {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: includeRelations
                ? {
                    leads: true,
                    conversations: {
                        include: {
                            messages: true,
                        },
                    },
                }
                : undefined,
        });

        return customer;
    } catch (error) {
        logger.error({ error, customerId }, "Failed to get customer");
        throw error;
    }
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(
    email: string
): Promise<Customer | null> {
    try {
        const customer = await prisma.customer.findUnique({
            where: { email },
        });

        return customer;
    } catch (error) {
        logger.error({ error, email }, "Failed to get customer by email");
        throw error;
    }
}

/**
 * Update customer
 */
export async function updateCustomer(
    customerId: string,
    input: UpdateCustomerInput
): Promise<Customer> {
    try {
        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.email !== undefined && { email: input.email }),
                ...(input.phone !== undefined && { phone: input.phone }),
                ...(input.address !== undefined && { address: input.address }),
                ...(input.companyName !== undefined && {
                    companyName: input.companyName,
                }),
                ...(input.notes !== undefined && { notes: input.notes }),
                ...(input.tags !== undefined && { tags: input.tags }),
                ...(input.status && { status: input.status }),
            },
        });

        logger.info({ customerId }, "Customer updated");

        return customer;
    } catch (error) {
        logger.error({ error, customerId }, "Failed to update customer");
        throw error;
    }
}

/**
 * Update customer statistics (leads, bookings, revenue)
 */
export async function updateCustomerStats(customerId: string): Promise<void> {
    try {
        // Get counts and totals
        const [leadCount, bookingCount, quotes] = await Promise.all([
            prisma.lead.count({ where: { customerId } }),
            prisma.booking.count({
                where: { lead: { customerId } },
            }),
            prisma.quote.findMany({
                where: { lead: { customerId }, status: "accepted" },
                select: { total: true },
            }),
        ]);

        const totalRevenue = quotes.reduce(
            (sum, quote) => sum + quote.total,
            0
        );

        await prisma.customer.update({
            where: { id: customerId },
            data: {
                totalLeads: leadCount,
                totalBookings: bookingCount,
                totalRevenue,
                lastContactAt: new Date(),
            },
        });

        logger.debug(
            { customerId, leadCount, bookingCount, totalRevenue },
            "Customer stats updated"
        );
    } catch (error) {
        logger.error({ error, customerId }, "Failed to update customer stats");
        throw error;
    }
}

/**
 * Query customers with filters
 */
export async function queryCustomers(
    filters: CustomerFilters = {}
): Promise<Customer[]> {
    try {
        const customers = await prisma.customer.findMany({
            where: {
                ...(filters.status && { status: filters.status }),
                ...(filters.email && { email: filters.email }),
                ...(filters.tags &&
                    filters.tags.length > 0 && {
                    tags: { hasSome: filters.tags },
                }),
            },
            orderBy: {
                lastContactAt: "desc",
            },
        });

        return customers;
    } catch (error) {
        logger.error({ error, filters }, "Failed to query customers");
        throw error;
    }
}

/**
 * Delete customer (soft delete by setting status to inactive)
 */
export async function deleteCustomer(customerId: string): Promise<boolean> {
    try {
        await prisma.customer.update({
            where: { id: customerId },
            data: { status: "inactive" },
        });

        logger.info({ customerId }, "Customer deleted (soft delete)");

        return true;
    } catch (error) {
        logger.error({ error, customerId }, "Failed to delete customer");
        return false;
    }
}

// Conversation CRUD Operations

/**
 * Create a new conversation
 */
export async function createConversation(
    input: CreateConversationInput
): Promise<Conversation> {
    try {
        const conversation = await prisma.conversation.create({
            data: {
                customerId: input.customerId,
                leadId: input.leadId,
                subject: input.subject,
                channel: input.channel || "email",
                gmailThreadId: input.gmailThreadId,
            },
        });

        logger.info(
            {
                conversationId: conversation.id,
                customerId: input.customerId,
                leadId: input.leadId,
            },
            "Conversation created"
        );

        return conversation;
    } catch (error) {
        logger.error({ error, input }, "Failed to create conversation");
        throw error;
    }
}

/**
 * Get conversation by Gmail thread ID
 */
export async function getConversationByGmailThreadId(
    gmailThreadId: string
): Promise<Conversation | null> {
    try {
        const conversation = await prisma.conversation.findUnique({
            where: { gmailThreadId },
            include: {
                customer: true,
                lead: true,
                messages: {
                    orderBy: { sentAt: "asc" },
                },
            },
        });

        return conversation;
    } catch (error) {
        logger.error(
            { error, gmailThreadId },
            "Failed to get conversation by Gmail thread ID"
        );
        throw error;
    }
}

/**
 * Get conversations for a customer
 */
export async function getCustomerConversations(
    customerId: string
): Promise<Conversation[]> {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { customerId },
            include: {
                messages: {
                    orderBy: { sentAt: "desc" },
                    take: 1, // Latest message only
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return conversations;
    } catch (error) {
        logger.error(
            { error, customerId },
            "Failed to get customer conversations"
        );
        throw error;
    }
}

/**
 * Close a conversation
 */
export async function closeConversation(
    conversationId: string
): Promise<Conversation> {
    try {
        const conversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                status: "closed",
                closedAt: new Date(),
            },
        });

        logger.info({ conversationId }, "Conversation closed");

        return conversation;
    } catch (error) {
        logger.error({ error, conversationId }, "Failed to close conversation");
        throw error;
    }
}

// Email Message CRUD Operations

/**
 * Create a new email message
 */
export async function createEmailMessage(
    input: CreateEmailMessageInput
): Promise<EmailMessage> {
    try {
        const message = await prisma.emailMessage.create({
            data: {
                conversationId: input.conversationId,
                gmailMessageId: input.gmailMessageId,
                gmailThreadId: input.gmailThreadId,
                from: input.from,
                to: Array.isArray(input.to) ? input.to : [input.to],
                subject: input.subject,
                body: input.body,
                bodyPreview: input.bodyPreview,
                direction: input.direction,
                isAiGenerated: input.isAiGenerated || false,
                aiModel: input.aiModel,
                sentAt: input.sentAt,
            },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: input.conversationId },
            data: { updatedAt: new Date() },
        });

        logger.info(
            {
                messageId: message.id,
                conversationId: input.conversationId,
                direction: input.direction,
            },
            "Email message created"
        );

        return message;
    } catch (error) {
        logger.error({ error, input }, "Failed to create email message");
        throw error;
    }
}

/**
 * Get email message by Gmail message ID
 */
export async function getEmailMessageByGmailId(
    gmailMessageId: string
): Promise<EmailMessage | null> {
    try {
        const message = await prisma.emailMessage.findUnique({
            where: { gmailMessageId },
            include: {
                conversation: true,
            },
        });

        return message;
    } catch (error) {
        logger.error(
            { error, gmailMessageId },
            "Failed to get email message by Gmail ID"
        );
        throw error;
    }
}

/**
 * Get all messages in a conversation
 */
export async function getConversationMessages(
    conversationId: string
): Promise<EmailMessage[]> {
    try {
        const messages = await prisma.emailMessage.findMany({
            where: { conversationId },
            orderBy: {
                sentAt: "asc",
            },
        });

        return messages;
    } catch (error) {
        logger.error(
            { error, conversationId },
            "Failed to get conversation messages"
        );
        throw error;
    }
}

/**
 * Find or create customer from email
 */
export async function findOrCreateCustomer(
    email: string,
    name?: string
): Promise<Customer> {
    try {
        // Try to find existing customer
        let customer = await getCustomerByEmail(email);

        if (!customer) {
            // Create new customer
            customer = await createCustomer({
                name: name || email.split("@")[0],
                email,
            });

            logger.info(
                { customerId: customer.id, email },
                "New customer auto-created from email"
            );
        }

        return customer;
    } catch (error) {
        logger.error(
            { error, email },
            "Failed to find or create customer"
        );
        throw error;
    }
}

/**
 * Link lead to customer
 */
export async function linkLeadToCustomer(
    leadId: string,
    customerId: string
): Promise<void> {
    try {
        await prisma.lead.update({
            where: { id: leadId },
            data: { customerId },
        });

        // Update customer stats
        await updateCustomerStats(customerId);

        logger.info({ leadId, customerId }, "Lead linked to customer");
    } catch (error) {
        logger.error(
            { error, leadId, customerId },
            "Failed to link lead to customer"
        );
        throw error;
    }
}
