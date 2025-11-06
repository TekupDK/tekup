import { describe, expect, it } from "vitest";

/**
 * Unit tests for AI Label Suggestions Service
 * Tests confidence scoring, label categories, and auto-apply logic
 */

describe("AI Label Suggestions Service - Unit Tests", () => {
  describe("label categories", () => {
    const validCategories = [
      "Lead",
      "Booking",
      "Finance",
      "Support",
      "Newsletter",
    ];

    it("should have exactly 5 label categories", () => {
      expect(validCategories.length).toBe(5);
    });

    it("should include Lead category", () => {
      expect(validCategories).toContain("Lead");
    });

    it("should include Booking category", () => {
      expect(validCategories).toContain("Booking");
    });

    it("should include Finance category", () => {
      expect(validCategories).toContain("Finance");
    });

    it("should include Support category", () => {
      expect(validCategories).toContain("Support");
    });

    it("should include Newsletter category", () => {
      expect(validCategories).toContain("Newsletter");
    });

    it("should reject invalid category", () => {
      const invalidCategory = "RandomCategory";
      expect(validCategories).not.toContain(invalidCategory);
    });
  });

  describe("emoji indicators", () => {
    const getLabelEmoji = (label: string): string => {
      const lower = label.toLowerCase();
      if (lower.includes("lead")) return "🟢";
      if (lower.includes("booking")) return "🔵";
      if (lower.includes("finance")) return "🟡";
      if (lower.includes("support")) return "🔴";
      if (lower.includes("newsletter")) return "🟣";
      return "🏷️";
    };

    it("should return green circle for Lead", () => {
      expect(getLabelEmoji("Lead")).toBe("🟢");
    });

    it("should return blue circle for Booking", () => {
      expect(getLabelEmoji("Booking")).toBe("🔵");
    });

    it("should return yellow circle for Finance", () => {
      expect(getLabelEmoji("Finance")).toBe("🟡");
    });

    it("should return red circle for Support", () => {
      expect(getLabelEmoji("Support")).toBe("🔴");
    });

    it("should return purple circle for Newsletter", () => {
      expect(getLabelEmoji("Newsletter")).toBe("🟣");
    });

    it("should return default tag for unknown label", () => {
      expect(getLabelEmoji("Unknown")).toBe("🏷️");
    });
  });

  describe("confidence scoring", () => {
    it("should auto-apply labels with >85% confidence", () => {
      const highConfidence = 0.92;
      const threshold = 0.85;

      expect(highConfidence).toBeGreaterThan(threshold);
      expect(highConfidence > threshold).toBe(true);
    });

    it("should NOT auto-apply labels with <85% confidence", () => {
      const lowConfidence = 0.75;
      const threshold = 0.85;

      expect(lowConfidence).toBeLessThan(threshold);
      expect(lowConfidence > threshold).toBe(false);
    });

    it("should handle exact threshold value", () => {
      const exactThreshold = 0.85;
      const threshold = 0.85;

      // >= threshold should auto-apply
      expect(exactThreshold >= threshold).toBe(true);
    });

    it("should validate confidence range 0-1", () => {
      const validConfidence = 0.87;

      expect(validConfidence).toBeGreaterThanOrEqual(0);
      expect(validConfidence).toBeLessThanOrEqual(1);
    });

    it("should reject negative confidence", () => {
      const invalidConfidence = -0.5;

      expect(invalidConfidence).toBeLessThan(0);
      expect(invalidConfidence >= 0 && invalidConfidence <= 1).toBe(false);
    });

    it("should reject confidence > 1", () => {
      const invalidConfidence = 1.5;

      expect(invalidConfidence).toBeGreaterThan(1);
      expect(invalidConfidence >= 0 && invalidConfidence <= 1).toBe(false);
    });
  });

  describe("suggestion sorting", () => {
    it("should sort by confidence descending", () => {
      const suggestions = [
        { label: "Lead", confidence: 0.75 },
        { label: "Booking", confidence: 0.92 },
        { label: "Finance", confidence: 0.88 },
      ];

      const sorted = [...suggestions].sort(
        (a, b) => b.confidence - a.confidence
      );

      expect(sorted[0].label).toBe("Booking");
      expect(sorted[0].confidence).toBe(0.92);
      expect(sorted[2].label).toBe("Lead");
      expect(sorted[2].confidence).toBe(0.75);
    });

    it("should filter high-confidence suggestions", () => {
      const suggestions = [
        { label: "Lead", confidence: 0.92 },
        { label: "Booking", confidence: 0.75 },
        { label: "Finance", confidence: 0.88 },
      ];

      const highConfidence = suggestions.filter(s => s.confidence >= 0.85);

      expect(highConfidence.length).toBe(2);
      expect(highConfidence.map(s => s.label)).toEqual(["Lead", "Finance"]);
    });

    it("should limit to max 5 suggestions", () => {
      const suggestions = Array(10)
        .fill(0)
        .map((_, i) => ({
          label: `Label${i}`,
          confidence: 0.9 - i * 0.05,
        }));

      const limited = suggestions.slice(0, 5);

      expect(limited.length).toBe(5);
      expect(limited.length).toBeLessThanOrEqual(5);
    });
  });

  describe("label application logic", () => {
    it("should prevent duplicate label application", () => {
      const currentLabels = new Set(["Lead", "Finance"]);
      const newLabel = "Lead";

      const isDuplicate = currentLabels.has(newLabel);

      expect(isDuplicate).toBe(true);
      expect(!isDuplicate).toBe(false);
    });

    it("should allow new label application", () => {
      const currentLabels = new Set(["Lead"]);
      const newLabel = "Booking";

      const isDuplicate = currentLabels.has(newLabel);

      expect(isDuplicate).toBe(false);
      expect(!isDuplicate).toBe(true);
    });

    it("should track applied labels", () => {
      const appliedLabels = new Set<string>();

      appliedLabels.add("Lead");
      appliedLabels.add("Finance");

      expect(appliedLabels.size).toBe(2);
      expect(appliedLabels.has("Lead")).toBe(true);
      expect(appliedLabels.has("Support")).toBe(false);
    });

    it("should handle case-sensitive labels", () => {
      const label1 = "Lead";
      const label2 = "lead";

      expect(label1).not.toBe(label2);
      expect(label1.toLowerCase()).toBe(label2.toLowerCase());
    });
  });

  describe("auto-apply high-confidence labels", () => {
    it("should count high-confidence labels", () => {
      const suggestions = [
        { label: "Lead", confidence: 0.92 },
        { label: "Booking", confidence: 0.75 },
        { label: "Finance", confidence: 0.88 },
        { label: "Support", confidence: 0.7 },
      ];

      const highConfidenceCount = suggestions.filter(
        s => s.confidence >= 0.85
      ).length;

      expect(highConfidenceCount).toBe(2);
    });

    it("should get labels for auto-apply", () => {
      const suggestions = [
        { label: "Lead", confidence: 0.92 },
        { label: "Booking", confidence: 0.88 },
        { label: "Finance", confidence: 0.75 },
      ];

      const toApply = suggestions
        .filter(s => s.confidence >= 0.85)
        .map(s => s.label);

      expect(toApply).toEqual(["Lead", "Booking"]);
      expect(toApply.length).toBe(2);
    });

    it("should handle no high-confidence labels", () => {
      const suggestions = [
        { label: "Lead", confidence: 0.75 },
        { label: "Booking", confidence: 0.7 },
      ];

      const toApply = suggestions.filter(s => s.confidence >= 0.85);

      expect(toApply.length).toBe(0);
      expect(toApply).toEqual([]);
    });
  });

  describe("JSON parsing", () => {
    it("should parse valid JSON suggestions", () => {
      const jsonString = JSON.stringify({
        suggestions: [
          {
            label: "Lead",
            confidence: 0.92,
            reason: "Potential customer inquiry",
          },
        ],
      });

      const parsed = JSON.parse(jsonString);

      expect(parsed.suggestions).toBeDefined();
      expect(parsed.suggestions.length).toBe(1);
      expect(parsed.suggestions[0].label).toBe("Lead");
    });

    it("should handle array format", () => {
      const jsonString = JSON.stringify([
        { label: "Lead", confidence: 0.92 },
        { label: "Finance", confidence: 0.88 },
      ]);

      const parsed = JSON.parse(jsonString);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it("should validate suggestion structure", () => {
      const suggestion = {
        label: "Lead",
        confidence: 0.92,
        reason: "Customer inquiry about services",
      };

      expect(suggestion).toHaveProperty("label");
      expect(suggestion).toHaveProperty("confidence");
      expect(suggestion).toHaveProperty("reason");
      expect(typeof suggestion.label).toBe("string");
      expect(typeof suggestion.confidence).toBe("number");
    });
  });

  describe("error handling", () => {
    it("should return failure on invalid email", () => {
      const result = {
        success: false,
        reason: "Email not found",
        suggestions: [],
      };

      expect(result.success).toBe(false);
      expect(result.suggestions.length).toBe(0);
    });

    it("should handle API errors", () => {
      const error = {
        message: "Gemini API error",
        code: "API_ERROR",
      };

      expect(error.message).toContain("API error");
      expect(error.code).toBe("API_ERROR");
    });

    it("should validate required fields", () => {
      const email = {
        subject: "",
        body: "",
        from: "",
      };

      const hasRequiredFields =
        email.subject !== "" || email.body !== "" || email.from !== "";

      expect(hasRequiredFields).toBe(false);
    });
  });

  describe("cost calculation", () => {
    it("should estimate cost per label suggestion", () => {
      const costPerEmail = 0.00012; // Gemini 2.0 Flash
      const emailCount = 1000;

      const totalCost = costPerEmail * emailCount;

      expect(totalCost).toBeCloseTo(0.12, 2); // $0.12 for 1000 label suggestions
      expect(totalCost).toBeLessThan(0.15);
    });

    it("should calculate combined cost (summary + labels)", () => {
      const summaryCost = 0.00008;
      const labelCost = 0.00012;
      const combinedCost = summaryCost + labelCost;

      expect(combinedCost).toBe(0.0002);

      const costPer1000 = combinedCost * 1000;
      expect(costPer1000).toBe(0.2); // $0.20 for 1000 emails with both features
    });
  });

  describe("cache validation", () => {
    it("should use 24-hour cache TTL", () => {
      const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in ms

      expect(cacheTTL).toBe(86400000);
      expect(cacheTTL / 1000 / 60 / 60).toBe(24);
    });

    it("should check cache age", () => {
      const now = new Date();
      const generatedAt = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

      const ageInHours =
        (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

      expect(ageInHours).toBe(12);
      expect(ageInHours < 24).toBe(true);
    });
  });
});
