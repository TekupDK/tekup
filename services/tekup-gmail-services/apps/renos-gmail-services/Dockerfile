FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git

# Copy package files
COPY package.json tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src ./src

# Build the application
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S renos -u 1001

# Change ownership
RUN chown -R renos:nodejs /app
USER renos

# Expose port
EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3011/health || exit 1

# Start command
CMD ["npm", "start"]