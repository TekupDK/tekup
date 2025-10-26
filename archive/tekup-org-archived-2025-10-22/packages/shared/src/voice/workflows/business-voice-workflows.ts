import { VoiceCommand, VoiceResponse, ConversationTurn } from '../types/voice.types';
import { DanishLanguageModelConfig, DANISH_VOICE_OPTIMIZATIONS } from '../danish-language-model.config';

export interface BusinessVoiceWorkflow {
  id: string;
  businessType: 'foodtruck' | 'perfume' | 'construction';
  name: string;
  description: string;
  steps: WorkflowStep[];
  fallbacks: WorkflowFallback[];
  danishPhrases: string[];
  expectedDuration: number; // seconds
}

export interface WorkflowStep {
  id: string;
  type: 'question' | 'confirmation' | 'action' | 'information';
  danishPrompt: string;
  englishPrompt: string;
  expectedResponse: 'yes_no' | 'text' | 'choice' | 'number' | 'date' | 'none';
  choices?: string[];
  validation?: (response: string) => boolean;
  nextStep: string | ((response: string) => string);
  timeout?: number;
  retryCount?: number;
}

export interface WorkflowFallback {
  trigger: 'timeout' | 'invalid_response' | 'error' | 'user_confusion';
  danishMessage: string;
  englishMessage: string;
  action: 'retry' | 'skip' | 'restart' | 'human_handoff';
  maxRetries?: number;
}

export const FOODTRUCK_VOICE_WORKFLOWS: BusinessVoiceWorkflow[] = [
  {
    id: 'foodtruck_order',
    businessType: 'foodtruck',
    name: 'Food Ordering Workflow',
    description: 'Complete food ordering process via voice',
    expectedDuration: 120,
    danishPhrases: [
      'jeg vil gerne bestille',
      'kan jeg få',
      'jeg vil have',
      'bestilling',
      'takeaway',
      'levering'
    ],
    steps: [
      {
        id: 'greeting',
        type: 'question',
        danishPrompt: 'Velkommen til Foodtruck Fiesta! Hvad kan jeg hjælpe dig med i dag?',
        englishPrompt: 'Welcome to Foodtruck Fiesta! How can I help you today?',
        expectedResponse: 'text',
        nextStep: 'order_type'
      },
      {
        id: 'order_type',
        type: 'question',
        danishPrompt: 'Vil du have takeaway, afhentning eller levering?',
        englishPrompt: 'Would you like takeaway, pickup or delivery?',
        expectedResponse: 'choice',
        choices: ['takeaway', 'afhentning', 'levering'],
        nextStep: 'menu_selection'
      },
      {
        id: 'menu_selection',
        type: 'question',
        danishPrompt: 'Hvad vil du bestille? Vi har burger, hotdog, sandwich, salat og pommes.',
        englishPrompt: 'What would you like to order? We have burger, hotdog, sandwich, salad and fries.',
        expectedResponse: 'text',
        nextStep: 'customization'
      },
      {
        id: 'customization',
        type: 'question',
        danishPrompt: 'Vil du have noget tilbehør eller drikke til?',
        englishPrompt: 'Would you like any sides or drinks with that?',
        expectedResponse: 'yes_no',
        nextStep: (response) => response === 'ja' ? 'sides_selection' : 'location'
      },
      {
        id: 'sides_selection',
        type: 'question',
        danishPrompt: 'Hvad for noget tilbehør? Pommes, salat, drikke?',
        englishPrompt: 'What sides? Fries, salad, drinks?',
        expectedResponse: 'text',
        nextStep: 'location'
      },
      {
        id: 'location',
        type: 'question',
        danishPrompt: 'Hvor står food trucken i dag? Eller skal vi levere til dig?',
        englishPrompt: 'Where is the food truck today? Or should we deliver to you?',
        expectedResponse: 'text',
        nextStep: 'payment_method'
      },
      {
        id: 'payment_method',
        type: 'question',
        danishPrompt: 'Hvordan vil du betale? MobilePay, kort eller kontant?',
        englishPrompt: 'How would you like to pay? MobilePay, card or cash?',
        expectedResponse: 'choice',
        choices: ['mobilepay', 'kort', 'kontant'],
        nextStep: 'order_confirmation'
      },
      {
        id: 'order_confirmation',
        type: 'confirmation',
        danishPrompt: 'Perfekt! Din bestilling er registreret. Du får en bekræftelse på SMS. Tak for din bestilling!',
        englishPrompt: 'Perfect! Your order is registered. You will receive a confirmation by SMS. Thank you for your order!',
        expectedResponse: 'none',
        nextStep: 'end'
      }
    ],
    fallbacks: [
      {
        trigger: 'timeout',
        danishMessage: 'Jeg venter stadig på dit svar. Kan du gentage det?',
        englishMessage: 'I\'m still waiting for your answer. Can you repeat that?',
        action: 'retry',
        maxRetries: 2
      },
      {
        trigger: 'invalid_response',
        danishMessage: 'Jeg forstod ikke helt. Kan du sige det igen?',
        englishMessage: 'I didn\'t quite understand. Can you say that again?',
        action: 'retry',
        maxRetries: 3
      },
      {
        trigger: 'user_confusion',
        danishMessage: 'Lad mig hjælpe dig. Hvad vil du gerne bestille?',
        englishMessage: 'Let me help you. What would you like to order?',
        action: 'restart'
      }
    ]
  },
  {
    id: 'foodtruck_location',
    businessType: 'foodtruck',
    name: 'Location Inquiry Workflow',
    description: 'Find food truck location and hours',
    expectedDuration: 30,
    danishPhrases: [
      'hvor står food trucken',
      'hvor kan jeg finde jer',
      'åbningstider',
      'hvor er i i dag'
    ],
    steps: [
      {
        id: 'location_request',
        type: 'question',
        danishPrompt: 'Vi står i dag på {current_location}. Hvornår vil du komme forbi?',
        englishPrompt: 'We are located today at {current_location}. When would you like to come by?',
        expectedResponse: 'text',
        nextStep: 'hours_info'
      },
      {
        id: 'hours_info',
        type: 'information',
        danishPrompt: 'Vi er åbne fra {open_time} til {close_time}. Kommer du i dag?',
        englishPrompt: 'We are open from {open_time} to {close_time}. Are you coming today?',
        expectedResponse: 'yes_no',
        nextStep: 'end'
      }
    ],
    fallbacks: [
      {
        trigger: 'timeout',
        danishMessage: 'Du kan altid tjekke vores app for den seneste information.',
        englishMessage: 'You can always check our app for the latest information.',
        action: 'skip'
      }
    ]
  }
];

