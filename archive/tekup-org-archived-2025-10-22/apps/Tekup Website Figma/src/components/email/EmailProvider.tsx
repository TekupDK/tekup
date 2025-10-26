'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'system';
}

interface EmailContextType {
  sendEmail: (to: string | string[], templateId: string, variables?: Record<string, string>, options?: EmailOptions) => Promise<boolean>;
  sendTransactionalEmail: (type: TransactionalEmailType, to: string, data: any) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

interface EmailOptions {
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  sendAt?: Date;
}

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
}

type TransactionalEmailType = 
  | 'welcome'
  | 'password-reset'
  | 'email-verification'
  | 'lead-notification'
  | 'invoice'
  | 'subscription-confirmation'
  | 'trial-expiring'
  | 'payment-failed';

const EmailContext = createContext<EmailContextType | undefined>(undefined);

interface EmailProviderProps {
  children: ReactNode;
}

export function EmailProvider({ children }: EmailProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (
    to: string | string[], 
    templateId: string, 
    variables?: Record<string, string>,
    options?: EmailOptions
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tekup_access_token')}`
        },
        body: JSON.stringify({
          to: Array.isArray(to) ? to : [to],
          templateId,
          variables: variables || {},
          options: options || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Email sending failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Email sending error:', err);
      toast.error(`Email kunne ikke sendes: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransactionalEmail = async (
    type: TransactionalEmailType,
    to: string,
    data: any
  ): Promise<boolean> => {
    const templateMapping: Record<TransactionalEmailType, string> = {
      welcome: 'welcome-email',
      'password-reset': 'password-reset',
      'email-verification': 'email-verification',
      'lead-notification': 'lead-notification',
      invoice: 'invoice-email',
      'subscription-confirmation': 'subscription-confirmation',
      'trial-expiring': 'trial-expiring',
      'payment-failed': 'payment-failed'
    };

    const templateId = templateMapping[type];
    if (!templateId) {
      setError(`Unknown email type: ${type}`);
      return false;
    }

    return sendEmail(to, templateId, data);
  };

  const value: EmailContextType = {
    sendEmail,
    sendTransactionalEmail,
    isLoading,
    error
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}

// Danish email templates for cleaning business
export const danishEmailTemplates: EmailTemplate[] = [
  {
    id: 'welcome-email',
    name: 'Velkommen til Tekup',
    subject: 'Velkommen til Tekup - Din AI-drevne CRM er klar! 🎉',
    category: 'transactional',
    variables: ['firstName', 'companyName', 'loginUrl', 'supportEmail'],
    htmlContent: `
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Velkommen til Tekup</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0066CC, #00D4FF); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Velkommen til Tekup!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Din AI-drevne CRM til rengøringsvirksomheder</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #0066CC; margin-top: 0;">Hej {{firstName}}! 👋</h2>
          
          <p>Tak fordi du har valgt Tekup til {{companyName}}. Vi er begejstrede for at hjælpe dig med at automatisere og optimere din rengøringsvirksomhed.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00D4FF;">
            <h3 style="margin-top: 0; color: #0066CC;">Hvad kan du nu?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Administrer leads med AI-drevet scoring</li>
              <li>Automatiser kundeopfølgning</li>
              <li>Brug Jarvis AI til at spare tid</li>
              <li>Se real-time analytics og rapporter</li>
              <li>Integrer med dine eksisterende værktøjer</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" style="background: linear-gradient(135deg, #0066CC, #00D4FF); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Log ind på dit dashboard</a>
          </div>
          
          <p style="margin-top: 30px;">Har du brug for hjælp til at komme i gang? Vores team står klar til at hjælpe dig på <a href="mailto:{{supportEmail}}" style="color: #0066CC;">{{supportEmail}}</a> eller ring på +45 70 20 30 40.</p>
          
          <p>Med venlig hilsen,<br>Tekup teamet</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Hej {{firstName}}!
      
      Tak fordi du har valgt Tekup til {{companyName}}. Vi er begejstrede for at hjælpe dig med at automatisere og optimere din rengøringsvirksomhed.
      
      Hvad kan du nu?
      - Administrer leads med AI-drevet scoring
      - Automatiser kundeopfølgning  
      - Brug Jarvis AI til at spare tid
      - Se real-time analytics og rapporter
      - Integrer med dine eksisterende værktøjer
      
      Log ind på dit dashboard: {{loginUrl}}
      
      Har du brug for hjælp? Kontakt os på {{supportEmail}} eller ring +45 70 20 30 40.
      
      Med venlig hilsen,
      Tekup teamet
    `
  },
  {
    id: 'lead-notification',
    name: 'Nyt lead modtaget',
    subject: '🔥 Nyt lead: {{leadName}} - {{leadScore}} point',
    category: 'transactional',
    variables: ['leadName', 'leadCompany', 'leadEmail', 'leadPhone', 'leadScore', 'leadSource', 'urgency', 'dashboardUrl'],
    htmlContent: `
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nyt Lead Modtaget</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, {{urgency === 'high' ? '#FF3347' : urgency === 'medium' ? '#F59E0B' : '#0066CC'}}, #00D4FF); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔥 Nyt Lead Modtaget!</h1>
          <p style="color: white; margin: 5px 0 0 0;">AI Score: {{leadScore}} point</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid {{urgency === 'high' ? '#FF3347' : urgency === 'medium' ? '#F59E0B' : '#0066CC'}};">
            <h2 style="margin-top: 0; color: #0066CC;">{{leadName}}</h2>
            <p style="margin: 5px 0;"><strong>Virksomhed:</strong> {{leadCompany}}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:{{leadEmail}}" style="color: #0066CC;">{{leadEmail}}</a></p>
            <p style="margin: 5px 0;"><strong>Telefon:</strong> <a href="tel:{{leadPhone}}" style="color: #0066CC;">{{leadPhone}}</a></p>
            <p style="margin: 5px 0;"><strong>Kilde:</strong> {{leadSource}}</p>
            <p style="margin: 5px 0;"><strong>Hastighed:</strong> <span style="color: {{urgency === 'high' ? '#FF3347' : urgency === 'medium' ? '#F59E0B' : '#10B981'}}; font-weight: bold;">{{urgency === 'high' ? 'HØJ' : urgency === 'medium' ? 'MELLEM' : 'LAV'}}</span></p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #0066CC, #00D4FF); color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; display: inline-block; font-weight: bold;">Se lead i dashboard</a>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #0066CC;"><strong>💡 Tip:</strong> Leads med høj score (80+) har {{urgency === 'high' ? '3x' : '2x'}} højere konverteringsrate. Kontakt dem inden for {{urgency === 'high' ? '1 time' : urgency === 'medium' ? '4 timer' : '24 timer'}} for bedste resultat.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      🔥 Nyt Lead Modtaget!
      AI Score: {{leadScore}} point
      
      {{leadName}}
      Virksomhed: {{leadCompany}}
      Email: {{leadEmail}}
      Telefon: {{leadPhone}}
      Kilde: {{leadSource}}
      Hastighed: {{urgency === 'high' ? 'HØJ' : urgency === 'medium' ? 'MELLEM' : 'LAV'}}
      
      Se lead i dashboard: {{dashboardUrl}}
      
      💡 Tip: Kontakt leads med høj score inden for {{urgency === 'high' ? '1 time' : urgency === 'medium' ? '4 timer' : '24 timer'}} for bedste konverteringsrate.
    `
  },
  {
    id: 'trial-expiring',
    name: 'Din prøveperiode udløber snart',
    subject: '⏰ Din Tekup prøveperiode udløber om {{daysLeft}} dage',
    category: 'transactional',
    variables: ['firstName', 'companyName', 'daysLeft', 'upgradeUrl', 'dataStats'],
    htmlContent: `
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prøveperiode udløber snart</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 25px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 26px;">⏰ Din prøveperiode udløber snart</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">Kun {{daysLeft}} dage tilbage</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #0066CC; margin-top: 0;">Hej {{firstName}}!</h2>
          
          <p>Din 14-dages gratis prøveperiode af Tekup udløber om <strong>{{daysLeft}} dage</strong>. Vi håber, du har været tilfreds med platformen!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="margin-top: 0; color: #0066CC;">Dine resultater indtil nu:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>{{dataStats.leadsProcessed}} leads behandlet</li>
              <li>{{dataStats.avgScore}} gennemsnitlig AI-score</li>
              <li>{{dataStats.timeSaved}} timer sparet med automation</li>
              <li>{{dataStats.conversionRate}}% konverteringsrate</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="{{upgradeUrl}}" style="background: linear-gradient(135deg, #0066CC, #00D4FF); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">Fortsæt med Tekup - Fra 299 kr/md</a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Vigtigt:</strong> Hvis du ikke opgraderer, mister du adgang til alle dine data og konfigurationer om {{daysLeft}} dage.</p>
          </div>
          
          <p>Har du spørgsmål om opgradering eller ønsker en personlig demo? Kontakt os på support@tekup.dk eller ring +45 70 20 30 40.</p>
          
          <p>Med venlig hilsen,<br>Tekup teamet</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Hej {{firstName}}!
      
      Din 14-dages gratis prøveperiode af Tekup udløber om {{daysLeft}} dage.
      
      Dine resultater indtil nu:
      - {{dataStats.leadsProcessed}} leads behandlet
      - {{dataStats.avgScore}} gennemsnitlig AI-score  
      - {{dataStats.timeSaved}} timer sparet med automation
      - {{dataStats.conversionRate}}% konverteringsrate
      
      Fortsæt med Tekup: {{upgradeUrl}}
      
      ⚠️ Vigtigt: Hvis du ikke opgraderer, mister du adgang til alle dine data om {{daysLeft}} dage.
      
      Spørgsmål? Kontakt support@tekup.dk eller ring +45 70 20 30 40.
      
      Med venlig hilsen,
      Tekup teamet
    `
  }
];