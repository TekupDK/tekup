# Friday AI Chat - Docker Configuration
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy package files and patches first
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies (patches are needed during install)
RUN pnpm install --frozen-lockfile || pnpm install

# Set build-time environment variables for Vite
ENV VITE_APP_ID=friday-ai
ENV VITE_APP_TITLE="Friday AI Chat"
ENV VITE_APP_LOGO=/logo.svg
ENV VITE_ANALYTICS_ENDPOINT=""
ENV VITE_ANALYTICS_WEBSITE_ID=""

# Copy all source code
COPY . .

# Build application (Vite will use the ENV vars above)
RUN pnpm build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start command
CMD ["pnpm", "start"]
