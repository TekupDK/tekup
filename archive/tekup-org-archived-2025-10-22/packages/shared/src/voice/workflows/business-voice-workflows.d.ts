export interface BusinessVoiceWorkflow {
    id: string;
    businessType: 'foodtruck' | 'perfume' | 'construction';
    name: string;
    description: string;
    steps: WorkflowStep[];
    fallbacks: WorkflowFallback[];
    danishPhrases: string[];
    expectedDuration: number;
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
export declare const FOODTRUCK_VOICE_WORKFLOWS: BusinessVoiceWorkflow[];
export declare const PERFUME_VOICE_WORKFLOWS: BusinessVoiceWorkflow[];
export declare const CONSTRUCTION_VOICE_WORKFLOWS: BusinessVoiceWorkflow[];
export declare const getWorkflowsByBusiness: (businessType: string) => BusinessVoiceWorkflow[];
export declare const getWorkflowById: (id: string) => BusinessVoiceWorkflow | undefined;
export declare const getWorkflowsByPhrase: (phrase: string) => BusinessVoiceWorkflow[];
//# sourceMappingURL=business-voice-workflows.d.ts.map