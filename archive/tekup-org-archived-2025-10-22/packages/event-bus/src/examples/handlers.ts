import {
  EventHandler,
  EventContext,
  LeadCreatedEvent,
  ProposalCreatedEvent,
  CampaignCompletedEvent,
  SupportSessionStartedEvent,
  LeadConvertedEvent,
  isEventType
} from '../types.js';

/**
 * Example: Lead Scoring Handler
 * Automatically scores leads when they are created
 */
export const leadScoringHandler: EventHandler<LeadCreatedEvent> = async (event, context) => {
  console.log(`🎯 Scoring new lead: ${event.data.leadId}`);
  
  try {
    // Simulate lead scoring logic
    const score = calculateLeadScore(event.data);
    
    // Update lead score in database
    await updateLeadScore(event.data.leadId, score);
    
    console.log(`✅ Lead ${event.data.leadId} scored: ${score}/100`);
    
    // If high-value lead, trigger additional actions
    if (score > 80) {
      console.log(`🚨 High-value lead detected! Score: ${score}`);
      // Could publish another event or send notification
    }
  } catch (error) {
    console.error(`❌ Failed to score lead ${event.data.leadId}:`, error.message);
    throw error; // This will trigger retry logic
  }
};

/**
 * Example: Sales Notification Handler
 * Sends notifications when proposals are created or leads convert
 */
export const salesNotificationHandler: EventHandler = async (event, context) => {
  if (isEventType<ProposalCreatedEvent>(event, 'proposal.created')) {
    console.log(`📧 Notifying sales team about new proposal for ${event.data.clientName}`);
    await sendSlackNotification(
      '#sales',
      `New proposal created for ${event.data.clientName} - Estimated value: ${event.data.estimatedValue} kr`
    );
  }
  
  if (isEventType<LeadConvertedEvent>(event, 'lead.converted')) {
    console.log(`🎉 Lead converted! Value: ${event.data.conversionValue} kr`);
    await sendSlackNotification(
      '#sales',
      `💰 Lead converted! Deal value: ${event.data.conversionValue} kr in ${event.data.conversionTime}ms`
    );
  }
};

/**
 * Example: Marketing Analytics Handler
 * Tracks campaign performance and ROI
 */
export const marketingAnalyticsHandler: EventHandler<CampaignCompletedEvent> = async (event, context) => {
  console.log(`📊 Analyzing completed campaign: ${event.data.campaignId}`);
  
  try {
    const analytics = {
      campaignId: event.data.campaignId,
      delivered: event.data.delivered,
      openRate: (event.data.opened / event.data.delivered) * 100,
      clickRate: (event.data.clicked / event.data.opened) * 100,
      conversionRate: (event.data.converted / event.data.clicked) * 100,
      roi: event.data.roi,
      revenue: event.data.revenue
    };
    
    // Store analytics
    await storeCampaignAnalytics(analytics);
    
    // Generate insights
    if (analytics.roi > 400) {
      console.log(`🚀 Exceptional campaign performance! ROI: ${analytics.roi}%`);
      await flagHighPerformingCampaign(event.data.campaignId);
    }
    
    if (analytics.openRate < 15) {
      console.log(`⚠️ Low open rate detected: ${analytics.openRate.toFixed(2)}%`);
      await flagLowPerformingCampaign(event.data.campaignId, 'low_open_rate');
    }
    
    console.log(`✅ Campaign analytics processed for ${event.data.campaignId}`);
  } catch (error) {
    console.error(`❌ Failed to process campaign analytics:`, error.message);
    throw error;
  }
};

/**
 * Example: Customer Support Prioritization Handler
 * Automatically prioritizes support sessions based on customer data
 */
export const supportPrioritizationHandler: EventHandler<SupportSessionStartedEvent> = async (event, context) => {
  console.log(`🎧 Prioritizing support session: ${event.data.sessionId}`);
  
  try {
    // Get customer context
    const customerContext = await getCustomerContext(event.data.contactId);
    
    let priority = event.data.priority;
    let escalateToAgent = false;
    
    // High-value customer gets priority
    if (customerContext?.ltv > 100000) {
      priority = 'urgent';
      escalateToAgent = true;
      console.log(`👑 High-value customer detected - escalating to agent`);
    }
    
    // Previous issues get priority
    if (customerContext?.recentIssues > 2) {
      priority = 'high';
      console.log(`⚠️ Customer with recent issues - increasing priority`);
    }
    
    // Update session priority
    await updateSupportSessionPriority(event.data.sessionId, priority);
    
    if (escalateToAgent) {
      await escalateToHumanAgent(event.data.sessionId, 'high_value_customer');
    }
    
    console.log(`✅ Support session ${event.data.sessionId} prioritized as ${priority}`);
  } catch (error) {
    console.error(`❌ Failed to prioritize support session:`, error.message);
    throw error;
  }
};

/**
 * Example: Data Synchronization Handler
 * Syncs data across different services when events occur
 */
