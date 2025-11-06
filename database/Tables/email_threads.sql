-- Email threads table - Gmail thread information
CREATE TABLE friday_ai.email_threads (
    id int IDENTITY(1,1) PRIMARY KEY,
    userId int NOT NULL,
    gmailThreadId nvarchar(255) NOT NULL,
    subject nvarchar(max),
    participants nvarchar(max), -- JSON array of participants
    snippet nvarchar(max),
    labels nvarchar(max), -- JSON array of labels
    lastMessageAt datetime2,
    isRead bit NOT NULL DEFAULT 0,
    createdAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (userId) REFERENCES friday_ai.users(id)
);
GO

-- Add update trigger for updatedAt
CREATE TRIGGER tr_email_threads_updated
ON friday_ai.email_threads
AFTER UPDATE
AS
BEGIN
    UPDATE friday_ai.email_threads 
    SET updatedAt = GETUTCDATE()
    FROM friday_ai.email_threads et
    INNER JOIN inserted i ON et.id = i.id;
END;
GO