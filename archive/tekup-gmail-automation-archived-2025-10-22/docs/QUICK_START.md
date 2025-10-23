# Quick Start Guide

Get up and running with TekUp Gmail Automation in minutes!

## 🚀 Prerequisites

- Python 3.8+ installed
- Google Cloud Platform account
- Gmail API credentials
- (Optional) Economic API credentials

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/tekup/tekup-gmail-automation.git
cd tekup-gmail-automation
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy example configuration
cp config/env.example .env

# Edit configuration
notepad .env  # Windows
nano .env     # Linux/Mac
```

## ⚙️ Configuration

### Gmail API Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** or select existing
3. **Enable Gmail API**
4. **Create credentials** (OAuth 2.0)
5. **Download credentials JSON** file
6. **Place in `config/` directory** as `credentials.json`

### Economic API Setup (Optional)

1. **Contact Economic** for API access
2. **Configure credentials** in `config/economic_api_config.json`
3. **See detailed guide**: `docs/ECONOMIC_API_SETUP.md`

## 🚀 Usage

### Command Line Interface

```bash
# Start the service
python -m src.core.main start

# Process specific email
python -m src.core.main process --email-id <email-id>

# Check system status
python -m src.core.main status

# Process receipts
python -m src.core.main process-receipts

# Run tests
python -m src.core.main test
```

### Docker Usage

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 Monitoring

### Check System Status

```bash
python -m src.core.main status
```

### View Logs

```bash
# Application logs
tail -f logs/tekup-gmail.log

# Docker logs
docker-compose logs -f tekup-gmail-automation
```

### Health Checks

The system provides automatic health checks:
- Gmail API connection
- Economic API connection
- Receipt processor status
- Database connectivity

## 🔧 Development

### Code Quality

```bash
# Format code
black src tests

# Sort imports
isort src tests

# Run linting
flake8 src tests

# Type checking
mypy src
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific tests
pytest tests/test_gmail_forwarder.py
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## 🚀 Deployment

### Production Deployment

1. **Configure environment variables**
2. **Set up reverse proxy** (nginx/Apache)
3. **Configure SSL certificates**
4. **Set up monitoring** (Prometheus/Grafana)
5. **Configure backup strategy**

### Docker Production

```bash
# Build production image
docker build -t tekup-gmail-automation:latest .

# Run with production settings
docker run -d \
  --name tekup-gmail \
  -e ENVIRONMENT=production \
  -v $(pwd)/config:/app/config:ro \
  -v $(pwd)/logs:/app/logs \
  tekup-gmail-automation:latest
```

## 🆘 Troubleshooting

### Common Issues

1. **Gmail API Authentication**
   - Ensure credentials.json is in config/ directory
   - Check OAuth scopes are correct
   - Verify token.json is generated

2. **Economic API Connection**
   - Verify API credentials
   - Check network connectivity
   - Review API rate limits

3. **Docker Issues**
   - Check Docker daemon is running
   - Verify port availability
   - Review container logs

### Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/tekup/tekup-gmail-automation/issues)
- **Email**: info@tekup.dk

## 📚 Next Steps

1. **Read the full documentation**: `README.md`
2. **Configure integrations**: `docs/ECONOMIC_API_SETUP.md`
3. **Set up monitoring**: `docs/DEPLOYMENT.md`
4. **Customize processing**: `docs/API.md`

---

**Welcome to TekUp Gmail Automation!** 🎉
