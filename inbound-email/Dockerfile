# Dockerfile for inbound-email SMTP Server
# This service receives emails via SMTP and sends them to the friday-ai webhook endpoint

FROM node:20-alpine

WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++

# Copy app files
COPY package.json ./
COPY index.js ./

# Install production dependencies
RUN npm install --omit=dev && \
    mkdir -p /app/storage/attachments

# Expose SMTP ports
EXPOSE 25 587 8080

# Start the server
CMD ["node", "index.js"]

