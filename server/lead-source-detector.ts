/**
 * Lead Source Detection
 *
 * Automatically detects lead source based on email content and headers.
 * Based on SHORTWAVE_WORKFLOW_ANALYSIS.md patterns.
 */

export type LeadSource =
  | "rengoring_nu"
  | "rengoring_aarhus"
  | "adhelp"
  | "direct"
  | null;

interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
}

/**
 * Detect lead source from email data
 *
 * Patterns:
 * - Rengøring.nu: From Leadmail.no/Nettbureau domains
 * - Rengøring Århus: From Leadpoint.dk
 * - AdHelp: From adhelp.dk domains
 */
export function detectLeadSource(email: EmailData): LeadSource {
  const from = email.from.toLowerCase();
  const to = email.to.toLowerCase();
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();

  // 1. Check for Rengøring.nu (Leadmail.no/Nettbureau)
  if (
    from.includes("leadmail.no") ||
    from.includes("nettbureau") ||
    subject.includes("rengøring.nu") ||
    body.includes("leadmail.no") ||
    body.includes("nettbureau")
  ) {
    return "rengoring_nu";
  }

  // 2. Check for Rengøring Århus (Leadpoint.dk)
  if (
    from.includes("leadpoint.dk") ||
    from.includes("leadpoint") ||
    subject.includes("rengøring århus") ||
    subject.includes("rengøring aarhus") ||
    body.includes("leadpoint.dk")
  ) {
    return "rengoring_aarhus";
  }

  // 3. Check for AdHelp
  if (
    from.includes("@adhelp.dk") ||
    from.includes("@mw.adhelp.dk") ||
    from.includes("@sp.adhelp.dk") ||
    from.includes("adhelp") ||
    subject.includes("adhelp") ||
    body.includes("adhelp.dk")
  ) {
    return "adhelp";
  }

  // 4. Default: direct inquiry
  return "direct";
}
