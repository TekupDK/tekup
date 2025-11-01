FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
# Install dependencies explicitly to ensure all packages are installed
RUN npm install --verbose

# Copy source code
COPY . .

# Force reinstall @google/generative-ai to ensure it's available
RUN npm install @google/generative-ai --force && npm list @google/generative-ai && ls -la node_modules/@google/generative-ai/dist

# Expose port
EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3011/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the service using tsx (development mode)
CMD ["npm", "run", "dev"]
