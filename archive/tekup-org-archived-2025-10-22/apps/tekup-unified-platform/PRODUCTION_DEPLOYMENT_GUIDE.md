# Tekup Unified Platform - Produktions Deployment Guide

## 🚀 **Komplet Produktions Setup**

### Prerequisites

1. **Server Requirements**
   - Ubuntu 20.04+ eller CentOS 8+
   - Minimum 4 CPU cores, 8GB RAM, 100GB disk
   - Docker og Docker Compose installeret
   - SSL certifikater (Let's Encrypt anbefalet)

2. **Software Dependencies**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### 1. Server Setup

```bash
# Opret tekup bruger
sudo adduser tekup
sudo usermod -aG docker tekup
sudo su - tekup

# Opret projekt directory
mkdir -p /home/tekup/tekup-platform
cd /home/tekup/tekup-platform
```

### 2. Clone og Setup

```bash
# Clone repository (eller upload filer)
git clone https://github.com/tekup/tekup-unified-platform.git .

# Gør scripts executable
chmod +x scripts/deploy.sh

# Kopier environment filer
cp .env.production .env
```

### 3. Konfigurer Environment

Rediger `.env` filen med dine produktions værdier:

```env
# Database
DATABASE_URL="postgresql://tekup:STRONG_PASSWORD@postgres:5432/tekup_unified"

# JWT Secret (generer en stærk secret)
JWT_SECRET="$(openssl rand -base64 64)"

# AI API Keys
OPENAI_API_KEY="sk-your-openai-key"
GOOGLE_API_KEY="your-google-key"

# Domain
CORS_ORIGIN=https://tekup.dk,https://*.tekup.dk
```

### 4. SSL Setup

```bash
# Install Certbot
sudo apt install certbot

# Generer SSL certifikater
sudo certbot certonly --standalone -d tekup.dk -d *.tekup.dk

# Kopier certifikater til projekt
sudo cp /etc/letsencrypt/live/tekup.dk/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/tekup.dk/privkey.pem ./ssl/key.pem
sudo chown tekup:tekup ./ssl/*
```

### 5. Deploy Application

```bash
# Kør deployment script
./scripts/deploy.sh production

# Eller manuel deployment
docker-compose -f docker-compose.prod.yml up -d
```

### 6. Verificer Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f tekup-platform

# Test API
curl https://tekup.dk/api/health
```

## 🔧 **Produktions Konfiguration**

### Database Setup

1. **PostgreSQL Konfiguration**
   ```sql
   -- Opret database
   CREATE DATABASE tekup_unified;
   CREATE USER tekup WITH PASSWORD 'STRONG_PASSWORD';
   GRANT ALL PRIVILEGES ON DATABASE tekup_unified TO tekup;
   ```

2. **Run Migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec tekup-platform npx prisma migrate deploy
   ```

### Nginx Konfiguration

```nginx
# /etc/nginx/sites-available/tekup.dk
server {
    listen 80;
    server_name tekup.dk *.tekup.dk;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tekup.dk *.tekup.dk;

    ssl_certificate /etc/letsencrypt/live/tekup.dk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tekup.dk/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Monitoring Setup

1. **Health Checks**
   ```bash
   # API Health
   curl https://tekup.dk/api/health
   
   # Database Health
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready
   ```

2. **Log Monitoring**
   ```bash
   # Application logs
   docker-compose -f docker-compose.prod.yml logs -f tekup-platform
   
   # Database logs
   docker-compose -f docker-compose.prod.yml logs -f postgres
   ```

## 📊 **Performance Optimization**

### Database Optimization

```sql
-- Opret indexes for bedre performance
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_customers_tenant_email ON customers(tenant_id, email);
CREATE INDEX idx_deals_customer_stage ON deals(customer_id, stage);
CREATE INDEX idx_activities_customer_type ON activities(customer_id, type);
```

### Application Optimization

1. **Environment Variables**
   ```env
   # Enable production optimizations
   NODE_ENV=production
   ENABLE_METRICS=true
   LOG_LEVEL=warn
   ```

2. **Docker Resource Limits**
   ```yaml
   # I docker-compose.prod.yml
   services:
     tekup-platform:
       deploy:
         resources:
           limits:
             memory: 2G
             cpus: '2.0'
   ```

## 🔒 **Security Hardening**

### 1. Firewall Setup

```bash
# UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Database Security

```sql
-- Opret read-only bruger til reporting
CREATE USER tekup_readonly WITH PASSWORD 'READONLY_PASSWORD';
GRANT CONNECT ON DATABASE tekup_unified TO tekup_readonly;
GRANT USAGE ON SCHEMA public TO tekup_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tekup_readonly;
```

### 3. Application Security

```env
# Strong JWT secret
JWT_SECRET="$(openssl rand -base64 64)"

# Rate limiting
RATE_LIMIT_TTL=3600
RATE_LIMIT_MAX=1000

# CORS restrictions
CORS_ORIGIN=https://tekup.dk,https://*.tekup.dk
```

## 📈 **Monitoring & Alerting**

### 1. Application Metrics

```bash
# Check application metrics
curl https://tekup.dk/api/metrics

# Check database connections
docker-compose -f docker-compose.prod.yml exec postgres psql -U tekup -d tekup_unified -c "SELECT count(*) FROM pg_stat_activity;"
```

### 2. Log Aggregation

```bash
# Setup log rotation
sudo tee /etc/logrotate.d/tekup << EOF
/home/tekup/tekup-platform/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 tekup tekup
}
EOF
```

## 🔄 **Backup & Recovery**

### 1. Database Backup

```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/tekup/backups"
mkdir -p $BACKUP_DIR

docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U tekup tekup_unified > $BACKUP_DIR/database_$DATE.sql
gzip $BACKUP_DIR/database_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "database_*.sql.gz" -mtime +30 -delete
```

### 2. Application Backup

```bash
#!/bin/bash
# backup-app.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/tekup/backups"

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/tekup/tekup-platform --exclude=node_modules --exclude=logs

# Keep only last 7 days
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete
```

### 3. Automated Backups

```bash
# Add to crontab
crontab -e

# Daily database backup at 2 AM
0 2 * * * /home/tekup/tekup-platform/scripts/backup-db.sh

# Weekly application backup on Sunday at 3 AM
0 3 * * 0 /home/tekup/tekup-platform/scripts/backup-app.sh
```

## 🚨 **Troubleshooting**

### Common Issues

1. **Application Won't Start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs tekup-platform
   
   # Check environment
   docker-compose -f docker-compose.prod.yml exec tekup-platform env
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   docker-compose -f docker-compose.prod.yml exec postgres psql -U tekup -d tekup_unified -c "SELECT 1;"
   ```

3. **SSL Certificate Issues**
   ```bash
   # Renew certificates
   sudo certbot renew
   sudo systemctl reload nginx
   ```

### Performance Issues

1. **High Memory Usage**
   ```bash
   # Check memory usage
   docker stats
   
   # Restart services
   docker-compose -f docker-compose.prod.yml restart
   ```

2. **Slow Database Queries**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

## 📞 **Support & Maintenance**

### Regular Maintenance

1. **Weekly Tasks**
   - Check application logs for errors
   - Verify backup integrity
   - Monitor disk space usage
   - Update security patches

2. **Monthly Tasks**
   - Review performance metrics
   - Update dependencies
   - Test disaster recovery procedures
   - Security audit

### Support Contacts

- **Technical Support**: support@tekup.dk
- **Emergency**: +45 12345678
- **Documentation**: https://tekup.dk/docs

## 🎉 **Deployment Complete!**

Din Tekup Unified Platform er nu klar til produktion med:

✅ **Høj tilgængelighed** - Docker containerization  
✅ **Sikkerhed** - SSL, firewall, rate limiting  
✅ **Performance** - Optimerede database queries  
✅ **Monitoring** - Health checks og metrics  
✅ **Backup** - Automatiske backups  
✅ **Skalering** - Multi-tenant architecture  

**Platform URL**: https://tekup.dk  
**API Documentation**: https://tekup.dk/api/docs  
**Admin Panel**: https://tekup.dk/admin  

Velkommen til fremtiden for business intelligence! 🚀