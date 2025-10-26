import { Router, Request, Response } from "express";
import { checkDuplicateCustomer, registerCustomer } from "../services/duplicateDetectionService";
import { logger } from "../logger";

const router = Router();

/**
 * POST /api/leads/check-duplicate
 * Check if customer email already exists and determine action
 * Body: { email: string }
 * 
 * Returns:
 * - isDuplicate: boolean
 * - action: "STOP" | "WARN" | "OK"
 * - customer: Customer details if found
 * - recommendation: Human-readable action recommendation
 */
router.post("/check-duplicate", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email address is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    const result = await checkDuplicateCustomer(email.toLowerCase().trim());

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error({ error }, "Failed to check duplicate customer");
    res.status(500).json({
      success: false,
      error: "Failed to check customer duplicate status",
    });
  }
});

/**
 * POST /api/leads/register
 * Register new customer after passing duplicate check
 * Body: { name: string, email: string, phone?: string, address?: string, source?: string }
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, source } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // First check for duplicate
    const duplicateCheck = await checkDuplicateCustomer(email.toLowerCase().trim());

    if (duplicateCheck.action === "STOP") {
      return res.status(409).json({
        success: false,
        error: "Customer already exists with recent contact",
        duplicate: true,
        ...duplicateCheck,
      });
    }

    // Register customer
    const customerId = await registerCustomer({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      source: source?.trim(),
    });

    res.status(201).json({
      success: true,
      customerId,
      message: "Customer registered successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to register customer");
    res.status(500).json({
      success: false,
      error: "Failed to register customer",
    });
  }
});

export default router;
