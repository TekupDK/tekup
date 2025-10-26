# Dockerfile for Web service
FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
COPY pnpm-lock.yaml ./
RUN pnpm fetch

FROM base AS deps
COPY . .
# Install workspace dependencies for flow-web offline
RUN pnpm install --frozen-lockfile --offline --filter @tekup/flow-web...

FROM base AS builder
COPY --from=deps /app .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm --filter @tekup/flow-web build

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=builder /app/apps/flow-web/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/flow-web/package.json ./package.json
COPY --from=builder /app/apps/flow-web/public ./public
COPY --from=builder /app/apps/flow-web/next.config.js ./

EXPOSE 3000
CMD ["node", "node_modules/.bin/next", "start"]
