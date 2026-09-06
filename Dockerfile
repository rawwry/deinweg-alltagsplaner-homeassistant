# Multi-stage Dockerfile for Dein Weg Alltagsplaner (Home Assistant Add-on)

# Stage 1: Build Frontend & Backend
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY shared ./shared
COPY server ./server
COPY client ./client

# Build client and server
RUN npm run build:client
RUN npm run build:server

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl sqlite

ENV NODE_ENV=production
ENV PORT=4731

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm install tsx prisma

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 4731

ENTRYPOINT ["/app/docker-entrypoint.sh"]
