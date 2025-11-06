-- Messages table - Individual chat messages
CREATE TABLE friday_ai.messages (
    id int IDENTITY(1,1) PRIMARY KEY,
    conversationId int NOT NULL,
    role nvarchar(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content nvarchar(max) NOT NULL,
    model nvarchar(64), -- e.g., "gpt-4o", "claude-3.5", "gemini-2.0"
    attachments nvarchar(max), -- JSON array of attachments
    metadata nvarchar(max), -- JSON metadata
    createdAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (conversationId) REFERENCES friday_ai.conversations(id)
);
GO