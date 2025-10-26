# Customer Database Integration\n\n\n\nOmfattende kunde-database med PostgreSQL + Prisma for persistent lagring af kunde-data, samtale-historik og lead-tracking.\n\n\n\n## 📋 Indholdsfortegnelse\n\n\n\n- [Oversigt](#oversigt)\n\n- [Database Schema](#database-schema)\n\n- [API Reference](#api-reference)\n\n- [CLI Kommandoer](#cli-kommandoer)\n\n- [Integration](#integration)\n\n- [Workflows](#workflows)\n\n- [Best Practices](#best-practices)\n\n\n\n## 🎯 Oversigt\n\n\n\nCustomer Database systemet giver komplet CRM-funktionalitet:
\n\n- 👥 **Customer Management**: Opret, opdater, søg og track kunder\n\n- 💬 **Conversation Tracking**: Spor alle email-samtaler med kunder\n\n- 📧 **Email History**: Gem alle emails med metadata og AI-generering info\n\n- 🔗 **Lead Linking**: Automatisk link mellem leads og kunder\n\n- 📊 **Analytics**: Kunde-statistik (leads, bookings, revenue)\n\n- 🏷️ **Tagging System**: Kategoriser kunder med tags\n\n\n\n## 🗄️ Database Schema\n\n\n\n### Customer Model\n\n\n\n```prisma\n\nmodel Customer {
  id          String   @id @default(cuid())
  name        String
  email       String?  @unique
  phone       String?
  address     String?
  companyName String?
  notes       String?
  status      String   @default("active") // active, inactive, blocked
  tags        String[] // Array of tags
  
  // Metadata
  totalLeads     Int      @default(0)
  totalBookings  Int      @default(0)
  totalRevenue   Float    @default(0)
  lastContactAt  DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  leads         Lead[]
  conversations Conversation[]
}\n\n```
\n\n### Conversation Model\n\n\n\n```prisma\n\nmodel Conversation {
  id          String   @id @default(cuid())
  customerId  String?
  leadId      String?
  subject     String?
  channel     String   @default("email") // email, chat, phone, sms
  status      String   @default("active") // active, closed, archived
  
  // Gmail integration
  gmailThreadId String? @unique
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  closedAt    DateTime?

  // Relations
  customer Customer? @relation(fields: [customerId], references: [id])
  lead     Lead?     @relation(fields: [leadId], references: [id])
  messages EmailMessage[]
}\n\n```
\n\n### EmailMessage Model\n\n\n\n```prisma\n\nmodel EmailMessage {
  id             String   @id @default(cuid())
  conversationId String
  
  // Gmail integration
  gmailMessageId String?  @unique
  gmailThreadId  String?
  
  // Email details
  from           String
  to             String
  subject        String?
  body           String
  bodyPreview    String?
  
  // Metadata
  direction      String   // inbound, outbound
  status         String   @default("sent") // draft, sent, failed, bounced
  isAiGenerated  Boolean  @default(false)
  aiModel        String?  // gemini-1.5-pro, etc.
  
  sentAt         DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  conversation Conversation @relation(fields: [conversationId], references: [id])
}\n\n```
\n\n### Extended Lead Model\n\n\n\n```prisma\n\nmodel Lead {
  // ... existing fields ...
  customerId    String?  // NEW: Link to Customer
  emailThreadId String?  // NEW: Gmail thread ID
  
  // Relations
  customer      Customer? @relation(fields: [customerId], references: [id])
  conversations Conversation[]
}\n\n```
\n\n## 📚 API Reference\n\n\n\n### customerService\n\n\n\n#### Customer Operations\n\n\n\n##### `createCustomer(input: CreateCustomerInput): Promise<Customer>`\n\n\n\nOpret ny kunde.

**Parameters:**
\n\n```typescript
{
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    notes?: string;
    tags?: string[];
}\n\n```

**Example:**
\n\n```typescript
const customer = await createCustomer({
    name: "John Doe",
    email: "john@example.com",
    phone: "+45 12345678",
    tags: ["vip", "enterprise"]
});\n\n```
\n\n##### `getCustomerById(customerId: string, includeRelations?: boolean): Promise<Customer | null>`\n\n\n\nHent kunde via ID.

**Parameters:**
\n\n- `customerId` - Customer ID\n\n- `includeRelations` - Inkluder leads og conversations (default: false)\n\n\n\n##### `getCustomerByEmail(email: string): Promise<Customer | null>`\n\n\n\nHent kunde via email.
\n\n##### `updateCustomer(customerId: string, input: UpdateCustomerInput): Promise<Customer>`\n\n\n\nOpdater kunde.

**Example:**
\n\n```typescript
await updateCustomer(customerId, {
    phone: "+45 87654321",
    tags: ["premium"],
    status: "active"
});\n\n```
\n\n##### `updateCustomerStats(customerId: string): Promise<void>`\n\n\n\nOpdater kunde-statistik (leads, bookings, revenue).

Kaldes automatisk når:
\n\n- Lead linkes til kunde\n\n- Booking oprettes\n\n- Quote accepteres\n\n\n\n##### `queryCustomers(filters?: CustomerFilters): Promise<Customer[]>`\n\n\n\nSøg kunder med filters.

**Filters:**
\n\n```typescript
{
    status?: string;      // "active", "inactive", "blocked"
    tags?: string[];      // Match customers with these tags
    email?: string;       // Exact email match
}\n\n```

**Example:**
\n\n```typescript
// Get all VIP customers
const vipCustomers = await queryCustomers({ tags: ["vip"] });

