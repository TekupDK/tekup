import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { ENV } from "./env";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  aiConfig: publicProcedure.query(() => {
    // Determine active model (priority: OpenRouter -> Ollama -> Gemini -> OpenAI)
    const model = ENV.openRouterApiKey && ENV.openRouterApiKey.trim()
      ? ENV.openRouterModel
      : ENV.ollamaBaseUrl
        ? ENV.ollamaModel
        : ENV.geminiApiKey && ENV.geminiApiKey.trim()
          ? "gemini-2.5-flash"
          : "gpt-4o-mini";

    // Basic cost heuristics per email
    let summary = 0;
    let labelSuggestion = 0;

    const lowerModel = (model || "").toLowerCase();
    if (lowerModel.includes("gemma") && lowerModel.includes("free")) {
      summary = 0;
      labelSuggestion = 0;
    } else if (lowerModel.includes("gemini")) {
      // Previous Gemini Flash estimated costs
      summary = 0.00008;
      labelSuggestion = 0.00012;
    } else {
      // Generic default
      summary = 0.0002;
      labelSuggestion = 0.0002;
    }

    const toolbarEstimatePerEmail = Math.max(summary, labelSuggestion);

    return {
      model,
      costPerEmail: {
        summary,
        labelSuggestion,
        toolbarEstimatePerEmail,
      },
    } as const;
  }),
});
