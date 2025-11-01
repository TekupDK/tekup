export interface LeadLike {
  id: string;
  email?: string;
  name?: string;
  emailThreadId?: string;
  lastQuotedAt?: string;
  followUpCount?: number;
}

export interface FollowUpDeps {
  listLeadsNeedingFollowUp: () => Promise<LeadLike[]>;
  sendEmailDraft: (to: string, subject: string, body: string, threadId?: string) => Promise<void>;
  markFollowedUp: (leadId: string) => Promise<void>;
}

export async function runDailyFollowUps(deps: FollowUpDeps): Promise<void> {
  const leads = await deps.listLeadsNeedingFollowUp();
  for (const lead of leads) {
    if (!lead.email) continue;
    const subject = `Opfølgning vedr. rengøring`;
    const body = `Hej ${lead.name || ""}\n\nJeg følger op på mit tidligere tilbud. Har du spørgsmål eller ønsker en tid?\n\nVenlig hilsen\nRendetalje.dk`;
    await deps.sendEmailDraft(lead.email, subject, body, lead.emailThreadId);
    await deps.markFollowedUp(lead.id);
  }
}