// Get inactive customers
const inactive = await queryCustomers({ status: "inactive" });\n\n```
\n\n##### `deleteCustomer(customerId: string): Promise<boolean>`\n\n\n\nSlet kunde (soft delete - sætter status til "inactive").\n\n\n\n##### `findOrCreateCustomer(email: string, name?: string): Promise<Customer>`\n\n\n\nFind eller opret kunde baseret på email. Nyttig til auto-oprettelse fra indkommende emails.

**Example:**
\n\n```typescript
// Auto-create customer from incoming email
const customer = await findOrCreateCustomer(
    "customer@example.com",
    "Customer Name"
);\n\n```
\n\n##### `linkLeadToCustomer(leadId: string, customerId: string): Promise<void>`\n\n\n\nLink et lead til en kunde og opdater statistik.
\n\n#### Conversation Operations\n\n\n\n##### `createConversation(input: CreateConversationInput): Promise<Conversation>`\n\n\n\nOpret ny samtale.

**Parameters:**
\n\n```typescript
{
    customerId?: string;
    leadId?: string;
    subject?: string;
    channel?: string;      // "email", "chat", "phone", "sms"
    gmailThreadId?: string;
}\n\n```
\n\n##### `getConversationByGmailThreadId(gmailThreadId: string): Promise<Conversation | null>`\n\n\n\nHent samtale via Gmail thread ID.
\n\n##### `getCustomerConversations(customerId: string): Promise<Conversation[]>`\n\n\n\nHent alle samtaler for en kunde.
\n\n##### `closeConversation(conversationId: string): Promise<Conversation>`\n\n\n\nLuk en samtale.
\n\n#### Email Message Operations\n\n\n\n##### `createEmailMessage(input: CreateEmailMessageInput): Promise<EmailMessage>`\n\n\n\nGem en email message.

**Parameters:**
\n\n```typescript
{
    conversationId: string;
    gmailMessageId?: string;
    gmailThreadId?: string;
    from: string;
    to: string;
    subject?: string;
    body: string;
    bodyPreview?: string;
    direction: "inbound" | "outbound";
    isAiGenerated?: boolean;
    aiModel?: string;
}\n\n```

**Example:**
\n\n```typescript
await createEmailMessage({
    conversationId: conv.id,
    gmailMessageId: "msg123",
    from: "info@rendetalje.dk",
    to: "customer@example.com",
    subject: "Tilbud på rengøring",
    body: emailBody,
    direction: "outbound",
    isAiGenerated: true,
    aiModel: "gemini-1.5-pro"
});\n\n```
\n\n##### `getEmailMessageByGmailId(gmailMessageId: string): Promise<EmailMessage | null>`\n\n\n\nHent email via Gmail message ID.
\n\n##### `getConversationMessages(conversationId: string): Promise<EmailMessage[]>`\n\n\n\nHent alle messages i en samtale.
\n\n## 🛠️ CLI Kommandoer\n\n\n\n### Customer Management\n\n\n\n#### Create Customer\n\n\n\n```bash\n\nnpm run customer:create "John Doe" "john@example.com" "+45 12345678"\n\n```

Output:
\n\n```
✅ Customer created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:      cm1abc123def
Name:    John Doe
Email:   john@example.com
Phone:   +45 12345678
Status:  active
Created: 30.09.2025 16:30:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n```
\n\n#### List Customers\n\n\n\n```bash\n\nnpm run customer:list [status]\n\n```

Default status: "active"

Output:
\n\n```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name                      Email                          Leads    Bookings   Revenue   
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
John Doe                  john@example.com               3        2          5000 kr   
Jane Smith                jane@company.com               1        1          2500 kr   
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 2 customers\n\n```
\n\n#### Get Customer\n\n\n\n```bash\n\nnpm run customer:get "john@example.com"\n\n```
\n\n#### Update Stats\n\n\n\n```bash\n\nnpm run customer:stats <customerId>\n\n```
\n\n#### List Conversations\n\n\n\n```bash\n\nnpm run customer:conversations <customerId>\n\n```
\n\n#### Link Lead to Customer\n\n\n\n```bash\n\nnpm run customer:link-lead <leadId> <customerId>\n\n```
\n\n## 🔗 Integration\n\n\n\n### Auto-Link Leads to Customers\n\n\n\nNår et lead modtages via email:
\n\n```typescript
import { findOrCreateCustomer, linkLeadToCustomer } from './services/customerService';

