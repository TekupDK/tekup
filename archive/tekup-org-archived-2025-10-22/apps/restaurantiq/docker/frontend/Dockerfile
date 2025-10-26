# Base image with Node.js 20 LTS
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat dumb-init

# Copy package files for dependency installation
COPY frontend/package*.json frontend/yarn.lock* frontend/pnpm-lock.yaml* ./frontend/
COPY shared/package*.json ./shared/
COPY package*.json yarn.lock* pnpm-lock.yaml* ./

# Development stage
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install; \
    elif [ -f yarn.lock ]; then yarn install; \
    else npm install; fi

# Copy source code
COPY frontend ./frontend
COPY shared ./shared

# Create .next directory and set permissions
RUN mkdir -p /app/frontend/.next && chown -R node:node /app/frontend/.next

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Set Next.js telemetry to disabled
ENV NEXT_TELEMETRY_DISABLED=1

# Start Next.js in development mode with hot reload
CMD ["dumb-init", "npm", "run", "dev", "--prefix", "frontend"]

# Dependencies stage for production
FROM base AS deps

# Install production dependencies only
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile --prod; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile --production; \
    else npm ci --only=production; fi

# Build stage
FROM base AS build

# Install all dependencies
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm ci; fi

# Copy source code
COPY frontend ./frontend
COPY shared ./shared

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
WORKDIR /app/frontend
RUN if [ -f ../pnpm-lock.yaml ]; then pnpm run build; \
    elif [ -f ../yarn.lock ]; then yarn run build; \
    else npm run build; fi

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create nextjs user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/frontend/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["dumb-init", "node", "server.js"]
