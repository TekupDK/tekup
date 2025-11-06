-- Conversations table - Chat conversation threads
CREATE TABLE friday_ai.conversations (
    id int IDENTITY(1,1) PRIMARY KEY,
    userId int NOT NULL,
    title nvarchar(255),
    createdAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (userId) REFERENCES friday_ai.users(id)
);
GO

-- Add update trigger for updatedAt
CREATE TRIGGER tr_conversations_updated
ON friday_ai.conversations
AFTER UPDATE
AS
BEGIN
    UPDATE friday_ai.conversations 
    SET updatedAt = GETUTCDATE()
    FROM friday_ai.conversations c
    INNER JOIN inserted i ON c.id = i.id;
END;
GO