// Parse lead from email
const lead = await parseLeadFromEmail(email);

// Find or create customer
const customer = await findOrCreateCustomer(
    lead.email,
    lead.name
);

// Link lead to customer
await linkLeadToCustomer(lead.id, customer.id);\n\n```
\n\n### Track Email Conversations\n\n\n\nNår en email sendes eller modtages:
\n\n```typescript
import {
    createConversation,
    getConversationByGmailThreadId,
    createEmailMessage
} from './services/customerService';

// Find or create conversation
let conversation = await getConversationByGmailThreadId(threadId);

if (!conversation) {
    conversation = await createConversation({
        customerId: customer.id,
        leadId: lead.id,
        subject: emailSubject,
        gmailThreadId: threadId
    });
}

// Save email message
await createEmailMessage({
    conversationId: conversation.id,
    gmailMessageId: messageId,
    gmailThreadId: threadId,
    from: "info@rendetalje.dk",
    to: customer.email,
    subject: emailSubject,
    body: emailBody,
    direction: "outbound",
    isAiGenerated: true,
    aiModel: "gemini-1.5-pro"
});\n\n```
\n\n### Update Customer Stats\n\n\n\nStats opdateres automatisk, men kan også manuelt triggers:
\n\n```typescript
import { updateCustomerStats } from './services/customerService';

// After quote accepted or booking completed
await updateCustomerStats(customerId);\n\n```
\n\n## 🔄 Workflows\n\n\n\n### New Lead → Customer Flow\n\n\n\n```\n\n1. Email arrives with lead
   ↓\n\n2. Parse lead information
   ↓\n\n3. findOrCreateCustomer(email, name)
   ↓\n\n4. createConversation(customerId, leadId, gmailThreadId)
   ↓\n\n5. linkLeadToCustomer(leadId, customerId)
   ↓\n\n6. updateCustomerStats(customerId)\n\n```
\n\n### Email Response Flow\n\n\n\n```\n\n1. Generate AI response
   ↓\n\n2. getConversationByGmailThreadId(threadId)
   ↓\n\n3. createEmailMessage(conversationId, ...)
   ↓\n\n4. Send email via Gmail
   ↓\n\n5. Update customer.lastContactAt\n\n```
\n\n### Quote → Booking → Revenue Flow\n\n\n\n```\n\n1. Quote created and sent
   ↓\n\n2. Quote accepted
   ↓\n\n3. updateCustomerStats(customerId)
   ↓ (totalRevenue += quote.total)\n\n4. Booking created
   ↓\n\n5. updateCustomerStats(customerId)
   ↓ (totalBookings++)\n\n6. Customer stats reflect new business\n\n```
\n\n## 📋 Best Practices\n\n\n\n### 1. Always Use findOrCreateCustomer\n\n\n\nUndgå duplicates ved at bruge `findOrCreateCustomer`:
\n\n```typescript
// ✅ Godt
const customer = await findOrCreateCustomer(email, name);