export const PERFUME_VOICE_WORKFLOWS: BusinessVoiceWorkflow[] = [
  {
    id: 'perfume_consultation',
    businessType: 'perfume',
    name: 'Perfume Consultation Workflow',
    description: 'Personalized perfume recommendation process',
    expectedDuration: 180,
    danishPhrases: [
      'kan du anbefale en parfume',
      'jeg søger en parfume',
      'rådgivning',
      'konsultation',
      'hjælp med valg'
    ],
    steps: [
      {
        id: 'greeting',
        type: 'question',
        danishPrompt: 'Velkommen til Essenza Perfume! Lad mig hjælpe dig med at finde din perfekte duft. Hvad leder du efter?',
        englishPrompt: 'Welcome to Essenza Perfume! Let me help you find your perfect fragrance. What are you looking for?',
        expectedResponse: 'text',
        nextStep: 'occasion'
      },
      {
        id: 'occasion',
        type: 'question',
        danishPrompt: 'Hvad skal du bruge parfumen til? Hverdagsbrug, arbejde, fest eller en særlig lejlighed?',
        englishPrompt: 'What do you need the perfume for? Daily use, work, party or a special occasion?',
        expectedResponse: 'choice',
        choices: ['hverdagsbrug', 'arbejde', 'fest', 'særlig lejlighed'],
        nextStep: 'season'
      },
      {
        id: 'season',
        type: 'question',
        danishPrompt: 'Hvilken årstid tænker du primært på? Sommer, vinter eller hele året?',
        englishPrompt: 'Which season are you primarily thinking of? Summer, winter or year-round?',
        expectedResponse: 'choice',
        choices: ['sommer', 'vinter', 'hele året'],
        nextStep: 'intensity'
      },
      {
        id: 'intensity',
        type: 'question',
        danishPrompt: 'Foretrækker du en let, medium eller kraftig duft?',
        englishPrompt: 'Do you prefer a light, medium or strong fragrance?',
        expectedResponse: 'choice',
        choices: ['let', 'medium', 'kraftig'],
        nextStep: 'budget'
      },
      {
        id: 'budget',
        type: 'question',
        danishPrompt: 'Hvad er dit budget? Vi har parfumer fra 200 til 2000 kroner.',
        englishPrompt: 'What is your budget? We have perfumes from 200 to 2000 kroner.',
        expectedResponse: 'choice',
        choices: ['200-500', '500-1000', '1000-2000', 'over 2000'],
        nextStep: 'recommendation'
      },
      {
        id: 'recommendation',
        type: 'information',
        danishPrompt: 'Baseret på dine præferencer anbefaler jeg {recommended_perfume}. Den koster {price} kroner. Vil du have flere detaljer?',
        englishPrompt: 'Based on your preferences, I recommend {recommended_perfume}. It costs {price} kroner. Would you like more details?',
        expectedResponse: 'yes_no',
        nextStep: (response) => response === 'ja' ? 'detailed_info' : 'end'
      },
      {
        id: 'detailed_info',
        type: 'information',
        danishPrompt: 'Denne parfume har noter af {notes}. Den holder i {longevity} timer og er perfekt til {occasion}. Skal jeg reservere den til dig?',
        englishPrompt: 'This perfume has notes of {notes}. It lasts for {longevity} hours and is perfect for {occasion}. Should I reserve it for you?',
        expectedResponse: 'yes_no',
        nextStep: 'end'
      }
    ],
    fallbacks: [
      {
        trigger: 'timeout',
        danishMessage: 'Tag dig tid til at tænke. Hvad foretrækker du?',
        englishMessage: 'Take your time to think. What do you prefer?',
        action: 'retry',
        maxRetries: 2
      },
      {
        trigger: 'user_confusion',
        danishMessage: 'Lad mig forenkle det. Hvad er det vigtigste for dig?',
        englishMessage: 'Let me simplify this. What is most important to you?',
        action: 'restart'
      }
    ]
  },
  {
    id: 'perfume_inventory',
    businessType: 'perfume',
    name: 'Inventory Check Workflow',
    description: 'Check product availability and stock',
    expectedDuration: 60,
    danishPhrases: [
      'har i på lager',
      'er det tilgængeligt',
      'kan jeg købe',
      'udsolgt',
      'bestilling'
    ],
    steps: [
      {
        id: 'product_inquiry',
        type: 'question',
        danishPrompt: 'Hvilken parfume leder du efter?',
        englishPrompt: 'Which perfume are you looking for?',
        expectedResponse: 'text',
        nextStep: 'availability_check'
      },
      {
        id: 'availability_check',
        type: 'information',
        danishPrompt: 'Lad mig tjekke lagerstatus for {product}. {availability_status}.',
        englishPrompt: 'Let me check the stock status for {product}. {availability_status}.',
        expectedResponse: 'none',
        nextStep: 'next_steps'
      },
      {
        id: 'next_steps',
        type: 'question',
        danishPrompt: 'Vil du reservere den, få besked når den er på lager igen, eller skal jeg anbefale noget lignende?',
        englishPrompt: 'Would you like to reserve it, get notified when it\'s back in stock, or should I recommend something similar?',
        expectedResponse: 'choice',
        choices: ['reservere', 'besked', 'anbefaling'],
        nextStep: 'end'
      }
    ],
    fallbacks: [
      {
        trigger: 'invalid_response',
        danishMessage: 'Jeg kan hjælpe dig med at finde alternativer eller tage din bestilling.',
        englishMessage: 'I can help you find alternatives or take your order.',
        action: 'skip'
      }
    ]
  }
];

