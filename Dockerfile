# ============================================================
# FUNDUREX — INFLUWATCH PHASE 1
# Dockerfile — lightweight production build
# ============================================================

FROM node:20-alpine
WORKDIR /app

# Copy package.json and prisma schema first
COPY package.json ./
COPY prisma ./prisma

# Install production deps + prisma CLI, then generate client for Linux
RUN npm install --omit=dev --ignore-scripts --maxsockets 1 \
    && npm install prisma@5.10.0 --save-dev --maxsockets 1 \
    && npx prisma generate \
    && npm prune --omit=dev

# Copy pre-built dist
COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/src/server.js"]
