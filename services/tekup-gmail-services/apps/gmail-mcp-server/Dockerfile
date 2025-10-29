FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src ./src

# Build the application
RUN npm run build

# Create directory for credentials and config
RUN mkdir -p /gmail-server /root/.gmail-mcp

# Set environment variables
ENV NODE_ENV=production
ENV GMAIL_CREDENTIALS_PATH=/gmail-server/credentials.json
ENV GMAIL_OAUTH_PATH=/root/.gmail-mcp/gcp-oauth.keys.json

# Expose port for OAuth flow
EXPOSE 3000

# Set entrypoint command
ENTRYPOINT ["node", "dist/index.js"]