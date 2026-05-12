# --- STAGE 1: Build ---
FROM node:22-slim AS builder

WORKDIR /app

# Install system dependencies needed for Prisma
RUN apt-get update && apt-get install -y openssl python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDeps for Prisma)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# --- STAGE 2: Run ---
FROM node:22-slim

WORKDIR /app

# Install runtime dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy only the necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/index.js ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# Set production environment
ENV NODE_ENV=production

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
