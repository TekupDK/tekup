# Dockerfile for API service
FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
COPY pnpm-lock.yaml ./
RUN pnpm fetch

FROM base AS deps
COPY . .
# Install workspace dependencies for flow-api with offline store
RUN pnpm install --frozen-lockfile --offline --filter @tekup/flow-api...

FROM base AS builder
COPY --from=deps /app .
RUN pnpm --filter @tekup/flow-api prisma:generate
RUN pnpm --filter @tekup/flow-api build

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/flow-api/dist ./dist
COPY --from=builder /app/apps/flow-api/package.json ./package.json
COPY --from=builder /app/apps/flow-api/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/main.js"]
