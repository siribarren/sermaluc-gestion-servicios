FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Generar cliente Prisma antes del build
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar la aplicación
RUN npm run build

# Imagen de producción
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias, dist y prisma (incluye el cliente generado)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# ❌ Eliminar esta línea
# RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
