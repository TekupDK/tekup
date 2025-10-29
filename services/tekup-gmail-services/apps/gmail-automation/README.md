# TekUp Gmail Automation

**Intelligent PDF forwarding and receipt processing for TekUp organization**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

## 🚀 Features

- **Smart Gmail PDF Forwarding**: Automatically forwards PDF attachments to designated recipients
- **Receipt Processing**: Intelligent processing of receipts from Google Photos and email attachments
- **Economic API Integration**: Seamless integration with Economic accounting system
- **RenOS Integration**: Full integration with TekUp's RenOS backend/frontend
- **Duplicate Detection**: Advanced duplicate detection to prevent processing the same documents
- **Docker Support**: Complete containerization for easy deployment
- **MCP Server**: Model Context Protocol server for AI integration
- **Gmail MCP Server**: Auto OAuth2 authentication for any @gmail.com account

## 📁 Project Structure

```
tekup-gmail-automation/
├── src/
│   ├── core/           # Core functionality
│   ├── integrations/   # External API integrations
│   ├── processors/     # Document processors
│   └── utils/          # Utility functions
├── tests/              # Test files
├── docs/               # Documentation
├── config/             # Configuration files
├── scripts/            # Deployment scripts
├── pyproject.toml      # Project configuration
├── requirements.txt    # Python dependencies
├── docker-compose.yml  # Docker configuration
└── README.md
```

## 🛠️ Installation

### Prerequisites

- Python 3.8+
- Google Cloud Platform account
- Gmail API credentials
- Economic API credentials (optional)

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tekup/tekup-gmail-automation.git
   cd tekup-gmail-automation
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -e .
   ```

4. **Configure environment**
   ```bash
   cp config/example.env .env
   # Edit .env with your credentials
   ```

### Docker Installation

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

## ⚙️ Configuration

### Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create credentials (OAuth 2.0)
5. Download credentials JSON file
6. Place in `config/` directory

### Economic API Setup

1. Contact Economic for API access
2. Configure API credentials in `config/economic_api_config.json`
3. See `docs/ECONOMIC_API_SETUP.md` for detailed instructions

### Google Photos Setup

1. Enable Google Photos API
2. Configure credentials
3. See `docs/GOOGLE_PHOTOS_SETUP.md` for detailed instructions

## 🚀 Usage

### Command Line Interface

```bash
# Start the Gmail automation service
tekup-gmail start

# Process specific email
tekup-gmail process --email-id <email-id>

# Check system status
tekup-gmail status

# Run receipt processing
tekup-gmail process-receipts
```

### Python API

```python
from src.core.gmail_forwarder import GmailForwarder
from src.processors.receipt_processor import ReceiptProcessor

# Initialize forwarder
forwarder = GmailForwarder()

# Process emails
forwarder.process_emails()

# Process receipts
processor = ReceiptProcessor()
processor.process_receipts()
```

### MCP Server

```bash
# Start MCP server
python -m src.core.mcp_server
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test categories
pytest -m unit
pytest -m integration
```

## 📊 Monitoring

The system provides comprehensive logging and monitoring:

- **Application logs**: `logs/tekup-gmail.log`
- **Error tracking**: Automatic error reporting
- **Performance metrics**: Processing times and success rates
- **Health checks**: System status monitoring

## 🔧 Development

### Code Style

This project uses:

- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting
- **mypy** for type checking

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

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t tekup-gmail-automation .

# Run container
docker run -d --name tekup-gmail \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/logs:/app/logs \
  tekup-gmail-automation
```

### Production Deployment

1. **Configure environment variables**
2. **Set up reverse proxy** (nginx/Apache)
3. **Configure SSL certificates**
4. **Set up monitoring** (Prometheus/Grafana)
5. **Configure backup strategy**

## 📚 Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Economic API Setup](docs/ECONOMIC_API_SETUP.md)
- [Google Photos Setup](docs/GOOGLE_PHOTOS_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/tekup/tekup-gmail-automation/wiki)
- **Issues**: [GitHub Issues](https://github.com/tekup/tekup-gmail-automation/issues)
- **Email**: <info@tekup.dk>

## 🏷️ Version History

- **v1.2.0** - Complete restructure and production readiness
- **v1.1.0** - Added Economic API integration
- **v1.0.0** - Initial release with Gmail forwarding

---

**TekUp Gmail Automation** - Streamlining document processing for modern businesses.
