# --- STAGE 1: Build ---
FROM node:22-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl python3 make g++

# 1. Install Backend Dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

# 2. Build Frontend
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client/
RUN cd client && npm run build

# 3. Copy Backend Source
COPY . .

# --- STAGE 2: Run ---
FROM node:22-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Copy built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/index.js ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/client/node_modules ./client/node_modules
COPY --from=builder /app/client/dist ./client/dist

# Set production environment
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "index.js"]
