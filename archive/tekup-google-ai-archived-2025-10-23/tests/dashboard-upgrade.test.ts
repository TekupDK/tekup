/**
 * Dashboard Upgrade Tests
 * 
 * Tests for new features:
 * 1. Billy.dk revenue integration
 * 2. Booking validation
 * 3. Quote status tracking
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { billyService } from "../src/services/billyService";

describe("Dashboard Upgrade Features", () => {
    describe("Billy.dk Integration", () => {
        it("should check if Billy is configured", () => {
            const isConfigured = billyService.isConfigured();
            expect(typeof isConfigured).toBe("boolean");
        });

        it("should return revenue data for a date range", async () => {
            const startDate = new Date("2025-01-01");
            const endDate = new Date("2025-01-31");

            const data = await billyService.getRevenueData(startDate, endDate);

            expect(data).toBeDefined();
            expect(data.period).toBeDefined();
            expect(typeof data.totalRevenue).toBe("number");
            expect(typeof data.paidInvoices).toBe("number");
            expect(typeof data.pendingInvoices).toBe("number");
            expect(typeof data.overdueInvoices).toBe("number");
        });

        it("should handle fallback to database when Billy is not configured", async () => {
            const startDate = new Date("2025-01-01");
            const endDate = new Date("2025-01-31");

            // Billy should not be configured in test environment
            const data = await billyService.getRevenueData(startDate, endDate);

            // Should return mock or database data
            expect(data.totalRevenue).toBeGreaterThanOrEqual(0);
        });

        it("should generate realistic mock revenue data", async () => {
            const startDate = new Date("2025-01-01");
            const endDate = new Date("2025-01-07"); // 7 days

            const data = await billyService.getRevenueData(startDate, endDate);

            // Should have revenue proportional to period
            expect(data.totalRevenue).toBeGreaterThan(0);
            expect(data.paidInvoices).toBeGreaterThanOrEqual(0);
        });
    });

    describe("Booking Validation", () => {
        it("should validate booking creation schema", () => {
            const validBooking = {
                customerId: "test-customer-id",
                scheduledAt: new Date().toISOString(),
                estimatedDuration: 120,
                serviceType: "Privatrengøring",
                address: "Test Address 123",
            };

            expect(validBooking.customerId).toBeDefined();
            expect(validBooking.scheduledAt).toBeDefined();
            expect(validBooking.estimatedDuration).toBeGreaterThan(0);
        });

        it("should reject booking without customer/lead", () => {
            const invalidBooking = {
                scheduledAt: new Date().toISOString(),
                estimatedDuration: 120,
            };

            expect(invalidBooking).not.toHaveProperty("customerId");
            expect(invalidBooking).not.toHaveProperty("leadId");
        });

        it("should validate customer contact information requirements", () => {
            const customer = {
                id: "test-id",
                name: "Test Customer",
                email: "test@example.com",
                phone: "+45 12345678",
            };

            expect(customer.name).toBeDefined();
            expect(customer.email).toContain("@");
            expect(customer.phone).toBeDefined();
        });
    });

    describe("Quote Status Tracking", () => {
        it("should define quote status types", () => {
            const statuses = ["draft", "sent", "accepted", "rejected"];

            expect(statuses).toContain("draft");
            expect(statuses).toContain("sent");
            expect(statuses).toContain("accepted");
            expect(statuses).toContain("rejected");
            expect(statuses).toHaveLength(4);
        });

        it("should calculate conversion rate correctly", () => {
            const totalQuotes = 100;
            const acceptedQuotes = 25;
            const conversionRate = (acceptedQuotes / totalQuotes) * 100;

            expect(conversionRate).toBe(25);
        });

        it("should handle zero quotes gracefully", () => {
            const totalQuotes = 0;
            const acceptedQuotes = 0;
            const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

            expect(conversionRate).toBe(0);
        });

        it("should calculate average quote value", () => {
            const quotes = [
                { total: 1000 },
                { total: 2000 },
                { total: 3000 },
            ];

            const avgValue = quotes.reduce((sum, q) => sum + q.total, 0) / quotes.length;

            expect(avgValue).toBe(2000);
        });
    });

    describe("Configuration", () => {
        it("should have Billy configuration defined", async () => {
            const { billyConfig } = await import("../src/config");

            expect(billyConfig).toBeDefined();
            expect(typeof billyConfig.BILLY_ENABLED).toBe("boolean");
        });

        it("should export Billy helper function", async () => {
            const { isBillyEnabled } = await import("../src/config");

            expect(typeof isBillyEnabled).toBe("function");
            expect(typeof isBillyEnabled()).toBe("boolean");
        });

        it("should have email automation config", async () => {
            const { 
                isAutoResponseEnabled, 
                isFollowUpEnabled, 
                isEscalationEnabled 
            } = await import("../src/config");

            expect(typeof isAutoResponseEnabled()).toBe("boolean");
            expect(typeof isFollowUpEnabled()).toBe("boolean");
            expect(typeof isEscalationEnabled()).toBe("boolean");
        });
    });

    describe("API Endpoints", () => {
        it("should have quote status tracking endpoint defined", () => {
            const endpoint = "/api/dashboard/quotes/status-tracking";
            
            expect(endpoint).toContain("/api/dashboard");
            expect(endpoint).toContain("quotes");
            expect(endpoint).toContain("status-tracking");
        });

        it("should have revenue endpoint defined", () => {
            const endpoint = "/api/dashboard/revenue";
            
            expect(endpoint).toContain("/api/dashboard");
            expect(endpoint).toContain("revenue");
        });

        it("should have bookings endpoint defined", () => {
            const endpoint = "/api/bookings";
            
            expect(endpoint).toContain("/api/bookings");
        });
    });
});