export const CONSTRUCTION_VOICE_WORKFLOWS: BusinessVoiceWorkflow[] = [
  {
    id: 'construction_project_update',
    businessType: 'construction',
    name: 'Project Status Update Workflow',
    description: 'Get current project status and progress updates',
    expectedDuration: 90,
    danishPhrases: [
      'hvad er status på mit projekt',
      'hvordan går det med byggeriet',
      'projekt opdatering',
      'fremgang',
      'hvornår er det færdigt'
    ],
    steps: [
      {
        id: 'project_identification',
        type: 'question',
        danishPrompt: 'Hvilket projekt vil du have opdatering på? Badeværelse, køkken, eller noget andet?',
        englishPrompt: 'Which project would you like an update on? Bathroom, kitchen, or something else?',
        expectedResponse: 'text',
        nextStep: 'project_status'
      },
      {
        id: 'project_status',
        type: 'information',
        danishPrompt: 'Dit {project_type} projekt er {progress_percent}% færdigt. {current_status}.',
        englishPrompt: 'Your {project_type} project is {progress_percent}% complete. {current_status}.',
        expectedResponse: 'none',
        nextStep: 'timeline'
      },
      {
        id: 'timeline',
        type: 'information',
        danishPrompt: 'Vi forventer at være færdige om {estimated_completion}. Er der noget specifikt du gerne vil vide mere om?',
        englishPrompt: 'We expect to be finished in {estimated_completion}. Is there anything specific you would like to know more about?',
        expectedResponse: 'yes_no',
        nextStep: (response) => response === 'ja' ? 'detailed_update' : 'end'
      },
      {
        id: 'detailed_update',
        type: 'information',
        danishPrompt: 'Lige nu arbejder vi med {current_work}. {next_steps}. Har du spørgsmål til processen?',
        englishPrompt: 'Right now we are working on {current_work}. {next_steps}. Do you have questions about the process?',
        expectedResponse: 'yes_no',
        nextStep: 'end'
      }
    ],
    fallbacks: [
      {
        trigger: 'timeout',
        danishMessage: 'Du kan altid ringe til os direkte hvis du har spørgsmål.',
        englishMessage: 'You can always call us directly if you have questions.',
        action: 'skip'
      }
    ]
  },
  {
    id: 'construction_scheduling',
    businessType: 'construction',
    name: 'Scheduling and Planning Workflow',
    description: 'Schedule appointments and plan work',
    expectedDuration: 120,
    danishPhrases: [
      'hvornår kan håndværkeren komme',
      'planlægning',
      'tidsplan',
      'aftale',
      'besøg'
    ],
    steps: [
      {
        id: 'scheduling_request',
        type: 'question',
        danishPrompt: 'Hvad skal vi planlægge? Besøg, arbejde eller konsultation?',
        englishPrompt: 'What should we plan? Visit, work or consultation?',
        expectedResponse: 'choice',
        choices: ['besøg', 'arbejde', 'konsultation'],
        nextStep: 'urgency'
      },
      {
        id: 'urgency',
        type: 'question',
        danishPrompt: 'Hvor presserende er det? Kan vente eller skal det ske snart?',
        englishPrompt: 'How urgent is it? Can wait or needs to happen soon?',
        expectedResponse: 'choice',
        choices: ['kan vente', 'moderat', 'presserende', 'akut'],
        nextStep: 'preferred_time'
      },
      {
        id: 'preferred_time',
        type: 'question',
        danishPrompt: 'Hvad er din foretrukne tid? Morgen, eftermiddag eller aften?',
        englishPrompt: 'What is your preferred time? Morning, afternoon or evening?',
        expectedResponse: 'choice',
        choices: ['morgen', 'eftermiddag', 'aften', 'fleksibelt'],
        nextStep: 'availability_check'
      },
      {
        id: 'availability_check',
        type: 'information',
        danishPrompt: 'Lad mig tjekke vores kalender. Vi har ledig tid {available_slots}. Hvornår passer det dig bedst?',
        englishPrompt: 'Let me check our calendar. We have available time {available_slots}. When suits you best?',
        expectedResponse: 'text',
        nextStep: 'confirmation'
      },
      {
        id: 'confirmation',
        type: 'confirmation',
        danishPrompt: 'Perfekt! Vi har booket {appointment_time}. Du får en bekræftelse på SMS. Er der andet vi skal planlægge?',
        englishPrompt: 'Perfect! We have booked {appointment_time}. You will receive a confirmation by SMS. Is there anything else we should plan?',
        expectedResponse: 'yes_no',
        nextStep: 'end'
      }
    ],
    fallbacks: [
      {
        trigger: 'timeout',
        danishMessage: 'Jeg kan sende dig en SMS med ledige tider, så du kan svare når det passer dig.',
        englishMessage: 'I can send you an SMS with available times, so you can reply when it suits you.',
        action: 'skip'
      }
    ]
  }
];

