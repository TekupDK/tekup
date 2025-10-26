import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpeechClient } from '@google-cloud/speech';
import OpenAI from 'openai';

import { VoiceCommand } from './entities/voice-command.entity';
import { BusinessConfig } from '../business-config/entities/business-config.entity';
import { ProcessVoiceCommandDto } from './dto/process-voice-command.dto';
import { VoiceCommandResult } from './interfaces/voice-command-result.interface';

@Injectable()
export class VoiceProcessingService {
  private readonly logger = new Logger(VoiceProcessingService.name);
  private readonly speechClient: SpeechClient;
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(VoiceCommand)
    private voiceCommandRepository: Repository<VoiceCommand>,
  ) {
    // Initialize Google Speech-to-Text
    this.speechClient = new SpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    // Initialize OpenAI for intent recognition
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processVoiceCommand(
    audioBuffer: Buffer,
    businessConfig: BusinessConfig,
    userId: string
  ): Promise<VoiceCommandResult> {
    try {
      this.logger.log(`Processing voice command for business: ${businessConfig.name}`);

      // Step 1: Convert speech to text (Danish optimized)
      const transcript = await this.speechToText(audioBuffer);
      
      // Step 2: Extract intent using business context
      const intent = await this.extractIntent(transcript, businessConfig);
      
      // Step 3: Execute command based on intent
      const result = await this.executeCommand(intent, businessConfig);
      
      // Step 4: Log command for analytics
      await this.logCommand({
        transcript,
        intent: intent.name,
        confidence: intent.confidence,
        businessId: businessConfig.id,
        userId,
        result: result.success,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      this.logger.error(`Voice processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async speechToText(audioBuffer: Buffer): Promise<string> {
    const request = {
      audio: { content: audioBuffer.toString('base64') },
      config: {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 48000,
        languageCode: 'da-DK',
        model: 'latest_long',
        useEnhanced: true,
        // Danish-specific optimizations
        speechContexts: [{
          phrases: [
            'bestil', 'ordre', 'pizza', 'burger', 'kaffe',
            'kunde', 'booking', 'reservation', 'betaling',
            'lager', 'inventory', 'rapport', 'status'
          ],
          boost: 10.0
        }],
      },
    };

    const [response] = await this.speechClient.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join('\n') || '';

    this.logger.log(`Speech-to-text result: "${transcription}"`);
    return transcription;
  }

  private async extractIntent(
    transcript: string, 
    businessConfig: BusinessConfig
  ): Promise<{ name: string; confidence: number; parameters: any }> {
    
    const systemPrompt = `Du er en dansk voice command processor for ${businessConfig.name}.
    
Business type: ${businessConfig.type}
Available commands: ${businessConfig.voiceCommands.map(cmd => cmd.name).join(', ')}

Analyser denne danske voice command og returner JSON med:
{
  "name": "command_name",
  "confidence": 0.95,
  "parameters": { "extracted_data": "value" }
}

Eksempler for ${businessConfig.type}:
${this.getExampleCommands(businessConfig.type)}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.logger.log(`Intent extracted: ${result.name} (confidence: ${result.confidence})`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to parse intent: ${error.message}`);
      return { name: 'unknown', confidence: 0, parameters: {} };
    }
  }

  private async executeCommand(
    intent: { name: string; confidence: number; parameters: any },
    businessConfig: BusinessConfig
  ): Promise<VoiceCommandResult> {
    
    const startTime = Date.now();
    
    // Find matching command in business config
    const command = businessConfig.voiceCommands.find(cmd => cmd.name === intent.name);
    
    if (!command || intent.confidence < 0.7) {
      return {
        success: false,
        message: 'Undskyld, jeg forstod ikke kommandoen. Prøv igen.',
        confidence: intent.confidence,
        processingTime: Date.now() - startTime
      };
    }

    try {
      // Execute business-specific command handler
      const handler = await this.getCommandHandler(command.type);
      const result = await handler.execute(intent.parameters, businessConfig);
      
      return {
        success: true,
        message: result.message,
        data: result.data,
        confidence: intent.confidence,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error(`Command execution failed: ${error.message}`);
      return {
        success: false,
        message: 'Der opstod en fejl. Prøv igen senere.',
        confidence: intent.confidence,
        processingTime: Date.now() - startTime
      };
    }
  }

  private getExampleCommands(businessType: string): string {
    const examples = {
      restaurant: `
        "Bestil en stor pizza margherita" → order_food
        "Tjek lager for tomater" → check_inventory  
        "Hvor mange kunder venter?" → get_queue_status`,
      
      retail: `
        "Tjek pris på iPhone 15" → check_price
        "Hvor mange på lager?" → check_inventory
        "Lav en rabat på 20%" → apply_discount`,
        
      service: `
        "Book møde med kunde" → schedule_meeting
        "Send faktura til Firma ABC" → send_invoice
        "Tjek dagens appointments" → get_schedule`
    };

    return examples[businessType] || examples.service;
  }

  private async getCommandHandler(commandType: string) {
    // Dynamic command handler loading based on type
    const handlers = {
      'order_food': () => import('./handlers/order-food.handler'),
      'check_inventory': () => import('./handlers/inventory.handler'),
      'schedule_meeting': () => import('./handlers/scheduling.handler'),
      'send_invoice': () => import('./handlers/billing.handler'),
      // Add more handlers as needed
    };

    const handlerModule = await handlers[commandType]?.();
    return handlerModule?.default || handlerModule?.handler;
  }

  private async logCommand(commandData: {
    transcript: string;
    intent: string;
    confidence: number;
    businessId: string;
    userId: string;
    result: boolean;
    processingTime: number;
  }) {
    const voiceCommand = this.voiceCommandRepository.create({
      ...commandData,
      timestamp: new Date(),
    });

    await this.voiceCommandRepository.save(voiceCommand);
    this.logger.log(`Command logged: ${commandData.intent}`);
  }
}