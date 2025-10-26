import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createLogger } from '@tekup/shared';
import { LeadScoringResult } from './ai-lead-scoring.service';

const logger = createLogger('auto-response');

@Injectable()
export class AutoResponseService {
  constructor(private prisma: PrismaService) {}

  /**
   * Send automatisk respons til high-score leads
   */
  async sendAutoResponse(leadId: string, scoringResult: LeadScoringResult): Promise<void> {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          contact: true,
          company: true
        }
      });

      if (!lead?.contact?.email) {
        logger.warn(`No email found for lead ${leadId}, skipping auto-response`);
        return;
      }

      if (!scoringResult.autoResponse) {
        logger.info(`Lead ${leadId} score ${scoringResult.score} below threshold, skipping auto-response`);
        return;
      }

      const emailTemplate = this.generateEmailTemplate(lead, scoringResult);
      
      // Send email via your preferred email service
      await this.sendEmail({
        to: lead.contact.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        leadId
      });

      // Log activity
      await this.prisma.activity.create({
        data: {
          type: 'AUTO_RESPONSE_SENT',
          description: `Automatisk respons sendt til ${lead.contact.email}`,
          leadId,
          tenantId: lead.tenantId,
          metadata: {
            emailSubject: emailTemplate.subject,
            leadScore: scoringResult.score,
            recommendation: scoringResult.recommendation
          }
        }
      });

      // Update lead status
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'contacted',
          metadata: {
            ...lead.metadata,
            autoResponseSent: true,
            autoResponseDate: new Date()
          }
        }
      });

      logger.info(`Auto-response sent to lead ${leadId} (${lead.contact.email})`);

    } catch (error) {
      logger.error(`Auto-response failed for lead ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Generer personaliseret email template
   */
  private generateEmailTemplate(lead: any, scoringResult: LeadScoringResult) {
    const firstName = lead.contact?.firstName || 'Kære kunde';
    const serviceType = this.extractServiceType(lead.metadata?.rawText || '');
    const isUrgent = scoringResult.factors.urgency > 15;

    const subject = isUrgent 
      ? `🚀 Hurtig respons på din ${serviceType} forespørgsel`
      : `Tak for din ${serviceType} forespørgsel - Vi kontakter dig snart!`;

    const urgencyMessage = isUrgent 
      ? `<p style="background: #fef3c7; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;">
           <strong>⚡ Vi kan se du har brug for hurtig hjælp!</strong><br>
           Vi prioriterer din forespørgsel og kontakter dig inden for 2 timer.
         </p>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rendetalje - Tak for din forespørgsel</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0066cc; margin: 0;">Rendetalje</h1>
          <p style="color: #666; margin: 5px 0;">Professionel rengøring i Aarhus området</p>
        </div>

        ${urgencyMessage}

        <h2 style="color: #0066cc;">Hej ${firstName}!</h2>
        
        <p>Tak for din forespørgsel om <strong>${serviceType}</strong>. Vi har modtaget din henvendelse og er klar til at hjælpe dig.</p>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0066cc; margin-top: 0;">Hvad sker der nu?</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Vi gennemgår din forespørgsel og forbereder et skræddersyet tilbud</li>
            <li>Du vil høre fra os inden for ${isUrgent ? '2 timer' : '24 timer'}</li>
            <li>Vi aftaler en tid der passer dig</li>
            <li>Vores professionelle team udfører arbejdet</li>
          </ul>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">💰 Vores Priser</h3>
          <p style="margin: 0;"><strong>349 kr/time inkl. moms</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
            Ingen skjulte omkostninger • Professionelt udstyr inkluderet • Svanemærkede produkter
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rendetalje-os.tekup.dk/booking" 
             style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            📅 Book direkte online
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666;">
          <p><strong>Rendetalje</strong><br>
          Professionel rengøring i Aarhus området<br>
          📞 Telefon: +45 22 65 02 26<br>
          📧 Email: info@rendetalje.dk<br>
          💳 MobilePay: 71759</p>
          
          <p style="margin-top: 15px;">
            <em>Dette er en automatisk bekræftelse. Vi kontakter dig personligt snart!</em>
          </p>
        </div>

      </body>
      </html>
    `;

    return { subject, html };
  }

  /**
   * Udtræk service type fra email indhold
   */
  private extractServiceType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('hovedrengøring')) return 'hovedrengøring';
    if (lowerText.includes('flytterengøring')) return 'flytterengøring';
    if (lowerText.includes('privatrengøring') || lowerText.includes('abonnement')) return 'fast rengøringshjælp';
    if (lowerText.includes('kontorrengøring') || lowerText.includes('erhverv')) return 'kontorrengøring';
    
    return 'rengøring';
  }

  /**
   * Send email via email service (placeholder - integrate with your email provider)
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    leadId: string;
  }): Promise<void> {
    // TODO: Integrate with your email service (SendGrid, Mailgun, etc.)
    // For now, we'll just log the email
    logger.info(`Email would be sent to ${params.to}:`, {
      subject: params.subject,
      leadId: params.leadId
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Send follow-up email for warm leads
   */
  async sendFollowUpEmail(leadId: string): Promise<void> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { contact: true }
    });

    if (!lead?.contact?.email) return;

    const followUpTemplate = this.generateFollowUpTemplate(lead);
    
    await this.sendEmail({
      to: lead.contact.email,
      subject: followUpTemplate.subject,
      html: followUpTemplate.html,
      leadId
    });

    await this.prisma.activity.create({
      data: {
        type: 'FOLLOW_UP_SENT',
        description: `Follow-up email sendt til ${lead.contact.email}`,
        leadId,
        tenantId: lead.tenantId
      }
    });
  }

  /**
   * Generer follow-up email template
   */
  private generateFollowUpTemplate(lead: any) {
    const firstName = lead.contact?.firstName || 'Kære kunde';

    return {
      subject: `Har du stadig brug for rengøringshjælp? 🧽`,
      html: `
        <p>Hej ${firstName},</p>
        <p>Vi kontaktede dig for et par dage siden vedrørende din rengøringsforespørgsel, men har ikke hørt tilbage fra dig endnu.</p>
        <p>Vi vil gerne hjælpe dig med at få løst dine rengøringsbehov. Hvis du stadig har brug for hjælp, så svar bare på denne email eller ring til os på +45 22 65 02 26.</p>
        <p>Med venlig hilsen,<br>Rendetalje</p>
      `
    };
  }
}
