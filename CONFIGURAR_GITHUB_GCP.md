# Configurar Integración GitHub con GCP Cloud Build

Esta guía te ayudará a conectar tu repositorio de GitHub con Google Cloud Build para deployment automático.

## Prerrequisitos

- Repositorio en GitHub: `https://github.com/siribarren/sermaluc-gestion-servicios`
- Proyecto GCP: `sermaluc-gestion-servicios`
- APIs habilitadas en GCP

## Paso 1: Habilitar APIs Necesarias

```bash
# Seleccionar proyecto
gcloud config set project sermaluc-gestion-servicios

# Habilitar APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  sourcerepo.googleapis.com
```

## Paso 2: Conectar GitHub a Cloud Build

### Opción A: Desde la Consola Web (Recomendado)

1. **Ir a Cloud Build**
   - Ve a: https://console.cloud.google.com/cloud-build/triggers
   - Selecciona el proyecto `sermaluc-gestion-servicios`

2. **Conectar Repositorio**
   - Click en "CONECTAR REPOSITORIO" o "CONNECT REPOSITORY"
   - Selecciona "GitHub (Cloud Build GitHub App)"
   - Autoriza la aplicación de Cloud Build
   - Selecciona tu repositorio: `siribarren/sermaluc-gestion-servicios`
   - Click en "CONECTAR"

3. **Crear Trigger**
   - Click en "CREAR TRIGGER" o "CREATE TRIGGER"
   - **Nombre**: `sermaluc-deploy`
   - **Evento**: Push a una rama
   - **Rama**: `^main$`
   - **Configuración**: Archivo de configuración de Cloud Build
   - **Ubicación del archivo**: `cloudbuild.yaml`
   - **Región**: `us-central1`
   - Click en "CREAR"

### Opción B: Desde la Terminal

```bash
# 1. Conectar repositorio GitHub (primera vez)
gcloud builds triggers create github \
  --name="sermaluc-deploy" \
  --repo-name="sermaluc-gestion-servicios" \
  --repo-owner="siribarren" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region="us-central1"
```

**Nota**: La primera vez necesitarás autorizar la aplicación de Cloud Build desde la consola web.

## Paso 3: Dar Permisos a Cloud Build

```bash
# Obtener PROJECT_NUMBER
PROJECT_NUMBER=$(gcloud projects describe sermaluc-gestion-servicios --format="value(projectNumber)")

# Dar permisos para desplegar en Cloud Run
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

# Dar permisos para acceder a Artifact Registry
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Dar permisos para acceder a Secret Manager
gcloud secrets add-iam-policy-binding backend-database-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding google-service-account-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Dar permisos para acceder a Cloud SQL
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

## Paso 4: Configurar Variables de Sustitución en Cloud Build

Las variables `$$DATABASE_URL`, `$$FRONTEND_URL`, y `$$NEXT_PUBLIC_API_URL` necesitan estar configuradas en el trigger.

**IMPORTANTE**: En Cloud Build, las variables de sustitución usan el prefijo `_` (underscore), no `$`. Entonces `$$DATABASE_URL` en el YAML se refiere a `_DATABASE_URL` en el trigger.

### Opción A: Desde la Consola Web (Recomendado)

1. Ve a Cloud Build Triggers: https://console.cloud.google.com/cloud-build/triggers
2. Click en el trigger `sermaluc-deploy` (o créalo si no existe)
3. Click en "EDITAR" o "EDIT"
4. Ve a la sección "Variables de sustitución" o "Substitution variables"
5. Agrega las siguientes variables:
   - `_DATABASE_URL`: Obtener del secret con: `gcloud secrets versions access latest --secret=backend-database-url`
   - `_FRONTEND_URL`: URL temporal (ej: `https://placeholder.run.app`), se actualizará después del deploy
   - `_NEXT_PUBLIC_API_URL`: URL temporal (ej: `https://placeholder.run.app`), se actualizará después del deploy

### Opción B: Desde la Terminal

