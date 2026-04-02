# ============================================================
# FUNDUREX — INFLUWATCH PHASE 1
# Dockerfile — production build
# ============================================================

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --maxsockets 1

COPY . .
RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

# ── Production image ──────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --maxsockets 1

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["node", "dist/server.js"]
