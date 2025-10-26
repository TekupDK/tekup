import { Router } from "express";
import { prisma } from "../services/databaseService";
import { sendGenericEmail } from "../services/gmailService";
import { logger } from "../logger";

const router = Router();

// GET /api/email-approval/pending - List all pending emails
router.get("/pending", async (req, res) => {
  try {
    const pendingEmails = await prisma.emailResponse.findMany({
      where: { status: "pending" },
      include: {
        lead: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(pendingEmails);
  } catch (error) {
    logger.error({ error }, "Failed to fetch pending emails");
    res.status(500).json({ error: "Failed to fetch pending emails" });
  }
});

// POST /api/email-approval/:id/approve - Approve and send email
router.post("/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    // Get email response
    const emailResponse = await prisma.emailResponse.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!emailResponse) {
      return res.status(404).json({ error: "Email not found" });
    }

    if (emailResponse.status !== "pending") {
      return res.status(400).json({ error: "Email already processed" });
    }

    // Send via Gmail
    const result = await sendGenericEmail({
      to: emailResponse.recipientEmail,
      subject: emailResponse.subject,
      body: emailResponse.body,
      threadId: emailResponse.gmailThreadId || undefined,
    });

    // Update status
    await prisma.emailResponse.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
        gmailMessageId: result.id,
      },
    });

    logger.info(`Email approved and sent: ${id} → ${result.id}`);
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    logger.error({ error }, "Failed to approve email");
    res.status(500).json({ error: "Failed to send email" });
  }
});

// POST /api/email-approval/:id/reject - Reject email
router.post("/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const emailResponse = await prisma.emailResponse.findUnique({
      where: { id },
    });

    if (!emailResponse) {
      return res.status(404).json({ error: "Email not found" });
    }

    if (emailResponse.status !== "pending") {
      return res.status(400).json({ error: "Email already processed" });
    }

    await prisma.emailResponse.update({
      where: { id },
      data: {
        status: "rejected",
        rejectedReason: reason,
      },
    });

    logger.info(`Email rejected: ${id} - Reason: ${reason}`);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Failed to reject email");
    res.status(500).json({ error: "Failed to reject email" });
  }
});

// PUT /api/email-approval/:id/edit - Edit email before approval
router.put("/:id/edit", async (req, res) => {
  const { id } = req.params;
  const { subject, body } = req.body;

  try {
    const emailResponse = await prisma.emailResponse.findUnique({
      where: { id },
    });

    if (!emailResponse) {
      return res.status(404).json({ error: "Email not found" });
    }

    if (emailResponse.status !== "pending") {
      return res.status(400).json({ error: "Cannot edit processed email" });
    }

    const updated = await prisma.emailResponse.update({
      where: { id },
      data: {
        subject: subject || emailResponse.subject,
        body: body || emailResponse.body,
      },
    });

    logger.info(`Email edited: ${id}`);
    res.json(updated);
  } catch (error) {
    logger.error({ error }, "Failed to edit email");
    res.status(500).json({ error: "Failed to edit email" });
  }
});

// GET /api/email-approval/stats - Get approval statistics
router.get("/stats", async (req, res) => {
  try {
    const [pending, sent, rejected] = await Promise.all([
      prisma.emailResponse.count({ where: { status: "pending" } }),
      prisma.emailResponse.count({ where: { status: "sent" } }),
      prisma.emailResponse.count({ where: { status: "rejected" } }),
    ]);

    res.json({
      pending,
      sent,
      rejected,
      total: pending + sent + rejected,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch email stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;

