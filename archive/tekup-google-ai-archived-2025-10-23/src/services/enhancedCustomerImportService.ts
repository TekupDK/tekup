import { prisma } from "./databaseService";
import { logger } from "../logger";
import { findOrCreateCustomer, linkLeadToCustomer, updateCustomerStats } from "./customerService";
import { createBookingWithCalendar } from "./calendarService";
import { sendBookingConfirmation } from "./bookingConfirmation";
import type { ParsedLead } from "./leadParser";

/**
 * Enhanced Customer Import Service
 * 
 * Provides comprehensive customer import functionality with data validation,
 * duplicate detection, and automatic calendar synchronization
 */

export interface CustomerImportOptions {
    validateData?: boolean;
    createBookings?: boolean;
    sendConfirmations?: boolean;
    dryRun?: boolean;
    batchSize?: number;
}

export interface ImportResult {
    success: boolean;
    customersProcessed: number;
    customersCreated: number;
    customersUpdated: number;
    bookingsCreated: number;
    errors: string[];
    warnings: string[];
    processingTime: number;
}

export interface CustomerImportData {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    notes?: string;
    tags?: string[];
    // Historical data
    totalLeads?: number;
    totalBookings?: number;
    totalRevenue?: number;
    lastContactAt?: Date;
    // Booking data
    bookings?: Array<{
        startTime: Date;
        endTime: Date;
        serviceType: string;
        status: string;
        notes?: string;
    }>;
}

class EnhancedCustomerImportService {
    /**
     * Import customers from various data sources
     */
    async importCustomers(
        customers: CustomerImportData[],
        options: CustomerImportOptions = {}
    ): Promise<ImportResult> {
        const {
            validateData = true,
            createBookings = true,
            sendConfirmations = false,
            dryRun = false,
            batchSize = 50
        } = options;

        const startTime = Date.now();
        const result: ImportResult = {
            success: true,
            customersProcessed: 0,
            customersCreated: 0,
            customersUpdated: 0,
            bookingsCreated: 0,
            errors: [],
            warnings: [],
            processingTime: 0
        };

        logger.info(
            { customerCount: customers.length, options },
            "Starting enhanced customer import"
        );

        try {
            // Process customers in batches
            for (let i = 0; i < customers.length; i += batchSize) {
                const batch = customers.slice(i, i + batchSize);
                await this.processBatch(batch, result, options);
            }

            result.processingTime = Date.now() - startTime;

            logger.info(
                {
                    processed: result.customersProcessed,
                    created: result.customersCreated,
                    updated: result.customersUpdated,
                    bookingsCreated: result.bookingsCreated,
                    errors: result.errors.length,
                    processingTime: result.processingTime
                },
                "Customer import completed"
            );

        } catch (error) {
            logger.error({ error }, "Customer import failed");
            result.success = false;
            result.errors.push(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        return result;
    }

    /**
     * Process a batch of customers
     */
    private async processBatch(
        customers: CustomerImportData[],
        result: ImportResult,
        options: CustomerImportOptions
    ): Promise<void> {
        for (const customerData of customers) {
            try {
                await this.processCustomer(customerData, result, options);
                result.customersProcessed++;
            } catch (error) {
                result.errors.push(`Failed to process customer ${customerData.name}: ${error}`);
            }
        }
    }

    /**
     * Process a single customer
     */
    private async processCustomer(
        customerData: CustomerImportData,
        result: ImportResult,
        options: CustomerImportOptions
    ): Promise<void> {
        // Validate data if requested
        if (options.validateData) {
            const validation = this.validateCustomerData(customerData);
            if (!validation.valid) {
                result.errors.push(`Validation failed for ${customerData.name}: ${validation.errors.join(", ")}`);
                return;
            }
            if (validation.warnings.length > 0) {
                result.warnings.push(...validation.warnings.map(w => `${customerData.name}: ${w}`));
            }
        }

        // Find or create customer
        let customer;
        if (customerData.email) {
            customer = await findOrCreateCustomer(customerData.email, customerData.name);
            
            // Update customer with additional data
            if (customerData.phone || customerData.address || customerData.companyName || customerData.notes || customerData.tags) {
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        ...(customerData.phone && { phone: customerData.phone }),
                        ...(customerData.address && { address: customerData.address }),
                        ...(customerData.companyName && { companyName: customerData.companyName }),
                        ...(customerData.notes && { notes: customerData.notes }),
                        ...(customerData.tags && { tags: customerData.tags }),
                        ...(customerData.lastContactAt && { lastContactAt: customerData.lastContactAt })
                    }
                });
                result.customersUpdated++;
            } else {
                result.customersCreated++;
            }
        } else {
            // Create customer without email
            customer = await prisma.customer.create({
                data: {
                    name: customerData.name,
                    phone: customerData.phone,
                    address: customerData.address,
                    companyName: customerData.companyName,
                    notes: customerData.notes,
                    tags: customerData.tags || [],
                    ...(customerData.lastContactAt && { lastContactAt: customerData.lastContactAt })
                }
            });
            result.customersCreated++;
        }

