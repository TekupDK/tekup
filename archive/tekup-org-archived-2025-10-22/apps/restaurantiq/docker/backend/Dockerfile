# Base image with Node.js 20 LTS
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Copy package files for dependency installation
COPY backend/package*.json backend/yarn.lock* backend/pnpm-lock.yaml* ./backend/
COPY shared/package*.json ./shared/ 
COPY package*.json yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm ci; fi

# Install ts-node globally
RUN npm install -g ts-node typescript

# Development stage
FROM base AS development

# Install development dependencies
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install; \
    else npm install; fi

# Install ts-node globally in development
RUN npm install -g ts-node typescript

# Copy source code
COPY backend ./backend
COPY shared ./shared

# Build TypeScript to JavaScript
WORKDIR /app/backend
RUN npx tsc src/server.ts --outDir dist --target ES2022 --module commonjs --esModuleInterop --skipLibCheck

# Create logs directory
RUN mkdir -p /app/backend/logs && chown -R node:node /app/backend/logs

# Expose ports (main app + debug)
EXPOSE 4000 9229

# Switch to non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Set working directory to backend
WORKDIR /app/backend

# Start with nodemon for hot reload
CMD ["dumb-init", "node", "--inspect=*******:9229", "dist/server.js"]

# Build stage
FROM base AS build

# Copy source code
COPY backend ./backend
COPY shared ./shared

# Build the application
WORKDIR /app/backend
RUN if [ -f ../pnpm-lock.yaml ]; then pnpm run build; \
    elif [ -f ../yarn.lock ]; then yarn run build; \
    else npm run build; fi

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

# Copy built application and dependencies from build stage
COPY --from=build --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --from=build --chown=nodejs:nodejs /app/backend/package*.json ./backend/
COPY --from=build --chown=nodejs:nodejs /app/shared ./shared
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p /app/backend/logs && chown -R nodejs:nodejs /app/backend/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["dumb-init", "node", "backend/dist/server.js"]
