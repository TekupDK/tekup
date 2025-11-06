-- Users table - Core user authentication
CREATE TABLE users (
    id int IDENTITY(1,1) PRIMARY KEY,
    openId nvarchar(64) UNIQUE NOT NULL,
    name nvarchar(max),
    email nvarchar(320),
    loginMethod nvarchar(64),
    role nvarchar(10) NOT NULL DEFAULT 'user',
    createdAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    lastSignedIn datetime2 NOT NULL DEFAULT GETUTCDATE()
);