import { Router, Request, Response } from "express";
import { sendGenericEmail } from "../services/gmailService";
import { moveMessageLabel, addLabelsToMessage } from "../services/gmailLabelService";
import { logger } from "../logger";

const router = Router();

/**
 * POST /api/quotes/send
 * Send AI-generated quote to customer via Gmail
 * 
 * Body: {
 *   to: string (customer email),
 *   subject: string,
 *   body: string,
 *   leadId?: string (optional, for tracking),
 *   emailId?: string (optional, for label update),
 *   threadId?: string (optional, for threading)
 * }
 */
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { to, subject, body, leadId, emailId, threadId } = req.body;

    // Validation
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: to, subject, body",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address format",
      });
    }

    logger.info({ to, subject, leadId }, "Sending quote email");

    // STEP 1: Send email via Gmail
    const sentMessage = await sendGenericEmail({
      to,
      subject,
      body,
      threadId: threadId || undefined, // Reply to existing thread if provided
    });

    if (!sentMessage || !sentMessage.id) {
      throw new Error("Failed to send email - no message ID returned");
    }

    logger.info({ messageId: sentMessage.id, to }, "Email sent successfully");

    // STEP 2: Update Gmail labels (move to "Venter på svar")
    try {
      // Add "Venter på svar" label to sent message
      await addLabelsToMessage(sentMessage.id, ["Venter på svar"]);

      // If we have original emailId (from lead), update its label too
      if (emailId) {
        await moveMessageLabel(emailId, "Leads", "Venter på svar");
        logger.info({ emailId }, "Lead label updated to 'Venter på svar'");
      }
    } catch (labelError) {
      logger.warn({ error: labelError }, "Failed to update labels, but email was sent");
      // Don't fail the request if labels fail - email is already sent
    }

    // STEP 3: TODO: Create Quote record in database
    // This would link the quote to the lead/customer for tracking
    // For now, we just return success

    res.json({
      success: true,
      data: {
        messageId: sentMessage.id,
        to,
        subject,
        sentAt: new Date().toISOString(),
      },
      message: "Quote sent successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to send quote");
    res.status(500).json({
      success: false,
      error: "Failed to send quote email",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/quotes/pending
 * Get all pending quotes (for approval workflow)
 * 
 * Returns quotes that are generated but not yet sent
 */
router.get("/pending", async (_req: Request, res: Response) => {
  try {
    // TODO: Implement database query for pending quotes
    // For now, return empty array
    res.json({
      success: true,
      data: [],
      message: "Pending quotes endpoint - TODO: implement database query",
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch pending quotes");
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending quotes",
    });
  }
});

/**
 * PUT /api/quotes/:id/approve
 * Approve a quote and send it
 * 
 * This endpoint would be used in a workflow where quotes are
 * generated and stored for approval before sending
 */
router.put("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implement quote approval workflow
    // 1. Fetch quote from database
    // 2. Validate quote is in "pending" state
    // 3. Send email (call /api/quotes/send internally)
    // 4. Update quote status to "sent"

    res.json({
      success: true,
      message: "Quote approval endpoint - TODO: implement",
      quoteId: id,
    });
  } catch (error) {
    logger.error({ error }, "Failed to approve quote");
    res.status(500).json({
      success: false,
      error: "Failed to approve quote",
    });
  }
});

export default router;