export const dataSyncHandler: EventHandler = async (event, context) => {
  console.log(`🔄 Syncing data for event: ${event.type}`);
  
  try {
    // Route to appropriate sync logic based on event type
    switch (event.type) {
      case 'lead.created':
        if (isEventType<LeadCreatedEvent>(event, 'lead.created')) {
          await syncLeadToCRM(event.data);
          await syncLeadToMarketing(event.data);
        }
        break;
        
      case 'lead.converted':
        if (isEventType<LeadConvertedEvent>(event, 'lead.converted')) {
          await syncConversionToAnalytics(event.data);
          await updateLeadSourceAttribution(event.data);
        }
        break;
        
      default:
        console.log(`ℹ️ No sync logic for event type: ${event.type}`);
    }
    
    console.log(`✅ Data sync completed for ${event.type}`);
  } catch (error) {
    console.error(`❌ Data sync failed for ${event.type}:`, error.message);
    throw error;
  }
};

/**
 * Example: Audit Trail Handler
 * Creates audit logs for important business events
 */
export const auditTrailHandler: EventHandler = async (event, context) => {
  // Only audit specific event types
  const auditableEvents = [
    'lead.converted',
    'proposal.created',
    'campaign.launched',
    'project.created'
  ];
  
  if (!auditableEvents.includes(event.type)) {
    return; // Skip non-auditable events
  }
  
  console.log(`📝 Creating audit trail for: ${event.type}`);
  
  try {
    const auditEntry = {
      eventId: event.id,
      eventType: event.type,
      tenantId: event.tenantId,
      userId: event.userId,
      timestamp: event.timestamp,
      data: event.data,
      metadata: event.metadata,
      context: {
        correlationId: context?.correlationId,
        attempt: context?.attempt
      }
    };
    
    await createAuditLogEntry(auditEntry);
    console.log(`✅ Audit trail created for event ${event.id}`);
  } catch (error) {
    console.error(`❌ Failed to create audit trail:`, error.message);
    // Don't throw - audit failures shouldn't break business logic
  }
};

// ==========================================
// HELPER FUNCTIONS (Mock implementations)
// ==========================================

async function calculateLeadScore(leadData: LeadCreatedEvent['data']): Promise<number> {
  // Mock scoring algorithm
  let score = leadData.score || 50;
  
  // Add scoring factors
  if (leadData.source === 'referral') score += 20;
  if (leadData.source === 'organic') score += 10;
  if (leadData.companyId) score += 15;
  
  return Math.min(score, 100);
}

async function updateLeadScore(leadId: string, score: number): Promise<void> {
  console.log(`Updating lead ${leadId} score to ${score}`);
  // Mock database update
}

async function sendSlackNotification(channel: string, message: string): Promise<void> {
  console.log(`Slack ${channel}: ${message}`);
  // Mock Slack API call
}

async function storeCampaignAnalytics(analytics: any): Promise<void> {
  console.log(`Storing analytics:`, analytics);
  // Mock analytics storage
}

async function flagHighPerformingCampaign(campaignId: string): Promise<void> {
  console.log(`Flagging high-performing campaign: ${campaignId}`);
  // Mock flagging logic
}

async function flagLowPerformingCampaign(campaignId: string, reason: string): Promise<void> {
  console.log(`Flagging low-performing campaign: ${campaignId} - ${reason}`);
  // Mock flagging logic
}

async function getCustomerContext(contactId?: string): Promise<any> {
  if (!contactId) return null;
  
  // Mock customer data
  return {
    ltv: Math.random() * 200000,
    recentIssues: Math.floor(Math.random() * 5),
    tier: 'premium'
  };
}

async function updateSupportSessionPriority(sessionId: string, priority: string): Promise<void> {
  console.log(`Updating session ${sessionId} priority to ${priority}`);
  // Mock priority update
}

async function escalateToHumanAgent(sessionId: string, reason: string): Promise<void> {
  console.log(`Escalating session ${sessionId} to human agent: ${reason}`);
  // Mock escalation
}

async function syncLeadToCRM(leadData: LeadCreatedEvent['data']): Promise<void> {
  console.log(`Syncing lead ${leadData.leadId} to CRM`);
  // Mock CRM sync
}

async function syncLeadToMarketing(leadData: LeadCreatedEvent['data']): Promise<void> {
  console.log(`Syncing lead ${leadData.leadId} to marketing platform`);
  // Mock marketing sync
}

async function syncConversionToAnalytics(conversionData: LeadConvertedEvent['data']): Promise<void> {
  console.log(`Syncing conversion ${conversionData.leadId} to analytics`);
  // Mock analytics sync
}

async function updateLeadSourceAttribution(conversionData: LeadConvertedEvent['data']): Promise<void> {
  console.log(`Updating attribution for lead ${conversionData.leadId}`);
  // Mock attribution update
}

async function createAuditLogEntry(auditEntry: any): Promise<void> {
  console.log(`Creating audit log:`, auditEntry);
  // Mock audit log creation
}

