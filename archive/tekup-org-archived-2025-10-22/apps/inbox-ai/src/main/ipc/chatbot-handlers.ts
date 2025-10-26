import { ipcMain } from 'electron';
import { ChatbotService } from '../services/ChatbotService';
import { AIService } from '../services/AIService';
import { EmailService } from '../services/EmailService';
import { DatabaseService } from '../services/DatabaseService';
import { 
  ChatRequest, 
  ChatResponse, 
  ChatConversation,
  ChatbotConfig,
  ChatAction
} from '../../shared/types/chatbot';
import { AppError } from '../../shared/types/common';

let chatbotService: ChatbotService;

/**
 * Setup chatbot IPC handlers
 */
export function setupChatbotHandlers(chatbotService: ChatbotService): void {
  // Send message to chatbot
  ipcMain.handle('chatbot:sendMessage', async (event, request: ChatRequest) => {
    try {
      return await chatbotService.processMessage(request);
    } catch (error) {
      logger.error('Error processing chatbot message:', error);
      throw error;
    }
  });

  // Get conversations
  ipcMain.handle('chatbot:getConversations', async () => {
    try {
      return await chatbotService.getConversations();
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  });

  // Delete conversation
  ipcMain.handle('chatbot:deleteConversation', async (event, conversationId: string) => {
    try {
      await chatbotService.deleteConversation(conversationId);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      throw error;
    }
  });

  // Update chatbot config
  ipcMain.handle('chatbot:updateConfig', async (event, config: any) => {
    try {
      chatbotService.updateConfig(config);
      return { success: true };
    } catch (error) {
      logger.error('Error updating chatbot config:', error);
      throw error;
    }
  });

  // Get chatbot config
  ipcMain.handle('chatbot:getConfig', async () => {
    try {
      return chatbotService.getConfig();
    } catch (error) {
      logger.error('Error getting chatbot config:', error);
      throw error;
    }
  });

  // Execute chatbot action
  ipcMain.handle('chatbot:executeAction', async (event, action: ChatAction) => {
    try {
      return await chatbotService.executeAction(action);
    } catch (error) {
      logger.error('Error executing chatbot action:', error);
      throw error;
    }
  });

  // Get chatbot status
  ipcMain.handle('chatbot:getStatus', async () => {
    try {
      return chatbotService.getState();
    } catch (error) {
      logger.error('Error getting chatbot status:', error);
      throw error;
    }
  });

  // Get chatbot capabilities
  ipcMain.handle('chatbot:getCapabilities', async () => {
    try {
      return chatbotService.getCapabilities();
    } catch (error) {
      logger.error('Error getting chatbot capabilities:', error);
      throw error;
    }
  });
}

export function initializeChatbotHandlers(
  aiService: AIService,
  emailService: EmailService,
  dbService: DatabaseService
) {
  chatbotService = new ChatbotService(aiService, emailService, dbService);

  // Send message to chatbot
  ipcMain.handle('chatbot:sendMessage', async (event, request: ChatRequest): Promise<ChatResponse> => {
    try {
      return await chatbotService.processMessage(request);
    } catch (error) {
      logger.error('Error in chatbot:sendMessage:', error);
      throw error;
    }
  });

  // Get all conversations
  ipcMain.handle('chatbot:getConversations', async (): Promise<ChatConversation[]> => {
    try {
      return await chatbotService.getConversations();
    } catch (error) {
      logger.error('Error in chatbot:getConversations:', error);
      throw error;
    }
  });

  // Delete conversation
  ipcMain.handle('chatbot:deleteConversation', async (event, conversationId: string): Promise<void> => {
    try {
      await chatbotService.deleteConversation(conversationId);
    } catch (error) {
      logger.error('Error in chatbot:deleteConversation:', error);
      throw error;
    }
  });

  // Update chatbot configuration
  ipcMain.handle('chatbot:updateConfig', async (event, config: Partial<ChatbotConfig>): Promise<void> => {
    try {
      chatbotService.updateConfig(config);
    } catch (error) {
      logger.error('Error in chatbot:updateConfig:', error);
      throw error;
    }
  });

  // Get chatbot configuration
  ipcMain.handle('chatbot:getConfig', async (): Promise<ChatbotConfig> => {
    try {
      return chatbotService.getConfig();
    } catch (error) {
      logger.error('Error in chatbot:getConfig:', error);
      throw error;
    }
  });

  // Execute chatbot action
  ipcMain.handle('chatbot:executeAction', async (event, action: ChatAction): Promise<void> => {
    try {
      await executeAction(action, emailService);
    } catch (error) {
      logger.error('Error in chatbot:executeAction:', error);
      throw error;
    }
  });

  // Get chatbot status
  ipcMain.handle('chatbot:getStatus', async () => {
    try {
      return {
        isInitialized: !!chatbotService,
        activeConversations: chatbotService ? (await chatbotService.getConversations()).length : 0,
        config: chatbotService ? chatbotService.getConfig() : null
      };
    } catch (error) {
      logger.error('Error in chatbot:getStatus:', error);
      throw error;
    }
  });
}

// Execute chatbot actions
async function executeAction(action: ChatAction, emailService: EmailService): Promise<void> {
  switch (action.type) {
    case 'compose':
      // Trigger email composition
      // This would typically open the compose window or navigate to compose view
      break;
      
    case 'reply':
      if (action.payload?.emailId) {
        // Trigger reply to specific email
        const email = await emailService.getEmailById(action.payload.emailId);
        if (email) {
          // Open reply composer with email context
        }
      }
      break;
      
    case 'forward':
      if (action.payload?.emailId) {
        // Trigger forward for specific email
        const email = await emailService.getEmailById(action.payload.emailId);
        if (email) {
          // Open forward composer with email context
        }
      }
      break;
      
    case 'archive':
      if (action.payload?.emailId) {
        // Archive specific email
        await emailService.archiveEmail(action.payload.emailId);
      }
      break;
      
    case 'delete':
      if (action.payload?.emailId) {
        // Delete specific email
        await emailService.deleteEmail(action.payload.emailId);
      }
      break;
      
    case 'search':
      if (action.payload?.query) {
        // Trigger search with specific query
        // This would typically update the search state in the UI
      }
      break;
      
    case 'schedule':
      if (action.payload?.emailId && action.payload?.scheduleTime) {
        // Schedule email for later sending
        await emailService.scheduleEmail(action.payload.emailId, action.payload.scheduleTime);
      }
      break;
      
    default:
      logger.warn('Unknown action type:', action.type);
  }
}

// Cleanup handlers
export function cleanupChatbotHandlers() {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-main-ipc-cha');

  const handlers = [
    'chatbot:sendMessage',
    'chatbot:getConversations',
    'chatbot:deleteConversation',
    'chatbot:updateConfig',
    'chatbot:getConfig',
    'chatbot:executeAction',
    'chatbot:getStatus'
  ];
  
  handlers.forEach(handler => {
    ipcMain.removeAllListeners(handler);
  });
}