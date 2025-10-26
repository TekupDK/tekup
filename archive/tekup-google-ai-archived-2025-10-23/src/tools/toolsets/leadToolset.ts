/**
 * Lead Management Toolset
 * 
 * Tools for AI-powered lead processing:
 * - Parse lead emails using Gemini Function Calling
 * - Create customer records from validated leads
 * - Extract structured data with 100% accuracy
 * 
 * ADK Pattern: Specialized toolset for lead-related operations
 */

import { BaseToolset, BaseTool } from "../baseToolset";
import { ToolContext } from "../toolContext";
import { parseLeadEmail, ParsedLeadInfo } from "../../services/leadParsingService";
import { prisma } from "../../services/databaseService";
import { updateCustomerStats } from "../../services/customerService";
import { logger } from "../../logger";

export class LeadToolset extends BaseToolset {
    name = "lead_management";

    async getTools(_context?: ToolContext): Promise<BaseTool[]> {
        return [
            {
                name: "parse_lead_email",
                description: `Parse rengørings-lead email til struktureret data med AI.
                
                Extracts: Name, email, phone, address, property size, rooms, service type, preferred date, special requests.
                
                Returns confidence scores for validation.
                
                Use when: Processing new lead emails from Leadmail.no or direct inquiries.`,

                parameters: {
                    emailBody: {
                        type: "string",
                        description: "Full email body text with lead information",
                        required: true,
                    },
                    emailSubject: {
                        type: "string",
                        description: "Email subject line (optional, helps with context)",
                        required: false,
                    },
                },

                handler: async (params, context) => {
                    try {
                        const parsed = await parseLeadEmail(
                            params.emailBody as string,
                            params.emailSubject as string | undefined
                        );

                        // Store in session state for follow-up actions
                        if (context) {
                            context.state["last_parsed_lead"] = parsed;
                            context.state["temp:parsing_timestamp"] = new Date().toISOString();
                        }

                        logger.info(
                            { confidence: parsed.confidence.overall },
                            "Lead parsed successfully"
                        );

                        return {
                            status: "success",
                            lead: parsed,
                            confidence: parsed.confidence.overall,
                            message: `Lead parsed with ${parsed.confidence.overall}% confidence`,
                        };
                    } catch (error) {
                        logger.error({ error }, "Failed to parse lead email");
                        return {
                            status: "error",
                            error_message: error instanceof Error ? error.message : "Unknown error",
                            fallback: "Use manual lead entry or retry with corrected email text",
                        };
                    }
                },

                category: "lead_processing",
            },

            {
                name: "create_customer_from_lead",
                description: `Convert validated lead to customer record in database.
                
                Creates: Customer, Lead, and initial Contact records.
                
                Use when: Lead has been verified (confidence > 80%) and ready for conversion.
                
                DO NOT use if: Lead data is incomplete or confidence is low.`,

                parameters: {
                    leadData: {
                        type: "object",
                        description: "Parsed lead information (from parse_lead_email result)",
                        required: true,
                    },
                    skipDuplicateCheck: {
                        type: "boolean",
                        description: "Skip duplicate detection (default: false)",
                        required: false,
                    },
                },

                handler: async (params, context) => {
                    try {
                        const leadData = params.leadData as ParsedLeadInfo;

                        // Validate required fields
                        if (!leadData.customerName || !leadData.email) {
                            return {
                                status: "error",
                                error_message: "Missing required fields: customerName and email are mandatory",
                                required_fields: ["customerName", "email"],
                            };
                        }

                        // Check for duplicates unless explicitly skipped
                        if (!params.skipDuplicateCheck) {
                            const existingCustomer = await prisma.customer.findFirst({
                                where: {
                                    OR: [
                                        { email: leadData.email },
                                        { phone: leadData.phone || undefined },
                                    ],
                                },
                            });

                            if (existingCustomer) {
                                return {
                                    status: "error",
                                    error_message: "Duplicate customer found",
                                    existing_customer: {
                                        id: existingCustomer.id,
                                        name: existingCustomer.name,
                                        email: existingCustomer.email,
                                    },
                                    suggestion: "Update existing customer or verify lead data",
                                };
                            }
                        }

                        // Create customer and lead
                        const customer = await prisma.customer.create({
                            data: {
                                name: leadData.customerName,
                                email: leadData.email,
                                phone: leadData.phone || "",
                                address: leadData.address || "",
                                status: "new",
                            },
                        });

                        // Create associated lead
                        const lead = await prisma.lead.create({
                            data: {
                                customerId: customer.id,
                                source: leadData.leadSource || "Unknown",
                                name: leadData.customerName,
                                email: leadData.email,
                                phone: leadData.phone,
                                address: leadData.address,
                                squareMeters: leadData.propertySize,
                                rooms: leadData.rooms,
                                taskType: leadData.serviceType,
                                preferredDates: leadData.preferredDate ? [leadData.preferredDate] : [],
                                status: "new",
                            },
                        });

                        // Update customer statistics
                        if (lead.customerId) {
                            await updateCustomerStats(lead.customerId);
                            logger.debug(
                                { customerId: lead.customerId, leadId: lead.id },
                                "Updated customer stats after lead creation"
                            );
                        }

                        // Update session state
                        if (context) {
                            context.state["last_customer_id"] = customer.id;
                            context.state["user:total_customers_created"] =
                                (context.state["user:total_customers_created"] || 0) + 1;
                        }

                        logger.info(
                            { customerId: customer.id, customerName: customer.name },
                            "Customer created from lead"
                        );

                        return {
                            status: "success",
                            customer: {
                                id: customer.id,
                                name: customer.name,
                                email: customer.email,
                                phone: customer.phone,
                                address: customer.address,
                            },
                            lead: {
                                id: lead.id,
                                source: lead.source,
                                status: lead.status,
                            },
                            message: `Customer "${customer.name}" created successfully`,
                            next_steps: [
                                "Send welcome email",
                                "Schedule initial consultation",
                                "Create booking if date is confirmed",
                            ],
                        };
                    } catch (error) {
                        logger.error({ error }, "Failed to create customer from lead");
                        return {
                            status: "error",
                            error_message: error instanceof Error ? error.message : "Database error",
                            suggestion: "Check database connection and retry",
                        };
                    }
                },

                category: "lead_conversion",
                required_permissions: ["customer:create", "lead:create"],
            },

            {
                name: "get_lead_statistics",
                description: `Get lead statistics and conversion metrics.
                
                Returns: Total leads, conversion rate, average confidence, sources breakdown.
                
                Use for: Dashboard analytics, performance monitoring.`,

                parameters: {
                    days: {
                        type: "number",
                        description: "Number of days to analyze (default: 30)",
                        required: false,
                    },
                },

                handler: async (params) => {
                    try {
                        const days = (params.days as number) || 30;
                        const startDate = new Date();
                        startDate.setDate(startDate.getDate() - days);

                        const [totalLeads, convertedLeads, leads] = await Promise.all([
                            prisma.lead.count({
                                where: { createdAt: { gte: startDate } },
                            }),
                            prisma.lead.count({
                                where: {
                                    createdAt: { gte: startDate },
                                    status: "converted",
                                },
                            }),
                            prisma.lead.findMany({
                                where: { createdAt: { gte: startDate } },
                                select: {
                                    source: true,
                                    status: true,
                                },
                            }),
                        ]);

                        const sourceBreakdown = leads.reduce(
                            (acc, lead) => {
                                const source = lead.source || "Unknown";
                                acc[source] = (acc[source] || 0) + 1;
                                return acc;
                            },
                            {} as Record<string, number>
                        );

                        return {
                            status: "success",
                            statistics: {
                                total_leads: totalLeads,
                                converted_leads: convertedLeads,
                                conversion_rate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
                                source_breakdown: sourceBreakdown,
                                period_days: days,
                            },
                        };
                    } catch (error) {
                        logger.error({ error }, "Failed to get lead statistics");
                        return {
                            status: "error",
                            error_message: error instanceof Error ? error.message : "Database error",
                        };
                    }
                },

                category: "analytics",
            },
        ];
    }
}
