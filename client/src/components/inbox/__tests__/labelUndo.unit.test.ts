import { describe, expect, it } from "vitest";
import { buildUndoOpsFromBatchResult } from "../utils/labelUndo";

describe("labelUndo utils", () => {
  it("builds undo ops from batch result", () => {
    const result = {
      results: [
        { emailId: 1, autoApplied: ["Lead", "Finance"] },
        { emailId: 2, autoApplied: [] },
        { emailId: 3, autoApplied: ["Support"] },
      ],
    };
    const ops = buildUndoOpsFromBatchResult(result as any);
    expect(ops).toEqual([
      { emailId: 1, label: "Lead" },
      { emailId: 1, label: "Finance" },
      { emailId: 3, label: "Support" },
    ]);
  });

  it("handles empty or missing results gracefully", () => {
    expect(buildUndoOpsFromBatchResult({} as any)).toEqual([]);
    expect(buildUndoOpsFromBatchResult({ results: [] } as any)).toEqual([]);
  });
});
