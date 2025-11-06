-- Leads table - Customer leads from various sources
CREATE TABLE friday_ai.leads (
    id int IDENTITY(1,1) PRIMARY KEY,
    userId int NOT NULL,
    source nvarchar(64) NOT NULL, -- e.g., "gmail", "rengoring.nu", "leadpoint"
    name nvarchar(255),
    email nvarchar(320),
    phone nvarchar(32),
    company nvarchar(255),
    score int NOT NULL DEFAULT 0, -- AI-calculated lead score (0-100)
    status nvarchar(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
    notes nvarchar(max),
    metadata nvarchar(max), -- JSON for source-specific data
    createdAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (userId) REFERENCES friday_ai.users(id)
);
GO

-- Add update trigger for updatedAt
CREATE TRIGGER tr_leads_updated
ON friday_ai.leads
AFTER UPDATE
AS
BEGIN
    UPDATE friday_ai.leads 
    SET updatedAt = GETUTCDATE()
    FROM friday_ai.leads l
    INNER JOIN inserted i ON l.id = i.id;
END;
GO