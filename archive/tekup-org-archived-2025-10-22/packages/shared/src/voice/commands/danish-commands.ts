import { VoiceCommand } from '../types/voice.types';
import { TEKUP_FUNCTIONS } from '../functions/tekup-functions';

export interface DanishVoiceCommand {
  id: string;
  danishPhrase: string;
  englishPhrase: string;
  functionId: string;
  description: string;
  examples: string[];
  category: 'leads' | 'compliance' | 'backup' | 'search' | 'system' | 'navigation';
}

export const DANISH_VOICE_COMMANDS: DanishVoiceCommand[] = [
  // LEAD MANAGEMENT
  {
    id: 'show_all_leads',
    danishPhrase: 'vis alle leads',
    englishPhrase: 'show all leads',
    functionId: 'get_leads',
    description: 'Viser alle leads for den aktuelle tenant',
    examples: ['vis alle leads', 'vis leads', 'åbn leads'],
    category: 'leads'
  },
  {
    id: 'show_leads_by_status',
    danishPhrase: 'vis leads med status',
    englishPhrase: 'show leads with status',
    functionId: 'get_leads',
    description: 'Viser leads med specifik status',
    examples: ['vis nye leads', 'vis kontaktede leads', 'vis kvalificerede leads'],
    category: 'leads'
  },
  {
    id: 'create_new_lead',
    danishPhrase: 'opret ny lead',
    englishPhrase: 'create new lead',
    functionId: 'create_lead',
    description: 'Opretter en ny lead',
    examples: ['opret ny lead', 'ny lead', 'tilføj lead'],
    category: 'leads'
  },
  {
    id: 'search_leads',
    danishPhrase: 'søg efter leads',
    englishPhrase: 'search for leads',
    functionId: 'search_leads',
    description: 'Søger efter leads baseret på kriterier',
    examples: ['søg efter kunde', 'find leads', 'søg leads'],
    category: 'search'
  },
  
  // COMPLIANCE
  {
    id: 'run_compliance_check',
    danishPhrase: 'kør compliance check',
    englishPhrase: 'run compliance check',
    functionId: 'compliance_check',
    description: 'Kører compliance check for tenant',
    examples: ['kør compliance', 'start compliance check', 'compliance status'],
    category: 'compliance'
  },
  {
    id: 'check_nis2',
    danishPhrase: 'tjek nis2 compliance',
    englishPhrase: 'check nis2 compliance',
    functionId: 'compliance_check',
    description: 'Kører specifik NIS2 compliance check',
    examples: ['nis2 check', 'tjek nis2', 'nis2 compliance'],
    category: 'compliance'
  },
  {
    id: 'check_gdpr',
    danishPhrase: 'tjek gdpr compliance',
    englishPhrase: 'check gdpr compliance',
    functionId: 'compliance_check',
    description: 'Kører specifik GDPR compliance check',
    examples: ['gdpr check', 'tjek gdpr', 'gdpr compliance'],
    category: 'compliance'
  },
  
  // BACKUP & ARCHIVING
  {
    id: 'start_backup',
    danishPhrase: 'start backup',
    englishPhrase: 'start backup',
    functionId: 'start_backup',
    description: 'Starter backup proces',
    examples: ['start backup', 'begynd backup', 'backup nu'],
    category: 'backup'
  },
  {
    id: 'start_full_backup',
    danishPhrase: 'start fuld backup',
    englishPhrase: 'start full backup',
    functionId: 'start_backup',
    description: 'Starter fuld backup',
    examples: ['fuld backup', 'komplet backup', 'start fuld backup'],
    category: 'backup'
  },
  {
    id: 'start_compliance_backup',
    danishPhrase: 'start compliance backup',
    englishPhrase: 'start compliance backup',
    functionId: 'start_backup',
    description: 'Starter compliance backup',
    examples: ['compliance backup', 'start compliance backup'],
    category: 'backup'
  },
  
  // METRICS & ANALYTICS
  {
    id: 'show_metrics',
    danishPhrase: 'vis metrics',
    englishPhrase: 'show metrics',
    functionId: 'get_metrics',
    description: 'Viser metrics og statistikker',
    examples: ['vis metrics', 'åbn metrics', 'statistikker'],
    category: 'search'
  },
  {
    id: 'show_performance',
    danishPhrase: 'vis performance',
    englishPhrase: 'show performance',
    functionId: 'get_metrics',
    description: 'Viser performance metrics',
    examples: ['performance', 'vis performance', 'ydelse'],
    category: 'search'
  },
  
  // TENANT MANAGEMENT
  {
    id: 'switch_to_rendetalje',
    danishPhrase: 'skift til rendetalje',
    englishPhrase: 'switch to rendetalje',
    functionId: 'switch_tenant',
    description: 'Skifter til Rendetalje tenant',
    examples: ['rendetalje', 'skift til rendetalje', 'åbn rendetalje'],
    category: 'navigation'
  },
  {
    id: 'switch_to_foodtruck',
    danishPhrase: 'skift til foodtruck',
    englishPhrase: 'switch to foodtruck',
    functionId: 'switch_tenant',
    description: 'Skifter til FoodTruck tenant',
    examples: ['foodtruck', 'skift til foodtruck', 'åbn foodtruck'],
    category: 'navigation'
  },
  {
    id: 'switch_to_tekup',
    danishPhrase: 'skift til tekup',
    englishPhrase: 'switch to tekup',
    functionId: 'switch_tenant',
    description: 'Skifter til TekUp tenant',
    examples: ['tekup', 'skift til tekup', 'åbn tekup'],
    category: 'navigation'
  },
  {
    id: 'tenant_info',
    danishPhrase: 'vis tenant information',
    englishPhrase: 'show tenant information',
    functionId: 'get_tenant_info',
    description: 'Viser information om nuværende tenant',
    examples: ['tenant info', 'vis tenant', 'hvilken tenant'],
    category: 'system'
  },
  
  // SYSTEM COMMANDS
  {
    id: 'help',
    danishPhrase: 'hjælp',
    englishPhrase: 'help',
    functionId: '',
    description: 'Viser hjælp og tilgængelige kommandoer',
    examples: ['hjælp', 'hvad kan du', 'vis kommandoer'],
    category: 'system'
  },
  {
    id: 'stop_listening',
    danishPhrase: 'stop lytning',
    englishPhrase: 'stop listening',
    functionId: '',
    description: 'Stopper voice agent lytning',
    examples: ['stop', 'stop lytning', 'luk ned'],
    category: 'system'
  }
];

export const getCommandsByCategory = (category: string): DanishVoiceCommand[] => {
  return DANISH_VOICE_COMMANDS.filter(cmd => cmd.category === category);
};

export const getCommandsByFunction = (functionId: string): DanishVoiceCommand[] => {
  return DANISH_VOICE_COMMANDS.filter(cmd => cmd.functionId === functionId);
};

export const searchCommands = (query: string): DanishVoiceCommand[] => {
  const lowerQuery = query.toLowerCase();
  return DANISH_VOICE_COMMANDS.filter(cmd => 
    cmd.danishPhrase.toLowerCase().includes(lowerQuery) ||
    cmd.englishPhrase.toLowerCase().includes(lowerQuery) ||
    cmd.description.toLowerCase().includes(lowerQuery) ||
    cmd.examples.some(example => example.toLowerCase().includes(lowerQuery))
  );
};

export const getAllCommands = (): DanishVoiceCommand[] => {
  return DANISH_VOICE_COMMANDS;
};