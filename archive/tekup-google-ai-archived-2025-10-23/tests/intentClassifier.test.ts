import { describe, expect, it } from "vitest";
import { IntentClassifier } from "../src/agents/intentClassifier";

describe("IntentClassifier", () => {
    const classifier = new IntentClassifier();

    it("detects lead intent when quoting", async () => {
        const result = await classifier.classify(
            "Hej, kan jeg få et tilbud på rengøring af 120m2 virksomhed?"
        );

        expect(result.intent).toBe("email.lead");
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("detects complaint intent", async () => {
        const result = await classifier.classify(
            "Jeg er meget utilfreds med rengøringen i går"
        );

        expect(result.intent).toBe("email.complaint");
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("detects booking intent", async () => {
        const result = await classifier.classify(
            "Jeg vil gerne booke en tid til rengøring"
        );

        expect(result.intent).toBe("calendar.booking");
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("detects cancellation intent", async () => {
        const result = await classifier.classify(
            "Jeg skal desværre aflyse vores aftale"
        );

        expect(result.intent).toBe("calendar.cancellation");
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("detects analytics intent", async () => {
        const result = await classifier.classify(
            "Kan I give mig en analyse af jeres performance?"
        );

        expect(result.intent).toBe("analytics.overview");
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("detects automation intent", async () => {
        const result = await classifier.classify(
            "Jeg vil gerne automatisere jeres workflow"
        );

        expect(result.intent).toBe("automation.rule");
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("falls back to unknown when unsure", async () => {
        const result = await classifier.classify("Hvad er vejret i dag?");

        expect(result.intent).toBe("unknown");
    });

    it("handles empty input", async () => {
        const result = await classifier.classify("");

        expect(result.intent).toBe("unknown");
        expect(result.confidence).toBeLessThan(0.5);
    });

    it("handles very long input", async () => {
        const longText = "Jeg vil gerne have et tilbud på rengøring ".repeat(100);
        const result = await classifier.classify(longText);

        // Should still classify correctly despite length
        expect(["email.lead", "unknown"]).toContain(result.intent);
    });

    it("considers conversation history", async () => {
        const history = [
            { role: "user" as const, content: "Hej, jeg har brug for hjælp" },
            { role: "assistant" as const, content: "Hvordan kan jeg hjælpe dig?" }
        ];

        const result = await classifier.classify(
            "Jeg vil gerne have et tilbud på rengøring af mit kontor",
            history
        );

        expect(result.intent).toBe("email.lead");
    });
});
