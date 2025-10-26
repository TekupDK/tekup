import { Router, Request, Response } from "express";
import { parseLeadEmail, validateParsedLead, formatParsedLead, calculateEstimatedPrice } from "../services/leadParsingService";
import { checkDuplicateCustomer } from "../services/duplicateDetectionService";
import { findAvailableSlots, formatSlotsForQuote } from "../services/slotFinderService";
import { generateQuote, generateQuoteHTML } from "../services/quoteGenerationService";
import { logger } from "../logger";

const router = Router();

/**
 * POST /api/leads/parse
 * Parse lead email to extract key information using AI
 * 
 * Body: {
 *   emailBody: string,
 *   emailSubject?: string
 * }
 */
router.post("/parse", async (req: Request, res: Response) => {
  try {
    const { emailBody, emailSubject } = req.body;

    if (!emailBody || typeof emailBody !== "string") {
      return res.status(400).json({
        success: false,
        error: "emailBody is required",
      });
    }

    const parsed = await parseLeadEmail(emailBody, emailSubject);
    const validation = validateParsedLead(parsed);
    const formatted = formatParsedLead(parsed);

    res.json({
      success: true,
      data: parsed,
      validation,
      formatted,
    });
  } catch (error) {
    logger.error({ error }, "Failed to parse lead email");
    res.status(500).json({
      success: false,
      error: "Failed to parse lead email",
    });
  }
});

/**
 * POST /api/leads/process
 * Complete lead processing workflow:
 * 1. Parse lead information
 * 2. Check for duplicate
 * 3. Calculate price estimate
 * 4. Find available slots
 * 5. Generate quote draft (ready to send)
 * 
 * Body: {
 *   emailBody: string,
 *   emailSubject?: string,
 *   emailId?: string,
 *   threadId?: string
 * }
 */
router.post("/process", async (req: Request, res: Response) => {
  try {
    const { emailBody, emailSubject, emailId, threadId } = req.body;

    if (!emailBody) {
      return res.status(400).json({
        success: false,
        error: "emailBody is required",
      });
    }

    logger.info({ emailId }, "Starting complete lead processing workflow");

    // STEP 1: Parse lead information with AI
    const parsed = await parseLeadEmail(emailBody, emailSubject);
    const validation = validateParsedLead(parsed);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Insufficient lead information",
        parsed,
        validation,
        message: `Missing: ${validation.missingFields.join(", ")}`,
      });
    }

    // STEP 2: Check for duplicate (CRITICAL - MEMORY_8 rule!)
    let duplicateCheck = null;
    if (parsed.email) {
      duplicateCheck = await checkDuplicateCustomer(parsed.email);

      if (duplicateCheck.action === "STOP") {
        return res.status(409).json({
          success: false,
          error: "Duplicate customer detected",
          duplicate: true,
          duplicateCheck,
          message: duplicateCheck.recommendation,
        });
      }
    }

    // STEP 3: Calculate price estimate
    const priceEstimate = calculateEstimatedPrice(
      parsed.propertySize,
      parsed.serviceType,
      parsed.rooms
    );

    // STEP 4: Find available calendar slots
    const availableSlots = await findAvailableSlots({
      durationMinutes: priceEstimate.estimatedHours * 60,
      numberOfSlots: 5,
      maxDaysToSearch: 14,
    });

    const formattedSlots = formatSlotsForQuote(availableSlots);

    // STEP 5: Generate quote with AI
    console.log("🤖 Generating quote with AI...");
    const generatedQuote = await generateQuote({
      parsedLead: parsed,
      priceEstimate,
      availableSlots,
      leadSource: parsed.leadSource,
      includeSpecialRequests: true,
    });

    // STEP 6: Prepare complete quote draft
    const quoteDraft = {
      customer: {
        name: parsed.customerName,
        email: parsed.email,
        phone: parsed.phone,
        address: parsed.address,
      },
      service: {
        type: parsed.serviceType,
        propertySize: parsed.propertySize,
        rooms: parsed.rooms,
        specialRequests: parsed.specialRequests,
      },
      estimate: priceEstimate,
      availableSlots: {
        slots: availableSlots,
        formatted: formattedSlots,
      },
      quote: {
        subject: generatedQuote.subject,
        body: generatedQuote.body,
        bodyHtml: generateQuoteHTML(generatedQuote),
      },
      metadata: {
        emailId,
        threadId,
        leadSource: parsed.leadSource,
        processedAt: new Date().toISOString(),
        generatedAt: generatedQuote.metadata.generatedAt,
      },
    };

    res.json({
      success: true,
      data: quoteDraft,
      parsed,
      validation,
      duplicateCheck: duplicateCheck?.action === "WARN" ? duplicateCheck : undefined,
      message: validation.needsManualReview
        ? "⚠️ Low confidence - please review before sending"
        : "✅ Lead processed successfully - quote ready to send",
    });
  } catch (error) {
    logger.error({ error }, "Failed to process lead");
    res.status(500).json({
      success: false,
      error: "Failed to process lead",
    });
  }
});

/**
 * POST /api/leads/estimate-price
 * Calculate price estimate based on property details
 * 
 * Body: {
 *   propertySize?: number,
 *   serviceType?: string,
 *   rooms?: number
 * }
 */
router.post("/estimate-price", async (req: Request, res: Response) => {
  try {
    const { propertySize, serviceType, rooms } = req.body;

    const estimate = calculateEstimatedPrice(propertySize, serviceType, rooms);

    res.json({
      success: true,
      data: estimate,
      formatted: {
        hours: `${estimate.estimatedHours} timer på stedet`,
        laborHours: `${estimate.totalLaborHours} arbejdstimer total`,
        workers: `${estimate.workers} personer`,
        price: `${estimate.priceMin.toLocaleString()}-${estimate.priceMax.toLocaleString()} kr inkl. moms`,
        hourlyRate: `${estimate.hourlyRate} kr/time/person`,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to estimate price");
    res.status(500).json({
      success: false,
      error: "Failed to calculate price estimate",
    });
  }
});

export default router;