// ❌ Dårligt - kan skabe duplicates\n\nconst customer = await createCustomer({ name, email });\n\n```
\n\n### 2. Link Leads Immediately\n\n\n\nLink leads til customers så hurtigt som muligt:
\n\n```typescript
// ✅ Godt - link med det samme\n\nconst customer = await findOrCreateCustomer(lead.email, lead.name);
await linkLeadToCustomer(lead.id, customer.id);

// ❌ Dårligt - glemmer at linke\n\nconst customer = await findOrCreateCustomer(lead.email, lead.name);
// Lead er ikke linket til customer!\n\n```
\n\n### 3. Track All Emails\n\n\n\nGem alle emails i databasen for komplet historik:
\n\n```typescript
// ✅ Godt - gem både inbound og outbound\n\nawait createEmailMessage({
    conversationId: conv.id,
    direction: "inbound", // eller "outbound"
    // ... rest of fields
});

// ❌ Dårligt - gemmer ikke emails\n\n// Ingen historik!\n\n```
\n\n### 4. Use Tags for Segmentation\n\n\n\nBrug tags til at kategorisere kunder:
\n\n```typescript
await updateCustomer(customerId, {
    tags: ["vip", "enterprise", "recurring"]
});

// Query by tags
const vips = await queryCustomers({ tags: ["vip"] });\n\n```
\n\n### 5. Keep Stats Updated\n\n\n\nSelvom stats opdateres automatisk, kan manuel opdatering være nødvendig:
\n\n```typescript
// Efter bulk-operationer
for (const customerId of customerIds) {
    await updateCustomerStats(customerId);
}\n\n```
\n\n## 🗃️ Database Migrations\n\n\n\n### Initial Setup\n\n\n\n```bash\n\n# Generate Prisma client\n\nnpm run db:generate\n\n\n\n# Create migration (if DATABASE_URL is set)\n\nnpm run db:migrate\n\n\n\n# Or push schema without migration\n\nnpm run db:push\n\n```\n\n\n\n### Schema Changes\n\n\n\nEfter ændringer i `schema.prisma`:
\n\n```bash\n\n# Regenerate client\n\nnpm run db:generate\n\n\n\n# Create migration\n\nnpm run db:migrate\n\n```\n\n\n\n## 📊 Analytics Queries\n\n\n\n### Customer Lifetime Value\n\n\n\n```typescript\n\nconst customers = await queryCustomers({ status: "active" });

const topCustomers = customers
    .sort((a, b) => b.totalRevenue - a.totalRevenue)\n\n    .slice(0, 10);

console.log("Top 10 customers by revenue:");
for (const customer of topCustomers) {
    console.log(`${customer.name}: ${customer.totalRevenue} kr`);
}\n\n```
\n\n### Conversation Response Rate\n\n\n\n```typescript\n\nconst conversations = await getCustomerConversations(customerId);

for (const conv of conversations) {
    const messages = await getConversationMessages(conv.id);
    const outbound = messages.filter(m => m.direction === "outbound");
    const inbound = messages.filter(m => m.direction === "inbound");
    
    console.log(`Response ratio: ${outbound.length}/${inbound.length}`);
}\n\n```
\n\n### AI-Generated Email Stats\n\n\n\n```typescript\n\nconst messages = await prisma.emailMessage.findMany({
    where: { isAiGenerated: true },
});

const byModel = messages.reduce((acc, msg) => {
    acc[msg.aiModel || "unknown"] = (acc[msg.aiModel || "unknown"] || 0) + 1;\n\n    return acc;
}, {} as Record<string, number>);

console.log("AI-generated emails by model:", byModel);\n\n```
\n\n## 🚀 Future Enhancements\n\n\n\n- **Email Templates**: Track hvilke templates der bruges mest\n\n- **Sentiment Analysis**: Analysér kunde-følelser i emails\n\n- **Lead Scoring**: Auto-score leads baseret på kunde-historik\n\n- **Bulk Operations**: Bulk update af customer tags/status\n\n- **Export/Import**: CSV export/import af customers\n\n- **Advanced Search**: Fuld-tekst søgning i conversations\n\n- **Webhooks**: Real-time notifikationer ved ændringer\n\n\n\n## 📝 Changelog\n\n\n\n### v1.0.0 (2025-09-30)\n\n\n\n- Initial release\n\n- Customer, Conversation, EmailMessage models\n\n- Full CRUD operations\n\n- CLI management tools\n\n- Gmail integration\n\n- Auto-link leads to customers\n\n- Customer statistics tracking
