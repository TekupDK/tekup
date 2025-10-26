# Dockerfile for TekUp CRM Web - Job Scheduling System
# Multi-stage build for optimized production container

# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./

# Copy shared packages first (needed for workspace dependencies)
COPY packages/ ./packages/
COPY apps/tekup-crm-web/package.json ./apps/tekup-crm-web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/tekup-crm-web/ ./apps/tekup-crm-web/

# Copy shared config and types
COPY tsconfig.base.json ./
COPY tsconfig.json ./

# Build the shared dependencies first
RUN pnpm --filter @tekup/config build
RUN pnpm --filter @tekup/ui build
RUN pnpm --filter @tekup/api-client build
RUN pnpm --filter @tekup/auth build

# Build the application
WORKDIR /app/apps/tekup-crm-web
RUN pnpm build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/tekup-crm-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/tekup-crm-web/.next/static ./apps/tekup-crm-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/tekup-crm-web/public ./apps/tekup-crm-web/public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Start the application
CMD ["node", "apps/tekup-crm-web/server.js"]