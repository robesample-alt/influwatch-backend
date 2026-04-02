# ============================================================
# FUNDUREX — INFLUWATCH PHASE 1
# Dockerfile — production build (single-stage for low memory)
# ============================================================

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --maxsockets 1

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/server.js"]
