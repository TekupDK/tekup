export interface DanishLanguageModelConfig {
    language: 'da-DK';
    primaryDialect: 'copenhagen' | 'jylland' | 'fyn' | 'bornholm';
    formalityLevel: 'casual' | 'professional' | 'mixed';
    businessType: 'foodtruck' | 'perfume' | 'construction' | 'unified';
    sampleRate: 16000;
    channels: 1;
    bitDepth: 16;
    maxResponseTime: 500;
    confidenceThreshold: 0.75;
    offlineCommands: string[];
    requiresInternet: boolean;
}
export interface DanishBusinessVocabulary {
    foodtruck: {
        menu: string[];
        locations: string[];
        payment: string[];
        ordering: string[];
    };
    perfume: {
        brands: string[];
        fragrances: string[];
        consultation: string[];
        inventory: string[];
    };
    construction: {
        projects: string[];
        materials: string[];
        scheduling: string[];
        progress: string[];
    };
}
export interface DanishRegionalAccent {
    region: string;
    phoneticPatterns: Array<{
        pattern: string;
        replacement: string;
        confidence: number;
    }>;
    commonPhrases: string[];
    businessTerms: Record<string, string>;
}
export declare const DANISH_BUSINESS_VOCABULARY: DanishBusinessVocabulary;
export declare const DANISH_REGIONAL_ACCENTS: DanishRegionalAccent[];
export declare const DANISH_VOICE_OPTIMIZATIONS: {
    quickResponses: {
        greetings: string[];
        confirmations: string[];
        acknowledgments: string[];
    };
    businessContext: {
        foodtruck: {
            defaultGreeting: string;
            orderConfirmation: string;
            locationUpdate: string;
        };
        perfume: {
            defaultGreeting: string;
            consultationStart: string;
            productInfo: string;
        };
        construction: {
            defaultGreeting: string;
            projectUpdate: string;
            scheduling: string;
        };
    };
    errorHandling: {
        misunderstood: string[];
        notFound: string[];
        offline: string[];
    };
};
export declare const getDanishLanguageConfig: (businessType: "foodtruck" | "perfume" | "construction" | "unified", dialect?: "copenhagen" | "jylland" | "fyn" | "bornholm", formality?: "casual" | "professional" | "mixed") => DanishLanguageModelConfig;
//# sourceMappingURL=danish-language-model.config.d.ts.map