        // Create bookings if requested
        if (options.createBookings && customerData.bookings && customerData.bookings.length > 0) {
            await this.createCustomerBookings(customer, customerData.bookings, result, options);
        }

        // Update customer statistics
        await updateCustomerStats(customer.id);
    }

    /**
     * Validate customer data
     */
    private validateCustomerData(customerData: CustomerImportData): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Required fields
        if (!customerData.name || customerData.name.trim().length === 0) {
            errors.push("Name is required");
        }

        // Email validation
        if (customerData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerData.email)) {
                errors.push("Invalid email format");
            }
        } else {
            warnings.push("No email provided - customer will be created without email");
        }

        // Phone validation
        if (customerData.phone) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
            if (!phoneRegex.test(customerData.phone)) {
                warnings.push("Phone number format may be invalid");
            }
        }

        // Revenue validation
        if (customerData.totalRevenue !== undefined && customerData.totalRevenue < 0) {
            errors.push("Total revenue cannot be negative");
        }

        // Booking validation
        if (customerData.bookings) {
            for (const [index, booking] of customerData.bookings.entries()) {
                if (booking.startTime >= booking.endTime) {
                    errors.push(`Booking ${index + 1}: Start time must be before end time`);
                }
                if (booking.startTime < new Date()) {
                    warnings.push(`Booking ${index + 1}: Start time is in the past`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Create bookings for a customer
     */
    private async createCustomerBookings(
        customer: any,
        bookings: Array<{
            startTime: Date;
            endTime: Date;
            serviceType: string;
            status: string;
            notes?: string;
        }>,
        result: ImportResult,
        options: CustomerImportOptions
    ): Promise<void> {
        for (const bookingData of bookings) {
            try {
                if (options.dryRun) {
                    logger.info(
                        { customerId: customer.id, bookingData },
                        "Would create booking (dry run)"
                    );
                    result.bookingsCreated++;
                    continue;
                }

                // Create booking with calendar event
                const { booking, calendarEvent } = await createBookingWithCalendar({
                    leadId: "imported", // Use a special lead ID for imported bookings
                    summary: `${bookingData.serviceType} - ${customer.name}`,
                    description: bookingData.notes || `Imported booking for ${customer.name}`,
                    startTime: bookingData.startTime,
                    endTime: bookingData.endTime,
                    attendees: customer.email ? [{
                        email: customer.email,
                        displayName: customer.name
                    }] : undefined,
                    location: customer.address,
                    notes: bookingData.notes
                });

                // Update booking status
                await prisma.booking.update({
                    where: { id: booking.id },
                    data: { status: bookingData.status }
                });

                // Send confirmation if requested
                if (options.sendConfirmations && customer.email) {
                    try {
                        await sendBookingConfirmation({
                            lead: {
                                name: customer.name,
                                email: customer.email,
                                address: customer.address
                            } as ParsedLead,
                            eventId: calendarEvent.id,
                            start: bookingData.startTime.toISOString(),
                            end: bookingData.endTime.toISOString(),
                            location: customer.address,
                            htmlLink: calendarEvent.htmlLink,
                            durationMinutes: Math.round((bookingData.endTime.getTime() - bookingData.startTime.getTime()) / (60 * 1000))
                        });
                    } catch (error) {
                        result.warnings.push(`Failed to send confirmation for booking ${booking.id}: ${error}`);
                    }
                }

                result.bookingsCreated++;
                logger.info(
                    { customerId: customer.id, bookingId: booking.id },
                    "Created booking for imported customer"
                );

            } catch (error) {
                result.errors.push(`Failed to create booking for ${customer.name}: ${error}`);
            }
        }
    }

    /**
     * Import customers from CSV data
     */
    async importFromCSV(
        csvData: string,
        options: CustomerImportOptions = {}
    ): Promise<ImportResult> {
        try {
            const customers = this.parseCSVData(csvData);
            return await this.importCustomers(customers, options);
        } catch (error) {
            logger.error({ error }, "CSV import failed");
            return {
                success: false,
                customersProcessed: 0,
                customersCreated: 0,
                customersUpdated: 0,
                bookingsCreated: 0,
                errors: [`CSV parsing failed: ${error}`],
                warnings: [],
                processingTime: 0
            };
        }
    }

    /**
     * Parse CSV data into customer objects
     */
    private parseCSVData(csvData: string): CustomerImportData[] {
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const customers: CustomerImportData[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const customer: CustomerImportData = {
                name: values[0] || '',
                email: values[1] || undefined,
                phone: values[2] || undefined,
                address: values[3] || undefined,
                companyName: values[4] || undefined,
                notes: values[5] || undefined,
                tags: values[6] ? values[6].split(';').map(t => t.trim()) : undefined,
                totalLeads: values[7] ? parseInt(values[7]) : undefined,
                totalBookings: values[8] ? parseInt(values[8]) : undefined,
                totalRevenue: values[9] ? parseFloat(values[9]) : undefined,
                lastContactAt: values[10] ? new Date(values[10]) : undefined
            };

            customers.push(customer);
        }

        return customers;
    }

    /**
     * Export customers to CSV
     */
    async exportToCSV(customerIds?: string[]): Promise<string> {
        const customers = await prisma.customer.findMany({
            where: customerIds ? { id: { in: customerIds } } : {},
            include: {
                bookings: {
                    where: { status: { not: "cancelled" } }
                }
            }
        });

        const headers = [
            'Name',
            'Email',
            'Phone',
            'Address',
            'Company',
            'Notes',
            'Tags',
            'Total Leads',
            'Total Bookings',
            'Total Revenue',
            'Last Contact',
            'Created At'
        ];

        const rows = customers.map(customer => [
            customer.name,
            customer.email || '',
            customer.phone || '',
            customer.address || '',
            customer.companyName || '',
            customer.notes || '',
            customer.tags.join(';'),
            customer.totalLeads.toString(),
            customer.totalBookings.toString(),
            customer.totalRevenue.toString(),
            customer.lastContactAt?.toISOString() || '',
            customer.createdAt.toISOString()
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Get import statistics
     */
    async getImportStatistics(): Promise<{
        totalCustomers: number;
        customersWithEmail: number;
        customersWithPhone: number;
        customersWithAddress: number;
        totalBookings: number;
        totalRevenue: number;
    }> {
        const [
            totalCustomers,
            customersWithEmail,
            customersWithPhone,
            customersWithAddress,
            totalBookings,
            totalRevenue
        ] = await Promise.all([
            prisma.customer.count(),
            prisma.customer.count({ where: { email: { not: null } } }),
            prisma.customer.count({ where: { phone: { not: null } } }),
            prisma.customer.count({ where: { address: { not: null } } }),
            prisma.booking.count({ where: { status: { not: "cancelled" } } }),
            prisma.customer.aggregate({
                _sum: { totalRevenue: true }
            }).then(result => result._sum.totalRevenue || 0)
        ]);

        return {
            totalCustomers,
            customersWithEmail,
            customersWithPhone,
            customersWithAddress,
            totalBookings,
            totalRevenue
        };
    }
}

// Export singleton instance
export const enhancedCustomerImportService = new EnhancedCustomerImportService();

// Export convenience functions
export async function importCustomers(
    customers: CustomerImportData[],
    options?: CustomerImportOptions
): Promise<ImportResult> {
    return enhancedCustomerImportService.importCustomers(customers, options);
}

export async function importFromCSV(
    csvData: string,
    options?: CustomerImportOptions
): Promise<ImportResult> {
    return enhancedCustomerImportService.importFromCSV(csvData, options);
}

export async function exportCustomersToCSV(customerIds?: string[]): Promise<string> {
    return enhancedCustomerImportService.exportToCSV(customerIds);
}

export async function getCustomerImportStatistics() {
    return enhancedCustomerImportService.getImportStatistics();
}
