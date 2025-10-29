# Security Policy

Sikkerhedspolitik for Tekup Database.

---

## 🔒 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | ✅ Yes             |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

---

## 🚨 Reporting Security Vulnerabilities

**DO NOT** create public GitHub issues for security vulnerabilities.

### Reporting Process

1. **Email:** <jonas@tekup.com>
2. **Subject:** "Security Vulnerability - Tekup Database"
3. **Include:**
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Time:** Within 48 hours

---

## 🛡️ Security Best Practices

### Database Security

#### Connection Strings

```bash
# ✅ Good - In environment variables
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# ❌ Bad - Hardcoded in code
const url = "postgresql://user:password123@..."
```

#### SSL/TLS

**Always use SSL in production:**
```bash
DATABASE_URL="...?sslmode=require"
```

**Local development only:**
```bash
DATABASE_URL="...?sslmode=disable"
```

#### Password Requirements

- Minimum 16 characters for production
- Use strong random passwords
- Rotate credentials regularly
- Store in secure vault (not in .env in production)

### API Keys & Secrets

#### Storage

```typescript
// ✅ Good - Environment variables
const apiKey = process.env.BILLY_API_KEY;

// ❌ Bad - Hardcoded
const apiKey = "sk_live_abc123...";
```

#### Encryption

```typescript
import { encrypt, decrypt } from './crypto';

// Encrypt before storing
const encrypted = encrypt(apiKey);
await prisma.billyOrganization.create({
  data: { billyApiKey: encrypted }
});

// Decrypt when using
const decrypted = decrypt(org.billyApiKey);
```

### Access Control

#### Schema-Level Permissions

```sql
-- Create read-only user
CREATE USER readonly_user WITH PASSWORD 'strong_password';

-- Grant schema access
GRANT USAGE ON SCHEMA vault TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA vault TO readonly_user;

-- Prevent writes
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vault FROM readonly_user;
```

#### Row-Level Security (Future)

```sql
-- Enable RLS
ALTER TABLE vault.documents ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY user_documents ON vault.documents
  FOR ALL
  USING (user_id = current_user_id());
```

### Input Validation

#### Always Validate User Input

```typescript
// ✅ Good - Validated
import { z } from 'zod';

const LeadSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+?\d{8,15}$/),
  source: z.enum(['website', 'email', 'phone']),
});

export async function createLead(input: unknown) {
  const validated = LeadSchema.parse(input);
  return prisma.renosLead.create({ data: validated });
}

// ❌ Bad - No validation
export async function createLead(input: any) {
  return prisma.renosLead.create({ data: input });
}
```

### SQL Injection Prevention

**Prisma automatically prevents SQL injection, but:**

```typescript
// ✅ Good - Prisma parameterized queries
await prisma.user.findMany({
  where: { email: userInput }
});

// ✅ Good - Raw queries with parameters
await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// ❌ Bad - String concatenation (DON'T DO THIS)
await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'`
);
```

### Rate Limiting

```typescript
// Built-in rate limiting in Billy schema
export async function checkRateLimit(
  orgId: string,
  toolName: string,
  maxRequests: number,
  windowMinutes: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const count = await prisma.billyRateLimit.count({
    where: {
      organizationId: orgId,
      endpoint: toolName,
      timestamp: { gte: since },
    },
  });
  
  return count < maxRequests;
}
```

### Audit Logging

```typescript
// Log all sensitive operations
export async function logAudit(data: {
  organizationId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  success: boolean;
  errorMessage?: string;
}) {
  await prisma.billyAuditLog.create({ data });
}
```

---

## 🔐 Encryption

### Data at Rest

**PostgreSQL:**

- Use encrypted disk volumes (Azure, AWS, Render.com provides this)
- Enable transparent data encryption

### Data in Transit

**Always use TLS:**
```bash
DATABASE_URL="...?sslmode=require"
```

### Sensitive Fields

**Encrypt before storing:**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## 🚦 Security Checklist

### Development

- [ ] No secrets in code
- [ ] All user input validated
- [ ] SQL injection prevented (use Prisma)
- [ ] XSS prevention (sanitize output)
- [ ] CSRF tokens (if web interface)
- [ ] Rate limiting implemented
- [ ] Audit logging for sensitive operations

### Deployment

- [ ] SSL/TLS enabled
- [ ] Strong passwords
- [ ] Secrets in environment variables
- [ ] Database backups encrypted
- [ ] Access control configured
- [ ] Monitoring enabled
- [ ] Security updates scheduled

### Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Review audit logs weekly
- [ ] Rotate credentials quarterly
- [ ] Security audit annually
- [ ] Test backups monthly

---

## 🔍 Vulnerability Scanning

### Dependencies

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix
```

### Database

```sql
-- Check for weak passwords
SELECT usename FROM pg_user WHERE passwd IS NULL;

-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'vault';
```

---

## 📋 Compliance

### GDPR (EU)

- **Data minimization:** Only store necessary data
- **Right to deletion:** Implement data deletion endpoints
- **Data portability:** Provide export functionality
- **Consent tracking:** Log user consent
- **Breach notification:** 72-hour reporting

### Data Retention

```typescript
// Example: Delete old audit logs
export async function cleanupOldLogs(retentionDays: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  await prisma.billyAuditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });
}
```

---

## 🆘 Incident Response

### If Security Breach Occurs

1. **Immediate:**
   - Disconnect affected systems
   - Assess scope of breach
   - Notify security team

2. **Within 24 hours:**
   - Change all credentials
   - Review audit logs
   - Identify attack vector
   - Patch vulnerability

3. **Within 72 hours:**
   - Notify affected users (if applicable)
   - Document incident
   - Implement additional safeguards
   - Review security policies

4. **Post-incident:**
   - Conduct post-mortem
   - Update security procedures
   - Train team on lessons learned

---

## 📞 Contact

**Security Team:** <jonas@tekup.com>  
**PGP Key:** [Available on request]  
**Response Time:** 48 hours maximum

---

**Last Updated:** 2025-10-21  
**Version:** 1.0.0
