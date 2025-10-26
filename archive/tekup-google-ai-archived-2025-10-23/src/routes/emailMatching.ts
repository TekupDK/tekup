import { Router } from "express";
import { rerunEmailMatching } from "../scripts/rerunEmailMatching";
import { logger } from "../logger";
import { prisma } from "../services/databaseService";

const router = Router();

/**
 * POST /api/email-matching/rerun
 * Re-run email matching on unmatched threads
 */
router.post("/rerun", async (req, res) => {
  try {
    logger.info("Starting email matching re-run via API");
    
    await rerunEmailMatching();
    
    // Get updated stats
    const stats = await getEmailMatchingStats();
    
    res.json({
      success: true,
      message: "Email matching re-run completed successfully",
      stats
    });
    
  } catch (error) {
    logger.error({ error }, "Email matching re-run failed via API");
    res.status(500).json({
      success: false,
      message: "Email matching re-run failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/email-matching/stats
 * Get current email matching statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await getEmailMatchingStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error({ error }, "Failed to get email matching stats");
    res.status(500).json({
      success: false,
      message: "Failed to get email matching stats",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

async function getEmailMatchingStats() {
  const totalThreads = await prisma.emailThread.count();
  const matchedThreads = await prisma.emailThread.count({
    where: { isMatched: true }
  });
  const unmatchedThreads = totalThreads - matchedThreads;
  
  // Get threads with empty participants
  const emptyParticipantsThreads = await prisma.emailThread.count({
    where: {
      isMatched: false,
      participants: { isEmpty: true }
    }
  });
  
  // Get threads with participants but not matched
  const participantsButUnmatched = await prisma.emailThread.count({
    where: {
      isMatched: false,
      participants: { isEmpty: false }
    }
  });

  return {
    totalThreads,
    matchedThreads,
    unmatchedThreads,
    emptyParticipantsThreads,
    participantsButUnmatched,
    matchRate: totalThreads > 0 ? (matchedThreads / totalThreads * 100).toFixed(2) + "%" : "0%"
  };
}

export default router;