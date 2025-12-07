# Guía de Deployment a GCP vía Git

Esta guía te llevará paso a paso para desplegar el sistema Sermaluc Gestión de Servicios en Google Cloud Platform usando Git.

## Prerrequisitos

1. **Cuenta de Google Cloud Platform** con facturación habilitada
2. **Google Cloud SDK (gcloud)** instalado y configurado
3. **Git** instalado
4. **Repositorio Git** (GitHub, GitLab, o Cloud Source Repositories)

## Paso 1: Configurar el Proyecto GCP

### 1.1 Crear/Seleccionar Proyecto

```bash
# Listar proyectos existentes
gcloud projects list

# Crear nuevo proyecto (si es necesario)
gcloud projects create sermaluc-gestion --name="Sermaluc Gestión de Servicios"

# Seleccionar el proyecto
gcloud config set project sermaluc-gestion

# O usar el PROJECT_ID existente
gcloud config set project YOUR_PROJECT_ID
```

### 1.2 Habilitar APIs Necesarias

```bash
# Habilitar todas las APIs requeridas
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  artifactregistry.googleapis.com \
  sourcerepo.googleapis.com
```

## Paso 2: Configurar Cloud SQL

### 2.1 Crear Instancia Cloud SQL (si no existe)

```bash
# Crear instancia PostgreSQL
gcloud sql instances create nomina-sql \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD

# Crear base de datos
gcloud sql databases create sermaluc_db --instance=nomina-sql

# Obtener información de conexión
gcloud sql instances describe nomina-sql --format="value(connectionName)"
```

### 2.2 Configurar Usuario de Base de Datos

```bash
# Crear usuario
gcloud sql users create sermaluc_user \
  --instance=nomina-sql \
  --password=YOUR_DB_PASSWORD
```

## Paso 3: Configurar Secret Manager

### 3.1 Crear Secretos

```bash
# Obtener PROJECT_ID
PROJECT_ID=$(gcloud config get-value project)

# Crear secret para DATABASE_URL
echo "postgresql://sermaluc_user:YOUR_DB_PASSWORD@/sermaluc_db?host=/cloudsql/${PROJECT_ID}:us-central1:nomina-sql" | \
  gcloud secrets create database-url --data-file=-

# Crear secret para Google Service Account Key
gcloud secrets create google-service-account-key \
  --data-file=path/to/your/service-account-key.json

# Crear secret para FRONTEND_URL (se actualizará después del deploy)
echo "https://gestion-frontend-XXXXX.run.app" | \
  gcloud secrets create frontend-url --data-file=-

# Crear secret para NEXT_PUBLIC_API_URL (se actualizará después del deploy)
echo "https://gestion-backend-XXXXX.run.app" | \
  gcloud secrets create next-public-api-url --data-file=-
```

### 3.2 Dar Permisos a Cloud Build

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Dar permisos para acceder a secretos
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding google-service-account-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding frontend-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding next-public-api-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Paso 4: Configurar Artifact Registry

### 4.1 Crear Repositorio Docker

```bash
# Crear repositorio para imágenes Docker
gcloud artifacts repositories create sermaluc-apps \
  --repository-format=docker \
  --location=us-central1 \
  --description="Sermaluc applications Docker repository"
```

## Paso 5: Configurar Repositorio Git

### Opción A: Usar Cloud Source Repositories

```bash
# Crear repositorio en Cloud Source Repositories
gcloud source repos create sermaluc-gestion-servicios

# Agregar remote
git remote add google https://source.developers.google.com/p/$PROJECT_ID/r/sermaluc-gestion-servicios

# Push inicial
git push google main
```

### Opción B: Usar GitHub/GitLab

1. Crear repositorio en GitHub/GitLab
2. Conectar el repositorio local:

```bash
git remote add origin https://github.com/USERNAME/sermaluc-gestion-servicios.git
git branch -M main
git push -u origin main
```

## Paso 6: Configurar Cloud Build

### 6.1 Crear Trigger de Cloud Build

#### Para Cloud Source Repositories:

```bash
gcloud builds triggers create cloud-source-repositories \
  --name="sermaluc-deploy" \
  --repo="sermaluc-gestion-servicios" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region=us-central1
```

#### Para GitHub:

```bash
# Conectar repositorio GitHub a Cloud Build
gcloud builds triggers create github \
  --name="sermaluc-deploy" \
  --repo-name="sermaluc-gestion-servicios" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region=us-central1
```

### 6.2 Dar Permisos a Cloud Build

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Dar permisos para desplegar en Cloud Run
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

# Dar permisos para acceder a Artifact Registry
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Dar permisos para acceder a Cloud SQL
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

## Paso 7: Preparar el Código para Git

### 7.1 Inicializar Repositorio Git (si no está inicializado)

```bash
cd "/Users/simoniribarren/Library/Mobile Documents/com~apple~CloudDocs/sermaluc-gestion-servicios"

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit: Sermaluc Gestión de Servicios"
```

### 7.2 Verificar .gitignore

Asegúrate de que `.gitignore` incluya:
- `node_modules/`
- `.env*`
- `*.log`
- Archivos de service account keys

## Paso 8: Actualizar cloudbuild.yaml

Verifica que `cloudbuild.yaml` tenga las referencias correctas a los secretos:

```yaml
# El archivo ya está configurado, pero verifica que los nombres de secretos coincidan
```

## Paso 9: Hacer Push y Desplegar

### 9.1 Push a Git

```bash
# Si usas Cloud Source Repositories
git push google main

# Si usas GitHub/GitLab
git push origin main
```

### 9.2 Monitorear el Build

```bash
# Ver builds en progreso
gcloud builds list --ongoing

# Ver logs del último build
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")
```

