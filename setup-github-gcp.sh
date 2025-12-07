#!/bin/bash

# Script para configurar la integración GitHub -> GCP Cloud Build
# Este script automatiza la configuración de triggers y permisos

set -e

PROJECT_ID="sermaluc-gestion-servicios"
REGION="us-central1"
REPO_OWNER="siribarren"
REPO_NAME="sermaluc-gestion-servicios"
TRIGGER_NAME="sermaluc-deploy"

echo "🚀 Configurando integración GitHub -> GCP Cloud Build"
echo "=================================================="

# Paso 1: Configurar proyecto
echo ""
echo "📋 Paso 1: Configurando proyecto GCP..."
gcloud config set project $PROJECT_ID || {
  echo "   ❌ Error: No se pudo configurar el proyecto"
  echo "   Verifica que tengas acceso al proyecto: $PROJECT_ID"
  echo "   Verifica que el proyecto exista: gcloud projects list"
  exit 1
}

# Verificar acceso al proyecto
echo "   Verificando acceso al proyecto..."
gcloud projects describe $PROJECT_ID --quiet > /dev/null 2>&1 || {
  echo "   ❌ Error: No tienes acceso al proyecto $PROJECT_ID"
  echo "   Necesitas permisos en el proyecto o que un administrador te otorgue acceso"
  echo "   Contacta al administrador del proyecto para obtener permisos"
  exit 1
}
echo "   ✅ Acceso al proyecto verificado"

# Paso 2: Habilitar APIs
echo ""
echo "📋 Paso 2: Habilitando APIs necesarias..."
echo "   Habilitando APIs esenciales..."

# APIs esenciales (requeridas)
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  --quiet || {
  echo "   ⚠️  Error habilitando APIs esenciales. Verifica permisos."
  echo "   Necesitas el rol: roles/serviceusage.serviceUsageAdmin"
  exit 1
}

# API opcional (solo si usas Cloud Source Repositories, no necesario para GitHub)
echo "   Habilitando API opcional (sourcerepo)..."
gcloud services enable sourcerepo.googleapis.com --quiet 2>/dev/null || {
  echo "   ⚠️  sourcerepo.googleapis.com no disponible o no necesario (usando GitHub)"
}

echo "✅ APIs habilitadas"

# Paso 3: Obtener PROJECT_NUMBER
echo ""
echo "📋 Paso 3: Obteniendo PROJECT_NUMBER..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "   PROJECT_NUMBER: $PROJECT_NUMBER"

# Paso 4: Configurar permisos IAM para Cloud Build
echo ""
echo "📋 Paso 4: Configurando permisos IAM para Cloud Build..."
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "   Otorgando roles/run.admin..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin" \
  --condition=None \
  --quiet || echo "   ⚠️  Permiso ya existe"

echo "   Otorgando roles/artifactregistry.writer..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None \
  --quiet || echo "   ⚠️  Permiso ya existe"

echo "   Otorgando roles/cloudsql.client..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/cloudsql.client" \
  --condition=None \
  --quiet || echo "   ⚠️  Permiso ya existe"

echo "   Otorgando roles/iam.serviceAccountUser..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None \
  --quiet || echo "   ⚠️  Permiso ya existe"

# Paso 5: Configurar permisos para Secret Manager
echo ""
echo "📋 Paso 5: Configurando permisos para Secret Manager..."

# Verificar si el secret existe
if gcloud secrets describe backend-database-url --quiet > /dev/null 2>&1; then
  echo "   Otorgando acceso a backend-database-url..."
  gcloud secrets add-iam-policy-binding backend-database-url \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet || echo "   ⚠️  Permiso ya existe"
else
  echo "   ⚠️  Secret 'backend-database-url' no existe. Créalo primero."
fi

if gcloud secrets describe google-service-account-key --quiet > /dev/null 2>&1; then
  echo "   Otorgando acceso a google-service-account-key..."
  gcloud secrets add-iam-policy-binding google-service-account-key \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet || echo "   ⚠️  Permiso ya existe"
else
  echo "   ⚠️  Secret 'google-service-account-key' no existe. Créalo primero."
fi

# Paso 6: Crear Artifact Registry si no existe
echo ""
echo "📋 Paso 6: Verificando Artifact Registry..."
if ! gcloud artifacts repositories describe sermaluc-apps --location=$REGION --quiet > /dev/null 2>&1; then
  echo "   Creando repositorio sermaluc-apps..."
  gcloud artifacts repositories create sermaluc-apps \
    --repository-format=docker \
    --location=$REGION \
    --description="Sermaluc applications Docker repository" \
    --quiet
  echo "   ✅ Repositorio creado"
else
  echo "   ✅ Repositorio ya existe"
fi

# Paso 7: Verificar conexión con GitHub
echo ""
echo "📋 Paso 7: Verificando conexión con GitHub..."
echo "   ⚠️  IMPORTANTE: Debes conectar el repositorio manualmente desde la consola web:"
echo "   https://console.cloud.google.com/cloud-build/triggers?project=${PROJECT_ID}"
echo ""
echo "   Pasos:"
echo "   1. Click en 'CONECTAR REPOSITORIO'"
echo "   2. Selecciona 'GitHub (Cloud Build GitHub App)'"
echo "   3. Autoriza la aplicación"
echo "   4. Selecciona: ${REPO_OWNER}/${REPO_NAME}"
echo "   5. Click en 'CONECTAR'"
echo ""

# Paso 8: Crear o actualizar trigger
echo ""
echo "📋 Paso 8: Creando/actualizando trigger de Cloud Build..."
echo "   ⚠️  NOTA: El trigger se creará después de conectar el repositorio"
echo ""
echo "   Para crear el trigger manualmente, ejecuta:"
echo ""
echo "   gcloud builds triggers create github \\"
echo "     --name=\"${TRIGGER_NAME}\" \\"
echo "     --repo-name=\"${REPO_NAME}\" \\"
echo "     --repo-owner=\"${REPO_OWNER}\" \\"
echo "     --branch-pattern=\"^main$\" \\"
echo "     --build-config=\"cloudbuild.yaml\" \\"
echo "     --region=\"${REGION}\" \\"
echo "     --substitutions=_DATABASE_URL=\$(gcloud secrets versions access latest --secret=backend-database-url),_FRONTEND_URL=\"https://placeholder.run.app\",_NEXT_PUBLIC_API_URL=\"https://placeholder.run.app\""
echo ""

# Paso 9: Resumen
echo ""
echo "✅ Configuración completada"
echo "=================================================="
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Conecta el repositorio GitHub desde la consola web:"
echo "   https://console.cloud.google.com/cloud-build/triggers?project=${PROJECT_ID}"
echo ""
echo "2. Crea el trigger (o usa el comando de arriba)"
echo ""
echo "3. Verifica que los secrets existan:"
echo "   - backend-database-url"
echo "   - google-service-account-key"
echo ""
echo "4. Haz push a GitHub para trigger el build:"
echo "   git push origin main"
echo ""
echo "5. Monitorea el build:"
echo "   gcloud builds list --limit=5"
echo ""

