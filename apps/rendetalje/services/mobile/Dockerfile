# 📱 RendetaljeOS Mobile - Expo Development Server
#
# This Dockerfile creates a container for the Expo development server.
# The actual React Native app runs on physical devices or emulators,
# which connect to this server.

FROM node:18-alpine

# Install Expo CLI and dependencies
RUN npm install -g expo-cli @expo/ngrok

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy app source
COPY . .

# Expo ports
# 19000 - Expo DevTools
# 19001 - Expo Metro Bundler
# 19002 - Expo web interface
EXPOSE 19000 19001 19002

# Environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:19002 || exit 1

# Start Expo
CMD ["npx", "expo", "start", "--lan", "--web"]
