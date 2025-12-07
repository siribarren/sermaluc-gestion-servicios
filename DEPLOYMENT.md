# Guía de Deployment - Sermaluc Gestión de Servicios

Esta guía describe el proceso de deployment del sistema en Google Cloud Platform.

## Prerrequisitos

1. Cuenta de Google Cloud Platform con facturación habilitada
2. Cloud SQL instance `nomina-sql` creada
3. APIs habilitadas:
   - Cloud Run API
   - Cloud Build API
   - Cloud SQL Admin API
   - Secret Manager API
   - Cloud Scheduler API
   - Artifact Registry API

## Configuración Inicial

### 1. Configurar Secret Manager

```bash
# Crear secretos en Secret Manager
gcloud secrets create google-service-account-key \
  --data-file=path/to/service-account-key.json

gcloud secrets create database-url \
  --data-file=path/to/database-url.txt

gcloud secrets create frontend-url \
  --data-file=path/to/frontend-url.txt

gcloud secrets create next-public-api-url \
  --data-file=path/to/next-public-api-url.txt
```

### 2. Configurar Artifact Registry

```bash
# Crear repositorio Docker
gcloud artifacts repositories create sermaluc-apps \
  --repository-format=docker \
  --location=us-central1 \
  --description="Sermaluc applications Docker repository"
```

### 3. Configurar Cloud Build

```bash
# Conectar repositorio (si usas Cloud Source Repositories o GitHub)
gcloud builds triggers create github \
  --name="sermaluc-gestion-deploy" \
  --repo-name="sermaluc-gestion-servicios" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

## Deployment Manual

### Backend

```bash
# Build y push de imagen
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/sermaluc-apps/gestion-backend:latest

# Deploy a Cloud Run
gcloud run deploy gestion-backend \
  --image gcr.io/PROJECT_ID/sermaluc-apps/gestion-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:us-central1:nomina-sql \
  --set-env-vars DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url) \
  --set-env-vars FRONTEND_URL=$(gcloud secrets versions access latest --secret=frontend-url) \
  --set-secrets GOOGLE_SERVICE_ACCOUNT_KEY=google-service-account-key:latest
```

### Frontend

```bash
# Build y push de imagen
cd frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/sermaluc-apps/gestion-frontend:latest

# Deploy a Cloud Run
gcloud run deploy gestion-frontend \
  --image gcr.io/PROJECT_ID/sermaluc-apps/gestion-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=$(gcloud secrets versions access latest --secret=next-public-api-url)
```

## Configurar Cloud Scheduler

```bash
# Obtener URL del backend
BACKEND_URL=$(gcloud run services describe gestion-backend --region us-central1 --format 'value(status.url)')

# Crear job de Cloud Scheduler
gcloud scheduler jobs create http sync-collaborators \
  --schedule="0 */6 * * *" \
  --uri="${BACKEND_URL}/internal/sync/collaborators" \
  --http-method=POST \
  --oidc-service-account-email=PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --location=us-central1
```

## Migraciones de Base de Datos

### Ejecutar migraciones en Cloud SQL

```bash
# Conectar a Cloud SQL
gcloud sql connect nomina-sql --user=postgres

# O ejecutar migraciones desde local con Cloud SQL Proxy
cloud-sql-proxy PROJECT_ID:us-central1:nomina-sql

# En otra terminal
cd backend
export DATABASE_URL="postgresql://user:password@127.0.0.1:5432/dbname"
npx prisma migrate deploy
```

## Verificación

1. Verificar que los servicios estén corriendo:
```bash
gcloud run services list --region us-central1
```

2. Probar endpoints:
```bash
# Backend health
curl https://gestion-backend-XXXXX.run.app/internal/sync/health

# Frontend
curl https://gestion-frontend-XXXXX.run.app
```

3. Verificar logs:
```bash
gcloud run services logs read gestion-backend --region us-central1
gcloud run services logs read gestion-frontend --region us-central1
```

## Troubleshooting

### Error de conexión a Cloud SQL

- Verificar que la instancia Cloud SQL tenga la IP del Cloud Run permitida
- Verificar que se haya configurado `--add-cloudsql-instances` correctamente
- Usar Cloud SQL Proxy para desarrollo local

### Error de autenticación con Google Sheets

- Verificar que el service account tenga acceso a las hojas
- Verificar que el secret esté correctamente configurado
- Revisar logs del backend para errores específicos

### Error de build en Cloud Build

- Verificar que todas las dependencias estén en package.json
- Verificar que los Dockerfiles estén correctos
- Revisar logs de Cloud Build en la consola

## Actualización

Para actualizar el sistema:

1. Hacer push a la rama principal (si está configurado CI/CD)
2. O ejecutar manualmente:
```bash
gcloud builds submit --config cloudbuild.yaml
```

