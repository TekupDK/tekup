# TekUp Agents Hub Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
RUN pnpm fetch

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json .
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
EXPOSE 3000
CMD ["pnpm","start"]