## Paso 10: Obtener URLs y Actualizar Secretos

### 10.1 Obtener URLs de los Servicios Desplegados

```bash
# URL del backend
BACKEND_URL=$(gcloud run services describe gestion-backend \
  --region=us-central1 \
  --format="value(status.url)")

# URL del frontend
FRONTEND_URL=$(gcloud run services describe gestion-frontend \
  --region=us-central1 \
  --format="value(status.url)")

echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
```

### 10.2 Actualizar Secretos con URLs Reales

```bash
# Actualizar FRONTEND_URL
echo "$FRONTEND_URL" | gcloud secrets versions add frontend-url --data-file=-

# Actualizar NEXT_PUBLIC_API_URL
echo "$BACKEND_URL" | gcloud secrets versions add next-public-api-url --data-file=-
```

### 10.3 Redesplegar Frontend con Nueva URL

```bash
# Trigger manual del build o hacer push nuevamente
git commit --allow-empty -m "Update frontend with correct API URL"
git push google main  # o git push origin main
```

## Paso 11: Ejecutar Migraciones de Base de Datos

### 11.1 Usar Cloud SQL Proxy (Local)

```bash
# Descargar Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Conectar a Cloud SQL
./cloud-sql-proxy $PROJECT_ID:us-central1:nomina-sql

# En otra terminal, ejecutar migraciones
cd backend
export DATABASE_URL="postgresql://sermaluc_user:YOUR_DB_PASSWORD@127.0.0.1:5432/sermaluc_db"
npx prisma migrate deploy
npx prisma generate
```

### 11.2 O Usar Cloud Shell

```bash
# Conectar a Cloud Shell y ejecutar migraciones desde ahí
gcloud sql connect nomina-sql --user=sermaluc_user
```

## Paso 12: Configurar Cloud Scheduler

### 12.1 Crear Job de Sincronización

```bash
# Obtener URL del backend
BACKEND_URL=$(gcloud run services describe gestion-backend \
  --region=us-central1 \
  --format="value(status.url)")

# Crear job de Cloud Scheduler (cada 6 horas)
gcloud scheduler jobs create http sync-collaborators \
  --schedule="0 */6 * * *" \
  --uri="${BACKEND_URL}/internal/sync/collaborators" \
  --http-method=POST \
  --oidc-service-account-email=${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --location=us-central1 \
  --time-zone="America/Santiago"
```

### 12.2 Dar Permisos al Service Account

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Dar permisos para invocar Cloud Run
gcloud run services add-iam-policy-binding gestion-backend \
  --region=us-central1 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker"
```

## Paso 13: Verificación Final

### 13.1 Verificar Servicios

```bash
# Listar servicios Cloud Run
gcloud run services list --region=us-central1

# Ver logs del backend
gcloud run services logs read gestion-backend --region=us-central1 --limit=50

# Ver logs del frontend
gcloud run services logs read gestion-frontend --region=us-central1 --limit=50
```

### 13.2 Probar Endpoints

```bash
# Probar health check del backend
curl https://gestion-backend-XXXXX.run.app/internal/sync/health

# Abrir frontend en navegador
open https://gestion-frontend-XXXXX.run.app
```

## Paso 14: Configuración Continua

### 14.1 Workflow de Desarrollo

1. **Hacer cambios localmente**
2. **Commit y push a Git**
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push origin main  # o git push google main
   ```
3. **Cloud Build se ejecuta automáticamente**
4. **Los servicios se actualizan automáticamente**

### 14.2 Variables de Entorno Adicionales

Si necesitas agregar más variables de entorno:

```bash
# Crear nuevo secret
echo "valor" | gcloud secrets create nombre-secret --data-file=-

# Actualizar cloudbuild.yaml para incluir el secret
# Luego hacer push
```

## Troubleshooting

### Error: "Permission denied" en Cloud Build

```bash
# Verificar permisos del service account
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:*cloudbuild*"
```

### Error: "Secret not found"

```bash
# Listar secretos
gcloud secrets list

# Verificar permisos
gcloud secrets get-iam-policy nombre-secret
```

### Error: "Cloud SQL connection failed"

```bash
# Verificar que la instancia existe
gcloud sql instances list

# Verificar conexión desde Cloud Run
gcloud run services describe gestion-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Re-desplegar Manualmente

```bash
# Trigger manual del build
gcloud builds triggers run sermaluc-deploy --branch=main
```

## Comandos Útiles

```bash
# Ver estado de builds
gcloud builds list

# Ver detalles de un build
gcloud builds describe BUILD_ID

# Ver logs en tiempo real
gcloud builds log --stream BUILD_ID

# Ver servicios Cloud Run
gcloud run services list

# Ver detalles de un servicio
gcloud run services describe SERVICE_NAME --region=us-central1

# Ver logs de Cloud Run
gcloud run services logs read SERVICE_NAME --region=us-central1

# Actualizar un servicio manualmente
gcloud run deploy SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/sermaluc-apps/SERVICE_NAME:latest \
  --region us-central1
```

## Checklist Final

- [ ] Proyecto GCP creado y seleccionado
- [ ] APIs habilitadas
- [ ] Cloud SQL instancia creada
- [ ] Secretos creados en Secret Manager
- [ ] Artifact Registry configurado
- [ ] Repositorio Git configurado
- [ ] Cloud Build trigger creado
- [ ] Permisos configurados
- [ ] Código pusheado a Git
- [ ] Build ejecutado exitosamente
- [ ] Servicios desplegados en Cloud Run
- [ ] URLs obtenidas y secretos actualizados
- [ ] Migraciones de base de datos ejecutadas
- [ ] Cloud Scheduler configurado
- [ ] Servicios verificados y funcionando

## Soporte

Para problemas adicionales, revisa:
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

