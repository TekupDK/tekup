import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DanishVoiceProcessorService } from '../danish-voice-processor.service';
import { CrossBusinessVoiceService } from '../cross-business-voice.service';
import { getWorkflowsByBusiness, getWorkflowById } from '../workflows/business-voice-workflows';
import { getDanishLanguageConfig, DANISH_BUSINESS_VOCABULARY } from '../danish-language-model.config';

// Mock audio data
const mockAudioBuffer = new ArrayBuffer(1024);

describe('Danish Voice Agent Integration', () => {
  let foodtruckProcessor: DanishVoiceProcessorService;
  let perfumeProcessor: DanishVoiceProcessorService;
  let constructionProcessor: DanishVoiceProcessorService;
  let crossBusinessService: CrossBusinessVoiceService;

  beforeEach(() => {
    // Initialize processors for each business
    foodtruckProcessor = new DanishVoiceProcessorService('foodtruck', 'copenhagen', 'casual');
    perfumeProcessor = new DanishVoiceProcessorService('perfume', 'copenhagen', 'mixed');
    constructionProcessor = new DanishVoiceProcessorService('construction', 'copenhagen', 'professional');

    crossBusinessService = new CrossBusinessVoiceService();
  });

  describe('Danish Language Model Configuration', () => {
    it('should configure Copenhagen dialect correctly', () => {
      const config = getDanishLanguageConfig('foodtruck', 'copenhagen', 'casual');

      expect(config.language).toBe('da-DK');
      expect(config.primaryDialect).toBe('copenhagen');
      expect(config.formalityLevel).toBe('casual');
      expect(config.businessType).toBe('foodtruck');
      expect(config.maxResponseTime).toBe(500);
    });

    it('should configure Jylland dialect correctly', () => {
      const config = getDanishLanguageConfig('perfume', 'jylland', 'mixed');

      expect(config.primaryDialect).toBe('jylland');
      expect(config.formalityLevel).toBe('mixed');
      expect(config.businessType).toBe('perfume');
    });

    it('should configure construction business professionally', () => {
      const config = getDanishLanguageConfig('construction', 'copenhagen', 'professional');

      expect(config.formalityLevel).toBe('professional');
      expect(config.businessType).toBe('construction');
    });
  });

  describe('Business Vocabulary', () => {
    it('should contain foodtruck menu items', () => {
      const foodtruckVocab = DANISH_BUSINESS_VOCABULARY.foodtruck;

      expect(foodtruckVocab.menu).toContain('burger');
      expect(foodtruckVocab.menu).toContain('pommes');
      expect(foodtruckVocab.menu).toContain('hotdog');
      expect(foodtruckVocab.payment).toContain('mobilepay');
      expect(foodtruckVocab.locations).toContain('københavn');
    });

    it('should contain perfume brands and fragrances', () => {
      const perfumeVocab = DANISH_BUSINESS_VOCABULARY.perfume;

      expect(perfumeVocab.brands).toContain('chanel');
      expect(perfumeVocab.brands).toContain('dior');
      expect(perfumeVocab.fragrances).toContain('sommerparfume');
      expect(perfumeVocab.fragrances).toContain('let parfume');
    });

    it('should contain construction projects and materials', () => {
      const constructionVocab = DANISH_BUSINESS_VOCABULARY.construction;

      expect(constructionVocab.projects).toContain('badeværelse');
      expect(constructionVocab.projects).toContain('køkken');
      expect(constructionVocab.materials).toContain('træ');
      expect(constructionVocab.materials).toContain('keramik');
    });
  });

  describe('Business Voice Workflows', () => {
    it('should return foodtruck workflows', () => {
      const workflows = getWorkflowsByBusiness('foodtruck');

      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows[0].businessType).toBe('foodtruck');
      expect(workflows.some(w => w.id === 'foodtruck_order')).toBe(true);
      expect(workflows.some(w => w.id === 'foodtruck_location')).toBe(true);
    });

    it('should return perfume workflows', () => {
      const workflows = getWorkflowsByBusiness('perfume');

      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows[0].businessType).toBe('perfume');
      expect(workflows.some(w => w.id === 'perfume_consultation')).toBe(true);
      expect(workflows.some(w => w.id === 'perfume_inventory')).toBe(true);
    });

    it('should return construction workflows', () => {
      const workflows = getWorkflowsByBusiness('construction');

      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows[0].businessType).toBe('construction');
      expect(workflows.some(w => w.id === 'construction_project_update')).toBe(true);
      expect(workflows.some(w => w.id === 'construction_scheduling')).toBe(true);
    });

    it('should find workflow by ID', () => {
      const orderWorkflow = getWorkflowById('foodtruck_order');

      expect(orderWorkflow).toBeDefined();
      expect(orderWorkflow?.businessType).toBe('foodtruck');
      expect(orderWorkflow?.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Danish Voice Processing - Foodtruck', () => {
    it('should process food ordering command', async () => {
      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Jeg vil gerne bestille en burger med pommes',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.language).toBe('da-DK');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.intent).toBe('food_order');
      expect(result.entities.some(e => e.type === 'menu_item')).toBe(true);
    });

    it('should process location inquiry', async () => {
      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hvor står food trucken i dag?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('foodtruck_inquiry');
      expect(result.businessWorkflow?.id).toBe('foodtruck_location');
    });

    it('should handle menu inquiry', async () => {
      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hvad har I af vegetariske retter?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('foodtruck_inquiry');
      expect(result.response).toContain('Velkommen til Foodtruck Fiesta');
    });

    it('should handle payment method inquiry', async () => {
      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Kan jeg betale med MobilePay?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('foodtruck_inquiry');
      expect(result.entities.some(e => e.value === 'mobilepay')).toBe(true);
    });
  });

  describe('Danish Voice Processing - Perfume', () => {
    it('should process perfume consultation request', async () => {
      const result = await perfumeProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Kan du anbefale en parfume til mig?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('perfume_consultation');
      expect(result.businessWorkflow?.id).toBe('perfume_consultation');
      expect(result.response).toContain('Essenza Perfume');
    });

    it('should process inventory check', async () => {
      const result = await perfumeProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Har I Chanel No. 5 på lager?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('perfume_inquiry');
      expect(result.entities.some(e => e.type === 'brand')).toBe(true);
      expect(result.entities.some(e => e.value === 'chanel')).toBe(true);
    });

    it('should handle fragrance preference inquiry', async () => {
      const result = await perfumeProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Jeg søger en let sommerparfume',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('perfume_consultation');
      expect(result.entities.some(e => e.value === 'let parfume')).toBe(true);
      expect(result.entities.some(e => e.value === 'sommerparfume')).toBe(true);
    });
  });

  describe('Danish Voice Processing - Construction', () => {
    it('should process project status inquiry', async () => {
      const result = await constructionProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hvad er status på mit badeværelsesprojekt?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('project_update');
      expect(result.businessWorkflow?.id).toBe('construction_project_update');
      expect(result.entities.some(e => e.type === 'project_type')).toBe(true);
    });

    it('should process scheduling request', async () => {
      const result = await constructionProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hvornår kan håndværkeren komme?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('construction_inquiry');
      expect(result.businessWorkflow?.id).toBe('construction_scheduling');
    });

    it('should handle cost estimate inquiry', async () => {
      const result = await constructionProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hvad koster det at renovere køkkenet?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('construction_inquiry');
      expect(result.entities.some(e => e.type === 'project_type')).toBe(true);
    });
  });

  describe('Cross-Business Voice Integration', () => {
    it('should start a cross-business session', () => {
      const session = crossBusinessService.startSession('cust_001', 'unified');

      expect(session.id).toBeDefined();
      expect(session.customerId).toBe('cust_001');
      expect(session.businessContext).toBe('unified');
      expect(session.startTime).toBeInstanceOf(Date);
    });

    it('should process voice with business context switching', async () => {
      const session = crossBusinessService.startSession('cust_001', 'unified');

      const result = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Jeg vil gerne bestille mad fra food trucken',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(result.crossBusinessFeatures).toBeDefined();
      expect(result.intent).toBe('food_order');
    });

    it('should recognize returning customers', async () => {
      const session = crossBusinessService.startSession('cust_001', 'foodtruck');

      const result = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Hej, det er Jonas',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(result.crossBusinessFeatures.customerRecognition).toContain('Jonas');
    });

    it('should generate cross-selling recommendations', async () => {
      const session = crossBusinessService.startSession('cust_001', 'perfume');

      const result = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Jeg leder efter en ny parfume',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(result.crossBusinessFeatures.crossSelling).toBeDefined();
      expect(result.crossBusinessFeatures.crossSelling.length).toBeGreaterThan(0);
    });
  });

  describe('Regional Accent Handling', () => {
    it('should handle Copenhagen accent', async () => {
      const copenhagenProcessor = new DanishVoiceProcessorService('foodtruck', 'copenhagen', 'casual');

      const result = await copenhagenProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hej med dig, hvad så?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('greeting');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle Jylland accent', async () => {
      const jyllandProcessor = new DanishVoiceProcessorService('foodtruck', 'jylland', 'casual');

      const result = await jyllandProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hej du, hvad sker der?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('greeting');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Formality Level Handling', () => {
    it('should use casual language for foodtruck', async () => {
      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hej, hvad kan du hjælpe mig med?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.response).toContain('Foodtruck Fiesta');
      expect(result.response).toMatch(/[Hh]ej/);
    });

    it('should use professional language for construction', async () => {
      const result = await constructionProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Godmorgen, jeg har brug for hjælp med et projekt',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.response).toContain('Rendetalje');
      expect(result.response).toMatch(/[Gg]odmorgen/);
    });
  });

  describe('Offline Capabilities', () => {
    it('should provide offline responses when internet is down', async () => {
      foodtruckProcessor.setOnlineStatus(false);

      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Hvad kan du hjælpe mig med?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.response).toContain('offline');
      expect(result.response).toContain('grundlæggende funktioner');
    });

    it('should support basic offline commands', async () => {
      foodtruckProcessor.setOnlineStatus(false);

      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'hjælp',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('help');
      expect(result.response).toContain('hjælp');
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle misunderstood commands gracefully', async () => {
      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'mumble mumble unclear words',
        confidence: 0.3,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('unknown');
      expect(result.response).toContain('forstod ikke helt');
      expect(result.suggestions).toBeDefined();
    });

    it('should provide helpful suggestions for unknown commands', async () => {
      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'hvad kan du?',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      expect(result.intent).toBe('help');
      expect(result.suggestions).toContain('bestille mad');
      expect(result.suggestions).toContain('hvor står i');
    });
  });

  describe('Performance and Response Time', () => {
    it('should process voice commands within 500ms', async () => {
      const startTime = Date.now();

      await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Jeg vil gerne bestille en burger',
        confidence: 0.9,
        sessionId: 'test_session'
      });

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(500);
    });

    it('should maintain high confidence for clear commands', async () => {
      const result = await foodtruckProcessor.processDanishVoice({
        audio: mockAudioBuffer,
        text: 'Jeg vil gerne bestille en burger med pommes og en cola',
        confidence: 0.95,
        sessionId: 'test_session'
      });

      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.intent).toBe('food_order');
    });
  });

  describe('Business Context Switching', () => {
    it('should switch from unified to foodtruck context', async () => {
      const session = crossBusinessService.startSession('cust_001', 'unified');

      const result = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Jeg vil gerne bestille mad',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(result.intent).toBe('food_order');
      expect(session.businessContext).toBe('foodtruck');
    });

    it('should switch from foodtruck to perfume context', async () => {
      const session = crossBusinessService.startSession('cust_001', 'foodtruck');

      const result = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Nu vil jeg gerne købe en parfume',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(result.intent).toBe('perfume_consultation');
      expect(session.businessContext).toBe('perfume');
    });
  });

  describe('Analytics and Monitoring', () => {
    it('should track session analytics', () => {
      const session = crossBusinessService.startSession('cust_001', 'unified');

      expect(session.analytics.totalTurns).toBe(0);
      expect(session.analytics.businessSwitches).toBe(0);
      expect(session.analytics.crossSellingAttempts).toBe(0);
    });

    it('should provide analytics summary', () => {
      const summary = crossBusinessService.getAnalyticsSummary();

      expect(summary.totalSessions).toBeGreaterThan(0);
      expect(summary.businessUsage).toBeDefined();
      expect(summary.totalCustomers).toBeGreaterThan(0);
    });

    it('should track cross-business interactions', () => {
      const session = crossBusinessService.startSession('cust_001', 'unified');

      // Simulate business context switching
      crossBusinessService['switchBusinessContext'](session, 'foodtruck');
      crossBusinessService['switchBusinessContext'](session, 'perfume');

      expect(session.analytics.businessSwitches).toBe(2);
      expect(session.crossBusinessInteractions.length).toBe(2);
    });
  });

  describe('Customer Data Management', () => {
    it('should retrieve customer information', () => {
      const customer = crossBusinessService.getCustomer('cust_001');

      expect(customer).toBeDefined();
      expect(customer?.name).toBe('Jonas Nielsen');
      expect(customer?.preferences.language).toBe('da-DK');
      expect(customer?.crossBusinessData.loyaltyLevel).toBe('gold');
    });

    it('should update customer preferences', () => {
      const success = crossBusinessService.updateCustomerPreferences('cust_001', {
        dialect: 'jylland',
        formality: 'professional'
      });

      expect(success).toBe(true);

      const customer = crossBusinessService.getCustomer('cust_001');
      expect(customer?.preferences.dialect).toBe('jylland');
      expect(customer?.preferences.formality).toBe('professional');
    });
  });

  describe('Integration Testing', () => {
    it('should handle complete food ordering workflow', async () => {
      const session = crossBusinessService.startSession('cust_001', 'foodtruck');

      // Step 1: Greeting and order intent
      const step1 = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Jeg vil gerne bestille en burger',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(step1.intent).toBe('food_order');

      // Step 2: Order type selection
      const step2 = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Takeaway',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(step2.intent).toBe('food_order');

      // Step 3: Payment method
      const step3 = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'MobilePay',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(step3.intent).toBe('food_order');
    });

    it('should handle perfume consultation workflow', async () => {
      const session = crossBusinessService.startSession('cust_001', 'perfume');

      // Step 1: Consultation request
      const step1 = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Kan du anbefale en parfume til mig?',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(step1.intent).toBe('perfume_consultation');

      // Step 2: Occasion specification
      const step2 = await crossBusinessService.processCrossBusinessVoice({
        audio: mockAudioBuffer,
        text: 'Hverdagsbrug',
        confidence: 0.9,
        sessionId: session.id
      });

      expect(step2.intent).toBe('perfume_consultation');
    });
  });
});
