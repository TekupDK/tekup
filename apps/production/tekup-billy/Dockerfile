# Tekup-Billy MCP Server - Dockerfile
# Single-stage runtime image using tsx for TypeScript execution
# Version 1.4.4 - Railway Production

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev for tsx runtime)
RUN npm ci && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check (longer start-period for tsx compilation)
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start HTTP server using tsx (npx ensures correct path resolution)
CMD ["npx", "tsx", "src/http-server.ts"]
