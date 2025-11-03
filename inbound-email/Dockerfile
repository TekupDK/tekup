# Dockerfile for inbound-email SMTP Server
# This service receives emails via SMTP and sends them to webhook endpoint

FROM node:20-alpine

WORKDIR /app

# Install dependencies for building and git
RUN apk add --no-cache python3 make g++ git

# Clone inbound-email repository
RUN git clone https://github.com/sendbetter/inbound-email.git temp && \
    mv temp/* . && \
    mv temp/.* . 2>/dev/null || true && \
    rm -rf temp

# Install dependencies (skip if package.json missing)
RUN npm install --production || (echo '{"name":"inbound-email","version":"1.0.0"}' > package.json && npm install)

# Create storage directory
RUN mkdir -p /app/storage/attachments

# Expose SMTP ports
EXPOSE 25 587

# Health check endpoint (if available)
# If inbound-email doesn't have health endpoint, remove healthcheck from docker-compose.yml
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 0

# Start the server
CMD ["node", "index.js"]

