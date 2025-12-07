#!/bin/bash

# Script para subir el proyecto a Git
# Ejecutar: bash deploy-to-git.sh

set -e

echo "🚀 Preparando para subir a Git..."

# Navegar al directorio del proyecto
cd "$(dirname "$0")"

# Verificar si Git está inicializado
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    git branch -M main
fi

# Verificar estado
echo "📊 Estado actual del repositorio:"
git status

# Agregar todos los archivos
echo "➕ Agregando archivos..."
git add .

# Verificar qué se va a commitear
echo ""
echo "📝 Archivos que se van a commitear:"
git status --short

# Hacer commit
echo ""
read -p "¿Deseas hacer commit? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "Mensaje del commit (Enter para usar mensaje por defecto): " commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Initial commit: Sermaluc Gestión de Servicios"
    fi
    git commit -m "$commit_message"
    echo "✅ Commit realizado"
else
    echo "❌ Commit cancelado"
    exit 1
fi

# Verificar remotes
echo ""
echo "🔗 Remotes configurados:"
git remote -v

# Agregar remote si no existe
if [ -z "$(git remote -v)" ]; then
    echo ""
    echo "⚠️  No hay remotes configurados"
    echo ""
    echo "Para agregar un remote, ejecuta uno de estos comandos:"
    echo ""
    echo "Para GitHub:"
    echo "  git remote add origin https://github.com/USUARIO/REPOSITORIO.git"
    echo ""
    echo "Para Cloud Source Repositories:"
    echo "  git remote add google https://source.developers.google.com/p/PROJECT_ID/r/sermaluc-gestion-servicios"
    echo ""
    read -p "¿Deseas agregar un remote ahora? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo ""
        echo "Selecciona el tipo de remote:"
        echo "1) GitHub"
        echo "2) Cloud Source Repositories"
        read -p "Opción (1 o 2): " remote_type
        
        if [ "$remote_type" == "1" ]; then
            read -p "URL del repositorio GitHub: " github_url
            git remote add origin "$github_url"
            echo "✅ Remote 'origin' agregado"
        elif [ "$remote_type" == "2" ]; then
            read -p "PROJECT_ID de GCP: " project_id
            git remote add google "https://source.developers.google.com/p/${project_id}/r/sermaluc-gestion-servicios"
            echo "✅ Remote 'google' agregado"
        fi
    fi
fi

# Push
echo ""
read -p "¿Deseas hacer push? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    # Detectar qué remote usar
    if git remote | grep -q "origin"; then
        echo "📤 Haciendo push a origin (GitHub)..."
        git push -u origin main
    elif git remote | grep -q "google"; then
        echo "📤 Haciendo push a google (Cloud Source Repositories)..."
        git push -u google main
    else
        echo "⚠️  No se encontró ningún remote. Configura uno primero."
        exit 1
    fi
    echo "✅ Push completado"
else
    echo "❌ Push cancelado"
    echo ""
    echo "Para hacer push manualmente, ejecuta:"
    echo "  git push -u origin main    # Para GitHub"
    echo "  git push -u google main   # Para Cloud Source Repositories"
fi

echo ""
echo "✨ Proceso completado!"

