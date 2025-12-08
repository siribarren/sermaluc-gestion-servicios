# -----------------------------
# 1) Etapa de build
# -----------------------------
FROM node:20 AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Construir NestJS → genera dist/
RUN npm run build

# -----------------------------
# 2) Imagen final para producción
# -----------------------------
FROM node:20-slim

# Instalar dependencias necesarias para Prisma Engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Copiar lo necesario
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Cloud Run usa PORT=8080
ENV PORT=8080
EXPOSE 8080

# Levantar NestJS
CMD ["node", "dist/main.js"]
