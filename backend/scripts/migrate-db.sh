#!/bin/bash

# Script para ejecutar migraciones de Prisma
# Uso: bash scripts/migrate-db.sh [proxy|direct|local]

set -e

METHOD=${1:-proxy}

CONNECTION_NAME="sermaluc-gestion-servicios:us-central1:nomina-sql"
DB_NAME="db-nomina"
DB_USER="sermaluc-db"

echo "🗄️  Ejecutando migraciones de Prisma..."

if [ "$METHOD" == "proxy" ]; then
    echo "📡 Usando Cloud SQL Proxy..."
    
    # Verificar si cloud-sql-proxy está corriendo
    if ! pg_isready -h 127.0.0.1 -p 5432 &> /dev/null; then
        echo "⚠️  Cloud SQL Proxy no está corriendo"
        echo "   Ejecuta en otra terminal: ./cloud-sql-proxy $CONNECTION_NAME"
        exit 1
    fi
    
    read -sp "Contraseña para $DB_USER: " DB_PASSWORD
    echo ""
    
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME"
    
elif [ "$METHOD" == "direct" ]; then
    echo "🌐 Usando conexión directa (IP pública)..."
    
    read -sp "Contraseña para $DB_USER: " DB_PASSWORD
    echo ""
    
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@35.188.67.177:5432/$DB_NAME"
    
elif [ "$METHOD" == "local" ]; then
    echo "💻 Usando base de datos local..."
    
    export DATABASE_URL="postgresql://$DB_USER:password@localhost:5432/$DB_NAME"
    
else
    echo "❌ Método inválido. Usa 'proxy', 'direct' o 'local'"
    exit 1
fi

echo "📦 Ejecutando migraciones..."
npx prisma migrate deploy

echo "🔧 Generando cliente Prisma..."
npx prisma generate

echo "✅ Migraciones completadas!"

