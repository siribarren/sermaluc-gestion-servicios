# ---------- BUILDER ----------
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl1.1-compat libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build


# ---------- PRODUCTION ----------
FROM node:20-alpine

RUN apk add --no-cache openssl1.1-compat libc6-compat

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
