-- Proposal Engine Database Schema
-- Multi-tenant proposal generation and management

-- Proposals table
CREATE TABLE proposals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    transcript_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Proposal content and options
    options JSONB NOT NULL DEFAULT '{}',
    document_url TEXT,
    document_id TEXT,
    
    -- Metadata and tracking
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Multi-tenant isolation
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_proposals_tenant_id ON proposals(tenant_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_transcript_id ON proposals(transcript_id);
CREATE INDEX idx_proposals_created_at ON proposals(created_at);
CREATE INDEX idx_proposals_tenant_status ON proposals(tenant_id, status);

-- Buying signals table (for analysis and learning)
CREATE TABLE buying_signals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    proposal_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    
    -- Signal data
    signal_type TEXT NOT NULL CHECK (signal_type IN ('pain_point', 'budget_indicator', 'timeline_signal', 'decision_maker', 'competitor_mention')),
    content TEXT NOT NULL,
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    context TEXT,
    timestamp INTEGER, -- seconds into transcript
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for buying signals
CREATE INDEX idx_buying_signals_proposal_id ON buying_signals(proposal_id);
CREATE INDEX idx_buying_signals_tenant_id ON buying_signals(tenant_id);
CREATE INDEX idx_buying_signals_type ON buying_signals(signal_type);
CREATE INDEX idx_buying_signals_confidence ON buying_signals(confidence);

-- Research contexts table (Perplexity research results)
CREATE TABLE research_contexts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    proposal_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    
    -- Research data
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'Perplexity AI',
    url TEXT,
    relevance_score REAL NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for research contexts
CREATE INDEX idx_research_contexts_proposal_id ON research_contexts(proposal_id);
CREATE INDEX idx_research_contexts_tenant_id ON research_contexts(tenant_id);
CREATE INDEX idx_research_contexts_topic ON research_contexts(topic);
CREATE INDEX idx_research_contexts_relevance ON research_contexts(relevance_score);

-- Narrative sections table (generated proposal content)
CREATE TABLE narrative_sections (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    proposal_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    
    -- Section data
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    section_type TEXT NOT NULL CHECK (section_type IN ('introduction', 'problem_analysis', 'solution_overview', 'pricing', 'timeline', 'conclusion')),
    section_order INTEGER NOT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for narrative sections
CREATE INDEX idx_narrative_sections_proposal_id ON narrative_sections(proposal_id);
CREATE INDEX idx_narrative_sections_tenant_id ON narrative_sections(tenant_id);
CREATE INDEX idx_narrative_sections_type ON narrative_sections(section_type);
CREATE INDEX idx_narrative_sections_order ON narrative_sections(section_order);

-- Proposal templates table (reusable templates)
CREATE TABLE proposal_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    
    -- Template data
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL DEFAULT 'standard' CHECK (template_type IN ('standard', 'technical', 'consulting', 'custom')),
    
    -- Template configuration
    sections JSONB NOT NULL DEFAULT '[]',
    styling JSONB DEFAULT '{}',
    options JSONB DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for proposal templates
CREATE INDEX idx_proposal_templates_tenant_id ON proposal_templates(tenant_id);
CREATE INDEX idx_proposal_templates_type ON proposal_templates(template_type);
CREATE INDEX idx_proposal_templates_active ON proposal_templates(is_active);

-- Agent execution logs table (MCP agent tracking)
CREATE TABLE agent_execution_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    proposal_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    
    -- Execution data
    agent_name TEXT NOT NULL,
    step_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
    
    -- Timing
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_ms INTEGER,
    
    -- Results and errors
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Foreign keys
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for agent execution logs
CREATE INDEX idx_agent_logs_proposal_id ON agent_execution_logs(proposal_id);
CREATE INDEX idx_agent_logs_tenant_id ON agent_execution_logs(tenant_id);
CREATE INDEX idx_agent_logs_agent_name ON agent_execution_logs(agent_name);
CREATE INDEX idx_agent_logs_status ON agent_execution_logs(status);
CREATE INDEX idx_agent_logs_started_at ON agent_execution_logs(started_at);

-- Proposal analytics table (for metrics and insights)
CREATE TABLE proposal_analytics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    proposal_id TEXT NOT NULL,
    
    -- Analytics data
    generation_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_type TEXT,
    
    -- Content metrics
    word_count INTEGER,
    section_count INTEGER,
    buying_signal_count INTEGER,
    research_context_count INTEGER,
    
    -- Performance metrics
    transcript_processing_time_ms INTEGER,
    research_time_ms INTEGER,
    narrative_generation_time_ms INTEGER,
    document_assembly_time_ms INTEGER,
    
    -- Quality metrics
    content_quality_score REAL CHECK (content_quality_score >= 0 AND content_quality_score <= 1),
    relevance_score REAL CHECK (relevance_score >= 0 AND relevance_score <= 1),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for proposal analytics
CREATE INDEX idx_proposal_analytics_tenant_id ON proposal_analytics(tenant_id);
CREATE INDEX idx_proposal_analytics_proposal_id ON proposal_analytics(proposal_id);
CREATE INDEX idx_proposal_analytics_success ON proposal_analytics(success);
CREATE INDEX idx_proposal_analytics_created_at ON proposal_analytics(created_at);

-- Create views for common queries

-- Proposal summary view
CREATE VIEW proposal_summary AS
SELECT 
    p.id,
    p.tenant_id,
    p.transcript_id,
    p.status,
    p.document_url,
    p.created_at,
    p.updated_at,
    p.options->>'clientName' as client_name,
    p.options->>'projectType' as project_type,
    p.options->>'estimatedValue' as estimated_value,
    p.metadata->>'buyingSignals'->>'summary'->>'overallUrgency' as urgency,
    COUNT(bs.id) as buying_signal_count,
    COUNT(rc.id) as research_context_count,
    COUNT(ns.id) as section_count
FROM proposals p
LEFT JOIN buying_signals bs ON p.id = bs.proposal_id
LEFT JOIN research_contexts rc ON p.id = rc.proposal_id
LEFT JOIN narrative_sections ns ON p.id = ns.proposal_id
GROUP BY p.id, p.tenant_id, p.transcript_id, p.status, p.document_url, p.created_at, p.updated_at, p.options, p.metadata;

-- Tenant proposal statistics view
CREATE VIEW tenant_proposal_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_proposals,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_proposals,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_proposals,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_proposals,
    ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate,
    AVG(CASE WHEN status = 'completed' THEN 
        (julianday(updated_at) - julianday(created_at)) * 24 * 60 * 60 * 1000 
    END) as avg_processing_time_ms
FROM proposals
GROUP BY tenant_id;

-- Recent activity view
CREATE VIEW recent_proposal_activity AS
SELECT 
    p.id,
    p.tenant_id,
    p.status,
    p.created_at,
    p.options->>'clientName' as client_name,
    p.options->>'projectType' as project_type,
    ael.agent_name,
    ael.step_name,
    ael.status as step_status,
    ael.completed_at
FROM proposals p
LEFT JOIN agent_execution_logs ael ON p.id = ael.proposal_id
WHERE p.created_at >= datetime('now', '-7 days')
ORDER BY p.created_at DESC, ael.started_at DESC;

-- Triggers for updated_at timestamps

-- Proposals table trigger
CREATE TRIGGER proposals_updated_at
    AFTER UPDATE ON proposals
    FOR EACH ROW
    BEGIN
        UPDATE proposals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Proposal templates table trigger
CREATE TRIGGER proposal_templates_updated_at
    AFTER UPDATE ON proposal_templates
    FOR EACH ROW
    BEGIN
        UPDATE proposal_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Agent execution logs completion trigger
CREATE TRIGGER agent_execution_logs_completion
    AFTER UPDATE OF status ON agent_execution_logs
    FOR EACH ROW
    WHEN NEW.status IN ('completed', 'failed') AND OLD.status = 'started'
    BEGIN
        UPDATE agent_execution_logs 
        SET completed_at = CURRENT_TIMESTAMP,
            duration_ms = (julianday(CURRENT_TIMESTAMP) - julianday(started_at)) * 24 * 60 * 60 * 1000
        WHERE id = NEW.id;
    END;