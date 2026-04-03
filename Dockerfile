# ============================================================
# FUNDUREX — INFLUWATCH PHASE 1
# Dockerfile — lightweight production build
# ============================================================

FROM node:20-bullseye-slim
WORKDIR /app

RUN apt-get update && apt-get install -y openssl libssl1.1 && rm -rf /var/lib/apt/lists/*

# Copy package.json, lock file, and prisma schema
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install all deps and generate Prisma client for Linux
RUN npm ci --maxsockets 1 \
    && npx prisma generate --schema=./prisma/schema.prisma

# Copy pre-built dist
COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "echo DATABASE_URL=$DATABASE_URL | head -c 30 && echo '...' && node dist/src/server.js"]
