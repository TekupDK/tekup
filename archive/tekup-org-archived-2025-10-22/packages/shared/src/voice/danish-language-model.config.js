export const DANISH_BUSINESS_VOCABULARY = {
    foodtruck: {
        menu: [
            'burger', 'pommes', 'hotdog', 'sandwich', 'salat', 'vegetarisk', 'vegan',
            'glutenfri', 'laktosefri', 'drikke', 'kaffe', 'te', 'saft', 'vand',
            'øl', 'vin', 'cocktail', 'dessert', 'kage', 'is'
        ],
        locations: [
            'københavn', 'århus', 'odense', 'aalborg', 'esbjerg', 'roskilde',
            'kolding', 'herning', 'silkeborg', 'randers', 'vejle', 'horsens'
        ],
        payment: [
            'mobilepay', 'dankort', 'visa', 'mastercard', 'kontant', 'kort',
            'faktura', 'regning', 'kvittering'
        ],
        ordering: [
            'bestille', 'bestilling', 'takeaway', 'afhentning', 'levering',
            'catering', 'event', 'fest', 'firma', 'privat'
        ]
    },
    perfume: {
        brands: [
            'chanel', 'dior', 'gucci', 'prada', 'versace', 'hermes', 'ysl',
            'lancome', 'estee lauder', 'clinique', 'mac', 'nars'
        ],
        fragrances: [
            'sommerparfume', 'vinterparfume', 'dagparfume', 'aftenparfume',
            'let parfume', 'kraftig parfume', 'orientalsk', 'blomstret',
            'frisk', 'varm', 'kølig', 'sensuel'
        ],
        consultation: [
            'rådgivning', 'konsultation', 'prøve', 'test', 'anbefaling',
            'personlig stil', 'occasion', 'budget', 'holdbarhed'
        ],
        inventory: [
            'på lager', 'udsolgt', 'bestille', 'leveringstid', 'reservering',
            'venteliste', 'nyhed', 'limited edition', 'exclusive'
        ]
    },
    construction: {
        projects: [
            'badeværelse', 'køkken', 'stue', 'soveværelse', 'terrasse',
            'have', 'garage', 'kælder', 'loft', 'tag', 'facade'
        ],
        materials: [
            'træ', 'sten', 'beton', 'metal', 'glas', 'keramik',
            'maling', 'tapet', 'gulv', 'væg', 'isolering'
        ],
        scheduling: [
            'planlægning', 'tidsplan', 'deadline', 'startdato', 'slutdato',
            'håndværker', 'arbejdsdag', 'weekend', 'ferie', 'forsinkelse'
        ],
        progress: [
            'status', 'fremgang', 'procent', 'færdig', 'igang', 'venter',
            'godkendt', 'ændring', 'problem', 'løsning'
        ]
    }
};
export const DANISH_REGIONAL_ACCENTS = [
    {
        region: 'copenhagen',
        phoneticPatterns: [
            { pattern: 'stød', replacement: 'glottal_stop', confidence: 0.9 },
            { pattern: 'æ', replacement: 'open_front_unrounded', confidence: 0.8 },
            { pattern: 'ø', replacement: 'close_mid_front_rounded', confidence: 0.8 }
        ],
        commonPhrases: [
            'hej med dig', 'hvad så', 'det er fedt', 'super nice',
            'klart', 'præcis', 'helt sikkert', 'ingen problem'
        ],
        businessTerms: {
            'leads': 'kundeemner',
            'prospects': 'potentielle kunder',
            'sales': 'salg',
            'marketing': 'markedsføring'
        }
    },
    {
        region: 'jylland',
        phoneticPatterns: [
            { pattern: 'stød', replacement: 'none', confidence: 0.9 },
            { pattern: 'æ', replacement: 'open_front_unrounded', confidence: 0.7 },
            { pattern: 'ø', replacement: 'close_mid_front_rounded', confidence: 0.7 }
        ],
        commonPhrases: [
            'hej du', 'hvad sker der', 'det er godt', 'super fint',
            'ja da', 'præcis', 'helt bestemt', 'ingen problemer'
        ],
        businessTerms: {
            'leads': 'kundeemner',
            'prospects': 'potentielle kunder',
            'sales': 'salg',
            'marketing': 'markedsføring'
        }
    }
];
export const DANISH_VOICE_OPTIMIZATIONS = {
    // Response time optimizations
    quickResponses: {
        greetings: ['hej', 'godmorgen', 'godaften', 'godnat'],
        confirmations: ['ja', 'nej', 'okay', 'fint', 'godt'],
        acknowledgments: ['forstået', 'klart', 'præcis', 'helt sikkert']
    },
    // Context-aware responses
    businessContext: {
        foodtruck: {
            defaultGreeting: 'Velkommen til Foodtruck Fiesta! Hvad kan jeg hjælpe dig med i dag?',
            orderConfirmation: 'Perfekt! Din bestilling er registreret.',
            locationUpdate: 'Vi står i dag på {location}. Kom forbi!'
        },
        perfume: {
            defaultGreeting: 'Velkommen til Essenza Perfume! Lad mig hjælpe dig med at finde din perfekte duft.',
            consultationStart: 'Lad mig stille dig nogle spørgsmål for at anbefale den rigtige parfume.',
            productInfo: 'Her er information om {product}. Vil du have flere detaljer?'
        },
        construction: {
            defaultGreeting: 'Velkommen til Rendetalje! Hvordan kan jeg hjælpe dig med dit byggeprojekt?',
            projectUpdate: 'Her er den seneste status på dit {project_type} projekt.',
            scheduling: 'Lad mig tjekke vores kalender for ledige tider.'
        }
    },
    // Error handling and fallbacks
    errorHandling: {
        misunderstood: [
            'Undskyld, jeg forstod ikke helt. Kan du sige det igen?',
            'Kunne du gentage det? Jeg vil gerne sikre mig at jeg forstår dig korrekt.',
            'Jeg hørte ikke helt tydeligt. Kan du sige det en gang til?'
        ],
        notFound: [
            'Jeg kunne ikke finde det du leder efter. Kan du være mere specifik?',
            'Det ser ikke ud til at være tilgængeligt lige nu. Skal jeg hjælpe dig med noget andet?',
            'Jeg fandt ikke præcis det du spurgte om. Kan du prøve at omformulere?'
        ],
        offline: [
            'Jeg er offline lige nu, men kan stadig hjælpe dig med grundlæggende funktioner.',
            'Internetforbindelsen er nede. Jeg kan kun give dig begrænset hjælp.',
            'Jeg arbejder offline. Nogle funktioner er ikke tilgængelige lige nu.'
        ]
    }
};
export const getDanishLanguageConfig = (businessType, dialect = 'copenhagen', formality = 'mixed') => {
    return {
        language: 'da-DK',
        primaryDialect: dialect,
        formalityLevel: formality,
        businessType,
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16,
        maxResponseTime: 500,
        confidenceThreshold: 0.75,
        offlineCommands: getOfflineCommands(businessType),
        requiresInternet: businessType === 'unified'
    };
};
const getOfflineCommands = (businessType) => {
    const baseCommands = ['help', 'stop', 'pause', 'resume'];
    switch (businessType) {
        case 'foodtruck':
            return [...baseCommands, 'menu', 'location', 'hours', 'contact'];
        case 'perfume':
            return [...baseCommands, 'brands', 'fragrances', 'store_info'];
        case 'construction':
            return [...baseCommands, 'project_status', 'contact', 'hours'];
        default:
            return baseCommands;
    }
};
//# sourceMappingURL=danish-language-model.config.js.map