```bash
# Obtener DATABASE_URL del secret
DATABASE_URL=$(gcloud secrets versions access latest --secret=backend-database-url)

# Crear trigger con variables de sustitución
gcloud builds triggers create github \
  --name="sermaluc-deploy" \
  --repo-name="sermaluc-gestion-servicios" \
  --repo-owner="siribarren" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region="us-central1" \
  --substitutions=_DATABASE_URL="${DATABASE_URL}",_FRONTEND_URL="https://placeholder.run.app",_NEXT_PUBLIC_API_URL="https://placeholder.run.app"
```

### Opción C: Actualizar Trigger Existente

```bash
# Obtener DATABASE_URL del secret
DATABASE_URL=$(gcloud secrets versions access latest --secret=backend-database-url)

# Actualizar trigger existente
gcloud builds triggers update github sermaluc-deploy \
  --substitutions=_DATABASE_URL="${DATABASE_URL}",_FRONTEND_URL="https://placeholder.run.app",_NEXT_PUBLIC_API_URL="https://placeholder.run.app"
```

## Paso 5: Verificar Configuración

```bash
# Listar triggers
gcloud builds triggers list

# Ver detalles del trigger
gcloud builds triggers describe sermaluc-deploy

# Ver builds recientes
gcloud builds list --limit=5
```

## Paso 6: Probar el Deployment

### Opción A: Trigger Manual

```bash
# Ejecutar el trigger manualmente
gcloud builds triggers run sermaluc-deploy --branch=main
```

### Opción B: Push a GitHub

```bash
# Hacer un commit vacío para trigger el build
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

## Paso 7: Monitorear el Build

```bash
# Ver builds en progreso
gcloud builds list --ongoing

# Ver logs del último build
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")

# Ver en tiempo real
gcloud builds log --stream $(gcloud builds list --limit=1 --format="value(id)")
```

## Paso 8: Obtener URLs y Actualizar Secrets

Después del primer deployment exitoso:

```bash
# Obtener URL del backend
BACKEND_URL=$(gcloud run services describe gestion-backend \
  --region=us-central1 \
  --format="value(status.url)")

# Obtener URL del frontend
FRONTEND_URL=$(gcloud run services describe gestion-frontend \
  --region=us-central1 \
  --format="value(status.url)")

echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"

# Actualizar secrets
echo "$FRONTEND_URL" | gcloud secrets versions add frontend-url --data-file=-
echo "$BACKEND_URL" | gcloud secrets versions add next-public-api-url --data-file=-
```

## Troubleshooting

### Error: "Repository not found"
- Verifica que el repositorio esté conectado en Cloud Build
- Verifica que tengas permisos en el repositorio de GitHub

### Error: "Permission denied" en Cloud Build
- Verifica que los permisos IAM estén configurados (Paso 3)

### Error: "Secret not found"
- Verifica que los secrets existan en Secret Manager
- Verifica que Cloud Build tenga permisos para leerlos

### Error: "Cloud SQL connection failed"
- Verifica que `--add-cloudsql-instances` esté configurado correctamente
- Verifica que la instancia Cloud SQL exista

## Comandos Útiles

```bash
# Ver estado de todos los triggers
gcloud builds triggers list

# Ver historial de builds
gcloud builds list --limit=10

# Ver detalles de un build específico
gcloud builds describe BUILD_ID

# Cancelar un build en progreso
gcloud builds cancel BUILD_ID

# Ver logs de un servicio Cloud Run
gcloud run services logs read gestion-backend --region=us-central1 --limit=50
```

## Checklist de Configuración

- [ ] APIs habilitadas
- [ ] Repositorio GitHub conectado a Cloud Build
- [ ] Trigger creado para rama `main`
- [ ] Permisos IAM configurados para Cloud Build
- [ ] Secrets configurados en Secret Manager
- [ ] Permisos de Secret Manager dados a Cloud Build
- [ ] cloudbuild.yaml configurado correctamente
- [ ] Primer build ejecutado exitosamente
- [ ] URLs obtenidas y secrets actualizados

