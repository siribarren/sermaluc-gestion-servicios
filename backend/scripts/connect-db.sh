#!/bin/bash

# Script para conectar a la base de datos Cloud SQL
# Uso: bash scripts/connect-db.sh [proxy|direct]

set -e

METHOD=${1:-proxy}

CONNECTION_NAME="sermaluc-gestion-servicios:us-central1:nomina-sql"
DB_NAME="db-nomina"
DB_USER="sermaluc-db"
DB_HOST="127.0.0.1"
DB_PORT="5432"

echo "🔌 Conectando a Cloud SQL..."

if [ "$METHOD" == "proxy" ]; then
    echo "📡 Usando Cloud SQL Proxy..."
    
    # Verificar si cloud-sql-proxy existe
    if [ ! -f "./cloud-sql-proxy" ]; then
        echo "📥 Descargando Cloud SQL Proxy..."
        curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
        chmod +x cloud-sql-proxy
    fi
    
    echo "🚀 Iniciando Cloud SQL Proxy..."
    echo "   Connection: $CONNECTION_NAME"
    echo "   Puerto local: $DB_PORT"
    echo ""
    echo "⚠️  Deja esta terminal abierta y abre otra terminal para ejecutar comandos"
    echo ""
    
    ./cloud-sql-proxy $CONNECTION_NAME
    
elif [ "$METHOD" == "direct" ]; then
    echo "🌐 Usando conexión directa (IP pública)..."
    echo "   IP: 35.188.67.177"
    echo "   Puerto: $DB_PORT"
    echo ""
    echo "⚠️  Asegúrate de que tu IP esté autorizada en Cloud SQL"
    echo ""
    
    read -sp "Contraseña para $DB_USER: " DB_PASSWORD
    echo ""
    
    export PGPASSWORD="$DB_PASSWORD"
    psql -h 35.188.67.177 -p $DB_PORT -U $DB_USER -d $DB_NAME
    
else
    echo "❌ Método inválido. Usa 'proxy' o 'direct'"
    exit 1
fi

