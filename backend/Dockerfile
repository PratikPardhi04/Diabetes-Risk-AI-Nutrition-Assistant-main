# # Backend Dockerfile
# FROM node:18-alpine

# # Install curl for health checks
# RUN apk add --no-cache curl

# # Set working directory
# WORKDIR /app

# # Copy package files
# COPY package*.json ./
# COPY prisma ./prisma/

# # Install all dependencies (needed for Prisma)
# RUN npm ci
# # 
# # Generate Prisma Client
# RUN npx prisma generate

# # Copy application code
# COPY . .

# # Expose port
# EXPOSE 5000

# # Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
# Backend Dockerfile
FROM node:18-bullseye

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy application source code
COPY . .

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
