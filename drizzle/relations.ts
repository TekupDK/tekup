import { relations } from "drizzle-orm";
import {
  emails,
  attachments,
  emailThreads,
  emailPipelineState,
  emailPipelineTransitions,
  emailLabelRules,
  leads,
  customerProfiles,
  users,
} from "./schema";

export const emailsRelations = relations(emails, ({ one, many }) => ({
  user: one(users, {
    fields: [emails.userId],
    references: [users.id],
  }),
  customer: one(customerProfiles, {
    fields: [emails.customerId],
    references: [customerProfiles.id],
  }),
  thread: one(emailThreads, {
    fields: [emails.emailThreadId],
    references: [emailThreads.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  email: one(emails, {
    fields: [attachments.emailId],
    references: [emails.id],
  }),
}));

export const emailPipelineStateRelations = relations(emailPipelineState, ({ one }) => ({
  lead: one(leads, {
    fields: [emailPipelineState.leadId],
    references: [leads.id],
  }),
}));
