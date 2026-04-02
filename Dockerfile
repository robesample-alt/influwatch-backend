# ============================================================
# FUNDUREX — INFLUWATCH PHASE 1
# Dockerfile — lightweight production build
# ============================================================

FROM node:20-alpine
WORKDIR /app

# Copy pre-built dist and prisma schema
COPY dist ./dist
COPY prisma ./prisma
COPY package.json ./

# Install production deps only, skip postinstall scripts
RUN npm install --omit=dev --ignore-scripts --maxsockets 1 \
    && npx prisma generate

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/src/server.js"]
