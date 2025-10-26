# Tekup Website - Development Dockerfile
FROM node:20-alpine

# Install system dependencies including curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p src/utils

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

# Default command - run development server with host binding
CMD ["pnpm", "dev", "--host", "0.0.0.0"]