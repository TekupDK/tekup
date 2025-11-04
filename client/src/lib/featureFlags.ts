export type FeatureFlag = "FRIDAY_ACTION_SUGGESTIONS";

const FLAG_PREFIX = "flag:";

export function isFeatureEnabled(
  flag: FeatureFlag,
  defaultValue = false
): boolean {
  try {
    // URL toggle e.g. ?ff=FRIDAY_ACTION_SUGGESTIONS
    const params = new URLSearchParams(window.location.search);
    const ff = params.get("ff");
    if (ff && ff.split(",").includes(flag)) return true;

    // localStorage override: flag:FRIDAY_ACTION_SUGGESTIONS = "true"
    const stored = localStorage.getItem(`${FLAG_PREFIX}${flag}`);
    if (stored === "true") return true;
    if (stored === "false") return false;

    // Env-based default (optional)
    const envKey = `VITE_${flag}` as keyof ImportMetaEnv;
    const envVal = (import.meta.env as any)[envKey];
    if (envVal === "true") return true;
    if (envVal === "false") return false;

    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setFeatureEnabled(flag: FeatureFlag, enabled: boolean) {
  try {
    localStorage.setItem(`${FLAG_PREFIX}${flag}`, enabled ? "true" : "false");
  } catch {
    // ignore
  }
}
export const FEATURE_FRIDAY_ACTION_SUGGESTIONS =
  import.meta.env.VITE_FEATURE_FRIDAY_ACTION_SUGGESTIONS === "true";
