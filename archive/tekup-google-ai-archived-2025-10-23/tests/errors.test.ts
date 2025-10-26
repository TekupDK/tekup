import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, createErrorResponse, errorHandler } from "../src/errors";

describe("Error Handling", () => {
    describe("AppError", () => {
        it("creates error with correct properties", () => {
            const error = new AppError("TEST_ERROR", "Test error message", 400, { details: "test" });

            expect(error.code).toBe("TEST_ERROR");
            expect(error.message).toBe("Test error message");
            expect(error.statusCode).toBe(400);
            expect(error.details).toEqual({ details: "test" });
            expect(error.name).toBe("AppError");
        });

        it("uses default status code 500", () => {
            const error = new AppError("TEST_ERROR", "Test error message");

            expect(error.statusCode).toBe(500);
        });
    });

    describe("createErrorResponse", () => {
        it("handles AppError correctly", () => {
            const appError = new AppError("TEST_ERROR", "Test message", 400, { details: "test" });
            const response = createErrorResponse(appError);

            expect(response.error.code).toBe("TEST_ERROR");
            expect(response.error.message).toBe("Test message");
            expect(response.error.details).toEqual({ details: "test" });
            expect(response.error.timestamp).toBeDefined();
        });

        it("handles ZodError correctly", () => {
            // Create a real ZodError by trying to parse invalid data
            const schema = z.object({ field: z.string() });
            let zodError;
            try {
                schema.parse({});
            } catch (error) {
                zodError = error;
            }

            const response = createErrorResponse(zodError);

            expect(response.error.code).toBe("VALIDATION_ERROR");
            expect(response.error.message).toBe("Invalid input data");
            expect(response.error.details).toBeDefined();
        });

        it("handles generic Error correctly", () => {
            const genericError = new Error("Generic error");
            const response = createErrorResponse(genericError);

            expect(response.error.code).toBe("INTERNAL_ERROR");
            expect(response.error.message).toBe("An unexpected error occurred");
            expect(response.error.timestamp).toBeDefined();
        });

        it("handles unknown error types", () => {
            const response = createErrorResponse("string error");

            expect(response.error.code).toBe("UNKNOWN_ERROR");
            expect(response.error.message).toBe("An unknown error occurred");
            expect(response.error.timestamp).toBeDefined();
        });
    });

    describe("errorHandler", () => {
        it("returns correct status code for AppError", () => {
            const appError = new AppError("TEST_ERROR", "Test message", 400);
            const { response, statusCode } = errorHandler(appError);

            expect(statusCode).toBe(400);
            expect(response.error.code).toBe("TEST_ERROR");
        });

        it("returns 400 for validation errors", () => {
            // Create a real ZodError
            const schema = z.object({ field: z.string() });
            let zodError;
            try {
                schema.parse({});
            } catch (error) {
                zodError = error;
            }

            const { response, statusCode } = errorHandler(zodError);

            expect(statusCode).toBe(400);
            expect(response.error.code).toBe("VALIDATION_ERROR");
        });

        it("returns 500 for unknown errors", () => {
            const unknownError = new Error("Unknown error");
            const { response, statusCode } = errorHandler(unknownError);

            expect(statusCode).toBe(500);
            expect(response.error.code).toBe("INTERNAL_ERROR");
        });
    });
});
