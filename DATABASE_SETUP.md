# Database Setup - Friday AI

## MySQL/TiDB Connection String

### Format

Drizzle ORM bruger `mysql2` driveren, som forventer en connection string i følgende format:

```
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE?ssl=URL_ENCODED_JSON
```

### SSL Parameter (TiDB Cloud)

For TiDB Cloud skal SSL-parameteren være **URL-encodet JSON**:

**Original JSON:**

```json
{ "rejectUnauthorized": true }
```

**URL-encodet:**

```
%7B%22rejectUnauthorized%22%3Atrue%7D
```

### Eksempler

#### TiDB Cloud (Production)

```bash
DATABASE_URL=mysql://USERNAME:PASSWORD@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/friday_ai?ssl=%7B%22rejectUnauthorized%22%3Atrue%7D
```

**Vigtigt:**

- Port er **4000** for TiDB Cloud
- SSL parameter skal være URL-encodet
- `rejectUnauthorized:true` sikrer at certifikatet valideres

#### Local MySQL (Docker)

```bash
DATABASE_URL=mysql://friday_user:friday_password@localhost:3306/friday_ai
```

Eller hvis du bruger Docker container:

```bash
DATABASE_URL=mysql://friday_user:friday_password@db:3306/friday_ai
```

### URL Encoding Tool

Hvis du har brug for at encode SSL-parameteren:

**JavaScript/Node.js:**

```javascript
const sslParam = JSON.stringify({ rejectUnauthorized: true });
const encoded = encodeURIComponent(sslParam);
console.log(encoded); // %7B%22rejectUnauthorized%22%3Atrue%7D
```

**Online:**

- Brug https://www.urlencoder.org/
- Paste: `{"rejectUnauthorized":true}`
- Copy encoded result

### Drizzle ORM Connection

Drizzle bruger `mysql2` der automatisk håndterer:

- Connection pooling
- SSL/TLS når specifiseret i connection string
- Prepared statements

```typescript
import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);
```

### Troubleshooting

#### "Access denied" error

- Tjek username/password
- Tjek at database brugeren har rettigheder
- Tjek firewall rules i TiDB Cloud

#### SSL Error

- Verificer at SSL parameter er korrekt URL-encodet
- Prøv at sætte `rejectUnauthorized:false` midlertidigt for debugging
- Tjek at certifikatet er gyldigt

#### Connection timeout

- Tjek firewall rules
- Verificer host/port er korrekt
- Tjek network connectivity

### Security Best Practices

1. **Rotér passwords regelvendigt**
2. **Brug environment variables** - aldrig hardcode credentials
3. **Brug SSL/TLS** i produktion (krævet for TiDB Cloud)
4. **Limit database user permissions** - kun nødvendige rettigheder

### Migration

Database schema pushes automatisk med:

```bash
pnpm db:push
```

Eller manuelt med Drizzle Kit:

```bash
drizzle-kit generate
drizzle-kit migrate
```
