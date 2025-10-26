# TekUp Job Scheduling System - Docker Deployment Guide

🇩🇰 **Complete containerized Job Scheduling System for Danish cleaning industry**

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac/Linux)
- Docker Compose v2.0+
- 4GB+ RAM available
- PowerShell (for Windows deployment script)

### 1. Build and Run
```powershell
# Build the Docker image
.\deploy-scheduling.ps1 build

# Start all services
.\deploy-scheduling.ps1 up

# Access the application
# Web Interface: http://localhost:3000
# Nginx Proxy: http://localhost:80
```

### 2. Alternative Manual Commands
```bash
# Build the application
docker build -t tekup-job-scheduling:latest -f apps/tekup-crm-web/Dockerfile .

# Start with Docker Compose
docker-compose -f docker-compose.scheduling.yml up -d

# View logs
docker-compose -f docker-compose.scheduling.yml logs -f
```

## 📋 Available Services

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **TekUp Job Scheduling** | 3000 | Main Next.js application | `/api/health` |
| **Nginx Proxy** | 80/443 | Reverse proxy with SSL | Load balancer |
| **PostgreSQL** | 5432 | Database (future backend) | Built-in |
| **Redis** | 6379 | Cache & session store | Built-in |

## 🛠️ Deployment Script Usage

The `deploy-scheduling.ps1` script provides convenient deployment management:

```powershell
# Build Docker image
.\deploy-scheduling.ps1 build

# Start all services
.\deploy-scheduling.ps1 up

# Stop all services
.\deploy-scheduling.ps1 down

# View logs in real-time
.\deploy-scheduling.ps1 logs

# Rebuild everything from scratch
.\deploy-scheduling.ps1 rebuild

# Check system status and health
.\deploy-scheduling.ps1 status

# Clean up Docker resources
.\deploy-scheduling.ps1 clean
```

## ⚙️ Configuration

### Environment Variables
Copy and modify the environment template:
```bash
cp apps/tekup-crm-web/.env.docker apps/tekup-crm-web/.env.production
```

Key variables to configure:
```env
# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/tekup_scheduling

# Security (CHANGE IN PRODUCTION!)
JWT_SECRET=your_super_secret_jwt_key
SESSION_SECRET=your_session_secret

# Email/SMS Services
SMTP_HOST=your-smtp-server.com
SMS_API_KEY=your_sms_provider_key
```

### SSL Configuration
To enable HTTPS:
1. Place SSL certificates in `nginx/ssl/` directory
2. Uncomment HTTPS server block in `nginx/nginx.conf`
3. Update domain names in nginx configuration

## 🔧 Development vs Production

### Development Setup
```bash
# Use development compose file (if created)
docker-compose -f docker-compose.dev.yml up -d

# Mount source code for hot reloading
# (Requires additional volume mounts in compose file)
```

### Production Setup
```bash
# Use production compose file
docker-compose -f docker-compose.scheduling.yml up -d

# Set production environment variables
export NODE_ENV=production
```

## 📊 Monitoring & Health Checks

### Application Health
- **Endpoint**: `GET /api/health`
- **Response**: JSON with system status, memory usage, uptime
- **Docker Health Check**: Automated container health monitoring

### Container Status
```bash
# Check all containers
docker-compose -f docker-compose.scheduling.yml ps

# View container logs
docker logs tekup-job-scheduling

# Monitor resource usage
docker stats tekup-job-scheduling
```

### Log Management
```bash
# Follow all logs
docker-compose -f docker-compose.scheduling.yml logs -f

# Filter specific service
docker-compose -f docker-compose.scheduling.yml logs -f tekup-crm-web

# View last 100 lines
docker-compose -f docker-compose.scheduling.yml logs --tail=100
```

## 🔐 Security Considerations

### Production Security Checklist
- [ ] Change all default passwords in environment files
- [ ] Enable SSL/TLS with valid certificates
- [ ] Configure firewall rules (only allow necessary ports)
- [ ] Set up proper backup strategy
- [ ] Configure log rotation
- [ ] Enable container security scanning
- [ ] Use secrets management for sensitive data

### Network Security
- All services run in isolated Docker network
- Only necessary ports exposed to host
- Nginx reverse proxy with security headers
- Rate limiting configured

## 📁 File Structure
```
Tekup-org/
├── apps/tekup-crm-web/
│   ├── Dockerfile                 # Multi-stage production build
│   ├── .dockerignore             # Optimize build context
│   ├── .env.docker               # Environment template
│   └── app/api/health/           # Health check endpoint
├── nginx/
│   └── nginx.conf                # Reverse proxy configuration
├── docker-compose.scheduling.yml # Service orchestration
├── deploy-scheduling.ps1         # Deployment automation
└── README-Docker.md             # This file
```

## 🐛 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs for errors
docker logs tekup-job-scheduling

# Verify image was built correctly
docker image ls | grep tekup

# Check resource usage
docker system df
```

**Application not accessible:**
```bash
# Verify port mappings
docker port tekup-job-scheduling

# Check if port is in use
netstat -ano | findstr :3000

# Test container network
docker exec -it tekup-job-scheduling curl localhost:3000/api/health
```

**Build failures:**
```bash
# Clear Docker cache
docker builder prune -f

# Rebuild without cache
docker build --no-cache -t tekup-job-scheduling:latest -f apps/tekup-crm-web/Dockerfile .
```

### Performance Optimization

**Memory Usage:**
```bash
# Monitor container memory
docker stats --no-stream tekup-job-scheduling

# Adjust memory limits in compose file
services:
  tekup-crm-web:
    mem_limit: 1g
    mem_reservation: 512m
```

**Storage:**
```bash
# Clean up unused images
docker image prune -f

# Remove unused volumes
docker volume prune -f
```

## 🚀 Production Deployment

### Cloud Deployment (AWS/Azure/GCP)
1. **Container Registry**: Push image to cloud registry
2. **Container Service**: Deploy using ECS/AKS/Cloud Run
3. **Load Balancer**: Configure cloud load balancer
4. **Database**: Use managed database service
5. **Monitoring**: Set up cloud monitoring and alerts

### Self-Hosted Deployment
1. **Server Setup**: Ubuntu/CentOS with Docker installed
2. **Domain Configuration**: Point domain to server IP
3. **SSL Setup**: Use Let's Encrypt for free SSL certificates
4. **Backup Strategy**: Regular database and file backups
5. **Monitoring**: Set up Prometheus/Grafana or similar

## 📞 Support

For deployment issues or questions:
- Check application logs: `docker logs tekup-job-scheduling`
- Verify health endpoint: `curl http://localhost:3000/api/health`
- Review Docker Compose logs: `docker-compose logs`

---

**🇩🇰 TekUp Job Scheduling System** - Professional cleaning industry management platform
*Dockerized for scalable, production-ready deployment*