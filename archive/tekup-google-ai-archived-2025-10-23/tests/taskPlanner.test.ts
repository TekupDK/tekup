import { describe, expect, it } from "vitest";
import { TaskPlanner } from "../src/agents/taskPlanner";
import type { ClassifiedIntent } from "../src/types";

describe("TaskPlanner", () => {
    const planner = new TaskPlanner();

    it("creates email plan for lead intent", () => {
        const intent: ClassifiedIntent = {
            intent: "email.lead",
            confidence: 0.9,
            rationale: "Test",
        };

        const plan = planner.plan({ intent, message: "", context: {} });

        // The planner now returns 4+ tasks for email.lead
        expect(plan.length).toBeGreaterThanOrEqual(2);
        // Should have an email compose task somewhere in the plan
        const hasEmailCompose = plan.some(task => task.type === "email.compose");
        expect(hasEmailCompose).toBe(true);
    });

    it("returns noop for unknown intent", () => {
        const intent: ClassifiedIntent = {
            intent: "unknown",
            confidence: 0.1,
            rationale: "",
        };

        const plan = planner.plan({ intent, message: "", context: {} });

        expect(plan[0].type).toBe("noop");
    });
});
