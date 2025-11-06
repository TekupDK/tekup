export type BatchLabelResult = {
  results: Array<{
    emailId: number;
    autoApplied?: string[];
  }>;
};

export function buildUndoOpsFromBatchResult(result: BatchLabelResult) {
  const ops: Array<{ emailId: number; label: string }> = [];
  if (!result?.results) return ops;
  for (const r of result.results) {
    if (r.autoApplied && r.autoApplied.length > 0) {
      for (const label of r.autoApplied) {
        ops.push({ emailId: r.emailId, label });
      }
    }
  }
  return ops;
}