export const getWorkflowsByBusiness = (businessType: string): BusinessVoiceWorkflow[] => {
  switch (businessType) {
    case 'foodtruck':
      return FOODTRUCK_VOICE_WORKFLOWS;
    case 'perfume':
      return PERFUME_VOICE_WORKFLOWS;
    case 'construction':
      return CONSTRUCTION_VOICE_WORKFLOWS;
    default:
      return [...FOODTRUCK_VOICE_WORKFLOWS, ...PERFUME_VOICE_WORKFLOWS, ...CONSTRUCTION_VOICE_WORKFLOWS];
  }
};

export const getWorkflowById = (id: string): BusinessVoiceWorkflow | undefined => {
  const allWorkflows = [
    ...FOODTRUCK_VOICE_WORKFLOWS,
    ...PERFUME_VOICE_WORKFLOWS,
    ...CONSTRUCTION_VOICE_WORKFLOWS
  ];
  return allWorkflows.find(workflow => workflow.id === id);
};

export const getWorkflowsByPhrase = (phrase: string): BusinessVoiceWorkflow[] => {
  const lowerPhrase = phrase.toLowerCase();
  const allWorkflows = [
    ...FOODTRUCK_VOICE_WORKFLOWS,
    ...PERFUME_VOICE_WORKFLOWS,
    ...CONSTRUCTION_VOICE_WORKFLOWS
  ];
  
  return allWorkflows.filter(workflow => 
    workflow.danishPhrases.some(danishPhrase => 
      danishPhrase.toLowerCase().includes(lowerPhrase)
    )
  );
};