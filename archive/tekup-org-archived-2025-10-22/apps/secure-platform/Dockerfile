# Secure Platform (NestJS)
FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
COPY pnpm-lock.yaml ./
RUN pnpm fetch

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --offline
RUN pnpm build

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
EXPOSE 4010
CMD ["node", "dist/main.js"]
