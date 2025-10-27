# Knowledge MCP Server - Dockerfile
# Documentation search with semantic scoring
# Production ready with HTTP/SSE transport

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies (no lockfile in packages)
RUN pnpm install

# Copy source
COPY src/ ./src/

# Build
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm and wget for healthcheck
RUN npm install -g pnpm && \
    apk add --no-cache wget

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# Copy built files
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8050

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8050/health || exit 1

CMD ["node", "dist/index.js"]
