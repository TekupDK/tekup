"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFunctions = exports.getFunctionsByTenant = exports.getFunctionById = exports.TEKUP_FUNCTIONS = void 0;
exports.TEKUP_FUNCTIONS = [
    {
        id: 'get_leads',
        name: 'get_leads',
        description: 'Hent leads fra CRM systemet for den aktuelle tenant',
        parameters: {
            status: {
                type: 'string',
                enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
                description: 'Status på leads der skal hentes'
            },
            limit: {
                type: 'number',
                description: 'Maksimalt antal leads (standard: 50)'
            },
            source: {
                type: 'string',
                description: 'Kilde på leads (f.eks. website, phone, email)'
            }
        },
        tenant_required: true,
        tenant_isolation: true
    },
    {
        id: 'create_lead',
        name: 'create_lead',
        description: 'Opret en ny lead i CRM systemet for den aktuelle tenant',
        parameters: {
            name: {
                type: 'string',
                description: 'Fuldt navn på lead'
            },
            email: {
                type: 'string',
                description: 'Email adresse'
            },
            company: {
                type: 'string',
                description: 'Firmanavn'
            },
            phone: {
                type: 'string',
                description: 'Telefonnummer'
            },
            source: {
                type: 'string',
                description: 'Hvor lead kommer fra'
            },
            notes: {
                type: 'string',
                description: 'Ekstra noter om lead'
            }
        },
        tenant_required: true,
        tenant_isolation: true
    },
    {
        id: 'start_backup',
        name: 'start_backup',
        description: 'Start backup proces for specifik tenant eller system',
        parameters: {
            tenant_id: {
                type: 'string',
                description: 'Tenant ID (valgfrit hvis kun en tenant)'
            },
            backup_type: {
                type: 'string',
                enum: ['full', 'incremental', 'compliance', 'database'],
                description: 'Type af backup der skal startes'
            },
            priority: {
                type: 'string',
                enum: ['low', 'normal', 'high', 'critical'],
                description: 'Prioritet på backup job'
            }
        },
        tenant_required: true,
        tenant_isolation: true
    },
    {
        id: 'compliance_check',
        name: 'compliance_check',
        description: 'Kør compliance check for tenant eller specifik compliance type',
        parameters: {
            tenant_id: {
                type: 'string',
                description: 'Tenant ID (valgfrit hvis kun en tenant)'
            },
            check_type: {
                type: 'string',
                enum: ['nis2', 'gdpr', 'security', 'backup', 'full'],
                description: 'Type af compliance check der skal køres'
            },
            severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'Minimum severity niveau der skal rapporteres'
            }
        },
        tenant_required: true,
        tenant_isolation: true
    },
    {
        id: 'search_leads',
        name: 'search_leads',
        description: 'Søg efter leads baseret på forskellige kriterier',
        parameters: {
            query: {
                type: 'string',
                description: 'Søgetekst (navn, email, firma, etc.)'
            },
            status: {
                type: 'string',
                enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
                description: 'Filtrer på status'
            },
            date_range: {
                type: 'string',
                enum: ['today', 'week', 'month', 'quarter', 'year'],
                description: 'Tidsperiode for leads'
            }
        },
        tenant_required: true,
        tenant_isolation: true
    },
    {
        id: 'get_metrics',
        name: 'get_metrics',
        description: 'Hent metrics og statistikker for leads og compliance',
        parameters: {
            metric_type: {
                type: 'string',
                enum: ['leads', 'compliance', 'backup', 'performance', 'all'],
                description: 'Type af metrics der skal hentes'
            },
            period: {
                type: 'string',
                enum: ['day', 'week', 'month', 'quarter', 'year'],
                description: 'Tidsperiode for metrics'
            },
            tenant_id: {
                type: 'string',
                description: 'Tenant ID (valgfrit hvis kun en tenant)'
            }
        },
        tenant_required: true,
        tenant_isolation: true
    },
    {
        id: 'switch_tenant',
        name: 'switch_tenant',
        description: 'Skift til en anden tenant (kun hvis brugeren har adgang)',
        parameters: {
            tenant_name: {
                type: 'string',
                enum: ['rendetalje', 'foodtruck', 'tekup'],
                description: 'Navn på tenant der skal skiftes til'
            }
        },
        tenant_required: false,
        tenant_isolation: false
    },
    {
        id: 'get_tenant_info',
        name: 'get_tenant_info',
        description: 'Hent information om den aktuelle tenant',
        parameters: {
            include_settings: {
                type: 'boolean',
                description: 'Inkluder tenant settings og branding'
            },
            include_stats: {
                type: 'boolean',
                description: 'Inkluder tenant statistikker'
            }
        },
        tenant_required: true,
        tenant_isolation: true
    }
];
const getFunctionById = (id) => {
    return exports.TEKUP_FUNCTIONS.find(func => func.id === id);
};
exports.getFunctionById = getFunctionById;
const getFunctionsByTenant = (tenant) => {
    return exports.TEKUP_FUNCTIONS.filter(func => func.tenant_required);
};
exports.getFunctionsByTenant = getFunctionsByTenant;
const getAllFunctions = () => {
    return exports.TEKUP_FUNCTIONS;
};
exports.getAllFunctions = getAllFunctions;
//# sourceMappingURL=tekup-functions.js.map