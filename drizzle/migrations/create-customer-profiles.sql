-- Create customer_profiles table
CREATE TABLE IF NOT EXISTS friday_ai.customer_profiles (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "leadId" INTEGER,
  "billyCustomerId" VARCHAR(255),
  "billyOrganizationId" VARCHAR(255),
  email VARCHAR(320) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(32),
  "totalInvoiced" INTEGER DEFAULT 0 NOT NULL,
  "totalPaid" INTEGER DEFAULT 0 NOT NULL,
  balance INTEGER DEFAULT 0 NOT NULL,
  "invoiceCount" INTEGER DEFAULT 0 NOT NULL,
  "emailCount" INTEGER DEFAULT 0 NOT NULL,
  "aiResume" TEXT,
  "lastContactDate" TIMESTAMP,
  "lastSyncDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON friday_ai.customer_profiles(email);

-- Create index on leadId for joins
CREATE INDEX IF NOT EXISTS idx_customer_profiles_lead_id ON friday_ai.customer_profiles("leadId");

-- Create index on userId for filtering
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON friday_ai.customer_profiles("userId");

-- Create customer_emails table
CREATE TABLE IF NOT EXISTS friday_ai.customer_emails (
  id SERIAL PRIMARY KEY,
  "customerId" INTEGER NOT NULL,
  "gmailThreadId" VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  snippet TEXT,
  "lastMessageDate" TIMESTAMP,
  "isRead" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index on customerId
CREATE INDEX IF NOT EXISTS idx_customer_emails_customer_id ON friday_ai.customer_emails("customerId");

-- Create index on gmailThreadId
CREATE INDEX IF NOT EXISTS idx_customer_emails_thread_id ON friday_ai.customer_emails("gmailThreadId");

-- Create customer_conversations table
CREATE TABLE IF NOT EXISTS friday_ai.customer_conversations (
  id SERIAL PRIMARY KEY,
  "customerId" INTEGER NOT NULL,
  "conversationId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create unique index on customerId (one conversation per customer)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_conversations_customer ON friday_ai.customer_conversations("customerId");
