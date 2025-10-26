import { Router, Request, Response } from "express";
import {
  listLabels,
  ensureStandardLabels,
  getOrCreateLabel,
  addLabelsToMessage,
  removeLabelsFromMessage,
  moveMessageLabel,
  bulkAddLabels,
  bulkMoveLabels,
  getMessagesByLabel,
  STANDARD_LABELS,
} from "../services/gmailLabelService";
import { logger } from "../logger";

const router = Router();

// List all Gmail labels
router.get("/", async (_req: Request, res: Response) => {
  try {
    const labels = await listLabels();
    res.json({ success: true, data: labels, count: labels.length });
  } catch (error) {
    logger.error({ error }, "Failed to list labels");
    res.status(500).json({ success: false, error: "Failed to list labels" });
  }
});

// Ensure all standard labels exist
router.post("/ensure-standard", async (_req: Request, res: Response) => {
  try {
    await ensureStandardLabels();
    res.json({ success: true, message: "All standard labels verified", labels: STANDARD_LABELS });
  } catch (error) {
    logger.error({ error }, "Failed to ensure standard labels");
    res.status(500).json({ success: false, error: "Failed to ensure standard labels" });
  }
});

// Create a custom label
router.post("/create", async (req: Request, res: Response) => {
  try {
    const { labelName } = req.body as { labelName?: string };
    if (!labelName || typeof labelName !== "string") {
      return res.status(400).json({ success: false, error: "labelName is required" });
    }
    const labelId = await getOrCreateLabel(labelName);
    res.json({ success: true, labelId, labelName });
  } catch (error) {
    logger.error({ error }, "Failed to create label");
    res.status(500).json({ success: false, error: "Failed to create label" });
  }
});

// Add labels to a message
router.post("/message/:messageId/labels", async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { labels } = req.body as { labels?: string | string[] };
    if (!messageId || !labels) {
      return res.status(400).json({ success: false, error: "messageId and labels are required" });
    }
    await addLabelsToMessage(messageId, labels);
    res.json({ success: true, messageId, labels: Array.isArray(labels) ? labels : [labels] });
  } catch (error) {
    logger.error({ error }, "Failed to add labels to message");
    res.status(500).json({ success: false, error: "Failed to add labels to message" });
  }
});

// Remove labels from a message
router.delete("/message/:messageId/labels", async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { labels } = req.body as { labels?: string | string[] };
    if (!messageId || !labels) {
      return res.status(400).json({ success: false, error: "messageId and labels are required" });
    }
    await removeLabelsFromMessage(messageId, labels);
    res.json({ success: true, messageId, labels: Array.isArray(labels) ? labels : [labels] });
  } catch (error) {
    logger.error({ error }, "Failed to remove labels from message");
    res.status(500).json({ success: false, error: "Failed to remove labels from message" });
  }
});

// Move a message from one label to another
router.post("/message/:messageId/move-label", async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { fromLabel, toLabel } = req.body as { fromLabel?: string; toLabel?: string };
    if (!messageId || !fromLabel || !toLabel) {
      return res.status(400).json({ success: false, error: "messageId, fromLabel and toLabel are required" });
    }
    await moveMessageLabel(messageId, fromLabel, toLabel);
    res.json({ success: true, messageId, fromLabel, toLabel });
  } catch (error) {
    logger.error({ error }, "Failed to move message label");
    res.status(500).json({ success: false, error: "Failed to move message label" });
  }
});

// Get messages by label
router.get("/:labelName/messages", async (req: Request, res: Response) => {
  try {
    const { labelName } = req.params;
    const maxResults = parseInt((req.query.maxResults as string) || "50", 10);
    const messages = await getMessagesByLabel(labelName, isNaN(maxResults) ? 50 : maxResults);
    res.json({ success: true, data: messages, count: messages.length, label: labelName });
  } catch (error) {
    logger.error({ error }, "Failed to get messages by label");
    res.status(500).json({ success: false, error: "Failed to get messages by label" });
  }
});

// Bulk add labels
router.post("/bulk/add", async (req: Request, res: Response) => {
  try {
    const { messageIds, labels } = req.body as { messageIds?: string[]; labels?: string | string[] };
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0 || !labels) {
      return res.status(400).json({ success: false, error: "messageIds[] and labels are required" });
    }
    await bulkAddLabels(messageIds, labels);
    res.json({ success: true, count: messageIds.length });
  } catch (error) {
    logger.error({ error }, "Failed bulk label add");
    res.status(500).json({ success: false, error: "Failed to bulk add labels" });
  }
});

// Bulk move labels
router.post("/bulk/move", async (req: Request, res: Response) => {
  try {
    const { messageIds, fromLabel, toLabel } = req.body as { messageIds?: string[]; fromLabel?: string; toLabel?: string };
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0 || !fromLabel || !toLabel) {
      return res.status(400).json({ success: false, error: "messageIds[], fromLabel and toLabel are required" });
    }
    await bulkMoveLabels(messageIds, fromLabel, toLabel);
    res.json({ success: true, count: messageIds.length, fromLabel, toLabel });
  } catch (error) {
    logger.error({ error }, "Failed bulk label move");
    res.status(500).json({ success: false, error: "Failed to bulk move labels" });
  }
});

export default router;
