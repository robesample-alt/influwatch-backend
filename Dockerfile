# ============================================================
# FUNDUREX — INFLUWATCH PHASE 1
# Dockerfile — lightweight production build
# ============================================================

FROM node:20-alpine
WORKDIR /app

# Copy package.json, lock file, and prisma schema
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install all deps (need prisma CLI), generate client for Linux, then prune
RUN npm ci --maxsockets 1 \
    && npx prisma generate --schema=./prisma/schema.prisma \
    && npm prune --omit=dev

# Copy pre-built dist
COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/src/server.js"]
