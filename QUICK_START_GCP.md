# Quick Start: Deployment a GCP

Guía rápida de los pasos esenciales para desplegar el sistema a GCP.

## Pasos Rápidos

### 1. Configurar Proyecto GCP

```bash
# Seleccionar proyecto
gcloud config set project YOUR_PROJECT_ID

# Habilitar APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  artifactregistry.googleapis.com
```

### 2. Crear Secretos

```bash
PROJECT_ID=$(gcloud config get-value project)

# DATABASE_URL
echo "postgresql://user:pass@/db?host=/cloudsql/${PROJECT_ID}:us-central1:nomina-sql" | \
  gcloud secrets create database-url --data-file=-

# Google Service Account Key
gcloud secrets create google-service-account-key \
  --data-file=path/to/service-account-key.json

# URLs (actualizar después del deploy)
echo "https://placeholder.run.app" | gcloud secrets create frontend-url --data-file=-
echo "https://placeholder.run.app" | gcloud secrets create next-public-api-url --data-file=-
```

### 3. Crear Artifact Registry

```bash
gcloud artifacts repositories create sermaluc-apps \
  --repository-format=docker \
  --location=us-central1
```

### 4. Configurar Git y Cloud Build

#### Opción A: GitHub

```bash
# Conectar repositorio GitHub
gcloud builds triggers create github \
  --name="sermaluc-deploy" \
  --repo-name="sermaluc-gestion-servicios" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

#### Opción B: Cloud Source Repositories

```bash
# Crear repositorio
gcloud source repos create sermaluc-gestion-servicios

# Agregar remote
git remote add google https://source.developers.google.com/p/$PROJECT_ID/r/sermaluc-gestion-servicios

# Push
git push google main
```

### 5. Dar Permisos a Cloud Build

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Permisos necesarios
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 6. Inicializar Git y Hacer Push

```bash
# Inicializar (si no está inicializado)
git init
git add .
git commit -m "Initial commit"

# Push a GitHub
git remote add origin https://github.com/USERNAME/repo.git
git push -u origin main

# O push a Cloud Source Repositories
git remote add google https://source.developers.google.com/p/$PROJECT_ID/r/sermaluc-gestion-servicios
git push google main
```

### 7. Monitorear Build

```bash
# Ver builds
gcloud builds list

# Ver logs
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")
```

### 8. Obtener URLs y Actualizar Secretos

```bash
# Obtener URLs
BACKEND_URL=$(gcloud run services describe gestion-backend \
  --region=us-central1 --format="value(status.url)")

FRONTEND_URL=$(gcloud run services describe gestion-frontend \
  --region=us-central1 --format="value(status.url)")

# Actualizar secretos
echo "$FRONTEND_URL" | gcloud secrets versions add frontend-url --data-file=-
echo "$BACKEND_URL" | gcloud secrets versions add next-public-api-url --data-file=-

# Redesplegar frontend
git commit --allow-empty -m "Update URLs"
git push origin main  # o git push google main
```

### 9. Ejecutar Migraciones

```bash
# Usar Cloud SQL Proxy localmente
./cloud-sql-proxy $PROJECT_ID:us-central1:nomina-sql

# En otra terminal
cd backend
export DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/db"
npx prisma migrate deploy
```

### 10. Configurar Cloud Scheduler

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud scheduler jobs create http sync-collaborators \
  --schedule="0 */6 * * *" \
  --uri="${BACKEND_URL}/internal/sync/collaborators" \
  --http-method=POST \
  --oidc-service-account-email=${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --location=us-central1
```

## Checklist

- [ ] Proyecto GCP configurado
- [ ] APIs habilitadas
- [ ] Secretos creados
- [ ] Artifact Registry creado
- [ ] Git configurado
- [ ] Cloud Build trigger creado
- [ ] Permisos configurados
- [ ] Código pusheado
- [ ] Build exitoso
- [ ] URLs obtenidas
- [ ] Migraciones ejecutadas
- [ ] Scheduler configurado

## Ver Documentación Completa

Para más detalles, ver `GCP_DEPLOYMENT.md`

