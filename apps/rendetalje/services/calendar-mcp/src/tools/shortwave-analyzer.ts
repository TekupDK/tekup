import { z } from 'zod';
import { shortwaveAI, EmailAnalysis, CustomerIntelligence } from '../integrations/shortwave-ai';

// MCP Tool: Analyze Email Content
export const analyzeEmailContent = {
  name: 'analyze_email_content',
  description: 'Analyse email indhold og udtræk information fra Shortwave.ai',
  inputSchema: z.object({
    emailId: z.string().describe('Email ID'),
    content: z.string().describe('Email indhold'),
    sender: z.string().describe('Afsender email'),
    subject: z.string().describe('Email emne')
  }),
  handler: async (input: {
    emailId: string;
    content: string;
    sender: string;
    subject: string;
  }): Promise<EmailAnalysis> => {
    return await shortwaveAI.analyzeEmailContent(input);
  }
};

// MCP Tool: Extract Booking Info
export const extractBookingInfo = {
  name: 'extract_booking_info',
  description: 'Udtræk booking information fra email',
  inputSchema: z.object({
    emailContent: z.string().describe('Email indhold'),
    customerId: z.string().optional().describe('Kunde ID')
  }),
  handler: async (input: {
    emailContent: string;
    customerId?: string;
  }) => {
    return await shortwaveAI.extractBookingInfo(input);
  }
};

// MCP Tool: Detect Customer Sentiment
export const detectCustomerSentiment = {
  name: 'detect_customer_sentiment',
  description: 'Detekter kunde sentiment fra email',
  inputSchema: z.object({
    content: z.string().describe('Email indhold'),
    customerId: z.string().describe('Kunde ID'),
    context: z.string().optional().describe('Kontekst')
  }),
  handler: async (input: {
    content: string;
    customerId: string;
    context?: string;
  }) => {
    return await shortwaveAI.detectCustomerSentiment(input);
  }
};

// MCP Tool: Classify Email Type
export const classifyEmailType = {
  name: 'classify_email_type',
  description: 'Klassificer email type (booking, complaint, inquiry, etc.)',
  inputSchema: z.object({
    content: z.string().describe('Email indhold'),
    subject: z.string().describe('Email emne'),
    sender: z.string().describe('Afsender email')
  }),
  handler: async (input: {
    content: string;
    subject: string;
    sender: string;
  }) => {
    return await shortwaveAI.analyzeEmailContent({
      emailId: 'temp_' + Date.now(),
      content: input.content,
      sender: input.sender,
      subject: input.subject
    });
  }
};

// MCP Tool: Extract Contact Info
export const extractContactInfo = {
  name: 'extract_contact_info',
  description: 'Udtræk kontakt information fra email',
  inputSchema: z.object({
    content: z.string().describe('Email indhold'),
    sender: z.string().describe('Afsender email')
  }),
  handler: async (input: {
    content: string;
    sender: string;
  }) => {
    // Extract contact information
    const phonePattern = /(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2})/;
    const phoneMatch = input.content.match(phonePattern);
    
    const namePattern = /(Hej|Hi|Hello)\s+([A-Za-z\s]+)/;
    const nameMatch = input.content.match(namePattern);
    
    return {
      email: input.sender,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      name: nameMatch && nameMatch[2] ? nameMatch[2].trim() : undefined,
      extractedFrom: input.content
    };
  }
};

// MCP Tool: Monitor Email Patterns
export const monitorEmailPatterns = {
  name: 'monitor_email_patterns',
  description: 'Overvåg email mønstre for kunde intelligence',
  inputSchema: z.object({
    customerId: z.string().describe('Kunde ID'),
    emailHistory: z.array(z.object({
      date: z.string(),
      type: z.string(),
      content: z.string(),
      sentiment: z.string()
    })).describe('Email historik')
  }),
  handler: async (input: {
    customerId: string;
    emailHistory: Array<{
      date: string;
      type: string;
      content: string;
      sentiment: string;
    }>;
  }): Promise<CustomerIntelligence> => {
    return await shortwaveAI.learnFromEmailPatterns(input);
  }
};

// Export all Shortwave.ai tools
export const shortwaveTools = [
  analyzeEmailContent,
  extractBookingInfo,
  detectCustomerSentiment,
  classifyEmailType,
  extractContactInfo,
  monitorEmailPatterns
];
