#!/bin/bash

# Script para configurar la base de datos
# Uso: bash scripts/setup-database.sh [local|cloud]

set -e

ENV=${1:-local}

echo "🗄️  Configurando base de datos para: $ENV"

if [ "$ENV" == "cloud" ]; then
    echo "☁️  Configuración para Cloud SQL"
    
    # Verificar que gcloud esté instalado
    if ! command -v gcloud &> /dev/null; then
        echo "❌ Error: gcloud no está instalado"
        exit 1
    fi
    
    PROJECT_ID=$(gcloud config get-value project)
    if [ -z "$PROJECT_ID" ]; then
        echo "❌ Error: No hay proyecto GCP configurado"
        echo "Ejecuta: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    echo "📋 PROJECT_ID: $PROJECT_ID"
    
    # Verificar si la instancia existe
    if ! gcloud sql instances describe nomina-sql &> /dev/null; then
        echo "📦 Creando instancia Cloud SQL..."
        read -sp "Ingresa la contraseña para el usuario root: " ROOT_PASSWORD
        echo
        
        gcloud sql instances create nomina-sql \
            --database-version=POSTGRES_14 \
            --tier=db-f1-micro \
            --region=us-central1 \
            --root-password="$ROOT_PASSWORD" \
            --storage-type=SSD \
            --storage-size=20GB \
            --storage-auto-increase
        
        echo "✅ Instancia creada"
    else
        echo "✅ Instancia ya existe"
    fi
    
    # Crear base de datos
    if ! gcloud sql databases describe sermaluc_db --instance=nomina-sql &> /dev/null; then
        echo "📦 Creando base de datos..."
        gcloud sql databases create sermaluc_db --instance=nomina-sql
        echo "✅ Base de datos creada"
    else
        echo "✅ Base de datos ya existe"
    fi
    
    # Crear usuario
    echo "👤 Configurando usuario..."
    read -sp "Ingresa la contraseña para sermaluc_user: " USER_PASSWORD
    echo
    
    if gcloud sql users describe sermaluc_user --instance=nomina-sql &> /dev/null; then
        echo "⚠️  Usuario ya existe, actualizando contraseña..."
        gcloud sql users set-password sermaluc_user \
            --instance=nomina-sql \
            --password="$USER_PASSWORD"
    else
        gcloud sql users create sermaluc_user \
            --instance=nomina-sql \
            --password="$USER_PASSWORD"
    fi
    
    echo "✅ Usuario configurado"
    
    # Obtener connection name
    CONNECTION_NAME=$(gcloud sql instances describe nomina-sql \
        --format="value(connectionName)")
    
    echo ""
    echo "📝 Configura DATABASE_URL en tu .env:"
    echo "DATABASE_URL=\"postgresql://sermaluc_user:$USER_PASSWORD@/sermaluc_db?host=/cloudsql/$CONNECTION_NAME\""
    echo ""
    echo "Para desarrollo local con Cloud SQL Proxy:"
    echo "DATABASE_URL=\"postgresql://sermaluc_user:$USER_PASSWORD@127.0.0.1:5432/sermaluc_db\""
    
elif [ "$ENV" == "local" ]; then
    echo "💻 Configuración para PostgreSQL local"
    
    # Verificar que PostgreSQL esté instalado
    if ! command -v psql &> /dev/null; then
        echo "❌ Error: PostgreSQL no está instalado"
        echo "Instala PostgreSQL:"
        echo "  macOS: brew install postgresql@14"
        echo "  Linux: sudo apt install postgresql"
        exit 1
    fi
    
    # Verificar que PostgreSQL esté corriendo
    if ! pg_isready &> /dev/null; then
        echo "⚠️  PostgreSQL no está corriendo"
        echo "Iniciando PostgreSQL..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql@14 || brew services start postgresql
        else
            sudo systemctl start postgresql
        fi
    fi
    
    # Crear base de datos
    if psql -lqt | cut -d \| -f 1 | grep -qw sermaluc_db; then
        echo "✅ Base de datos ya existe"
    else
        echo "📦 Creando base de datos..."
        createdb sermaluc_db
        echo "✅ Base de datos creada"
    fi
    
    # Crear usuario (opcional, puede usar el usuario actual)
    echo ""
    echo "📝 Configura DATABASE_URL en tu .env:"
    echo "DATABASE_URL=\"postgresql://$(whoami)@localhost:5432/sermaluc_db\""
    echo ""
    echo "O si creaste un usuario específico:"
    echo "DATABASE_URL=\"postgresql://sermaluc_user:password@localhost:5432/sermaluc_db\""
    
else
    echo "❌ Error: Opción inválida. Usa 'local' o 'cloud'"
    exit 1
fi

echo ""
echo "✨ Configuración completada!"
echo ""
echo "Próximos pasos:"
echo "1. Configura DATABASE_URL en backend/.env"
echo "2. Ejecuta: cd backend && npx prisma migrate dev"
echo "3. Ejecuta: npx prisma generate"

