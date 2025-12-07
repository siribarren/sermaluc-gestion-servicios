# Sincronizar Repositorio GitHub con GCP

Esta guía te ayudará a configurar la integración completa entre tu repositorio de GitHub y Google Cloud Platform para deployment automático.

## 🎯 Objetivo

Configurar Cloud Build para que automáticamente:
1. Detecte cambios en la rama `main` de GitHub
2. Construya las imágenes Docker (backend y frontend)
3. Las suba a Artifact Registry
4. Despliegue los servicios en Cloud Run

## 📋 Checklist Pre-Deployment

Antes de comenzar, verifica que tengas:

- [ ] Repositorio en GitHub: `https://github.com/siribarren/sermaluc-gestion-servicios`
- [ ] Proyecto GCP: `sermaluc-gestion-servicios`
- [ ] Instancia Cloud SQL: `nomina-sql` en `us-central1`
- [ ] Base de datos: `db-nomina`
- [ ] Secret `backend-database-url` en Secret Manager
- [ ] Secret `google-service-account-key` en Secret Manager
- [ ] `gcloud` CLI instalado y autenticado

## 🚀 Pasos Rápidos (Automático)

### Opción 1: Usar Script Automatizado

```bash
# Ejecutar script de configuración
./setup-github-gcp.sh
```

Este script:
- ✅ Habilita las APIs necesarias
- ✅ Configura permisos IAM para Cloud Build
- ✅ Crea Artifact Registry si no existe
- ✅ Configura permisos para Secret Manager

**Después del script**, necesitas:
1. Conectar el repositorio GitHub desde la consola web
2. Crear el trigger de Cloud Build

### Opción 2: Configuración Manual

Sigue los pasos detallados en `CONFIGURAR_GITHUB_GCP.md`

## 📝 Pasos Detallados

### Paso 1: Verificar Cambios Locales

```bash
# Ver estado del repositorio
git status

# Si hay cambios, decidir si commitearlos
git add .
git commit -m "Preparar para deployment en GCP"
git push origin main
```

### Paso 2: Ejecutar Script de Configuración

```bash
# Dar permisos de ejecución
chmod +x setup-github-gcp.sh

# Ejecutar
./setup-github-gcp.sh
```

### Paso 3: Conectar Repositorio GitHub

**Desde la Consola Web** (Recomendado):

1. Ve a: https://console.cloud.google.com/cloud-build/triggers?project=sermaluc-gestion-servicios
2. Click en **"CONECTAR REPOSITORIO"** o **"CONNECT REPOSITORY"**
3. Selecciona **"GitHub (Cloud Build GitHub App)"**
4. Autoriza la aplicación de Cloud Build
5. Selecciona tu repositorio: `siribarren/sermaluc-gestion-servicios`
6. Click en **"CONECTAR"**

### Paso 4: Crear Trigger de Cloud Build

**Opción A: Desde la Consola Web**

1. En la página de Triggers, click en **"CREAR TRIGGER"** o **"CREATE TRIGGER"**
2. Configura:
   - **Nombre**: `sermaluc-deploy`
   - **Evento**: Push a una rama
   - **Rama**: `^main$`
   - **Configuración**: Archivo de configuración de Cloud Build
   - **Ubicación del archivo**: `cloudbuild.yaml`
   - **Región**: `us-central1`
3. **Variables de sustitución** (IMPORTANTE):
   - `_DATABASE_URL`: Obtener con: `gcloud secrets versions access latest --secret=backend-database-url`
   - `_FRONTEND_URL`: `https://placeholder.run.app` (temporal)
   - `_NEXT_PUBLIC_API_URL`: `https://placeholder.run.app` (temporal)
4. Click en **"CREAR"**

**Opción B: Desde la Terminal**

```bash
# Obtener DATABASE_URL del secret
DATABASE_URL=$(gcloud secrets versions access latest --secret=backend-database-url)

# Crear trigger
gcloud builds triggers create github \
  --name="sermaluc-deploy" \
  --repo-name="sermaluc-gestion-servicios" \
  --repo-owner="siribarren" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region="us-central1" \
  --substitutions=_DATABASE_URL="${DATABASE_URL}",_FRONTEND_URL="https://placeholder.run.app",_NEXT_PUBLIC_API_URL="https://placeholder.run.app"
```

### Paso 5: Probar el Deployment

**Opción A: Trigger Manual**

```bash
# Ejecutar el trigger manualmente
gcloud builds triggers run sermaluc-deploy --branch=main
```

**Opción B: Push a GitHub**

```bash
# Hacer un commit y push
git add .
git commit -m "Trigger deployment"
git push origin main
```

### Paso 6: Monitorear el Build

```bash
# Ver builds en progreso
gcloud builds list --ongoing

# Ver logs del último build
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")

# Ver en tiempo real
gcloud builds log --stream $(gcloud builds list --limit=1 --format="value(id)")
```

### Paso 7: Obtener URLs y Actualizar Variables

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

# Actualizar trigger con URLs reales
gcloud builds triggers update github sermaluc-deploy \
  --substitutions=_DATABASE_URL="$(gcloud secrets versions access latest --secret=backend-database-url)",_FRONTEND_URL="${FRONTEND_URL}",_NEXT_PUBLIC_API_URL="${BACKEND_URL}"
```

## 🔍 Verificación

### Verificar Trigger

```bash
# Listar triggers
gcloud builds triggers list

# Ver detalles
gcloud builds triggers describe sermaluc-deploy
```

### Verificar Builds

```bash
# Ver historial
gcloud builds list --limit=10

# Ver detalles de un build
gcloud builds describe BUILD_ID
```

### Verificar Servicios

```bash
# Listar servicios Cloud Run
gcloud run services list --region=us-central1

# Ver detalles del backend
gcloud run services describe gestion-backend --region=us-central1

# Ver detalles del frontend
gcloud run services describe gestion-frontend --region=us-central1
```

## 🐛 Troubleshooting

### Error: "Permission denied" o "does not have permission"

Si encuentras errores de permisos al ejecutar el script:

1. **Verifica tus permisos actuales**:
   ```bash
   gcloud projects get-iam-policy sermaluc-gestion-servicios \
     --flatten="bindings[].members" \
     --filter="bindings.members:user:$(gcloud config get-value account)" \
     --format="table(bindings.role)"
   ```

2. **Solicita permisos al administrador**:
   - Ver `SOLUCIONAR_PERMISOS.md` para instrucciones detalladas
   - Ver `COMANDOS_SOLICITAR_PERMISOS.md` para comandos exactos que el administrador debe ejecutar
   - El comando más simple es otorgar el rol `roles/editor`

3. **Después de obtener permisos**, ejecuta el script nuevamente:
   ```bash
   ./setup-github-gcp.sh
   ```

### Error: "Repository not found"
- Verifica que el repositorio esté conectado en Cloud Build
- Verifica que tengas permisos en el repositorio de GitHub
- Re-conecta el repositorio desde la consola web

### Error: "Permission denied" en Cloud Build
- Verifica que los permisos IAM estén configurados
- Ejecuta el script `setup-github-gcp.sh` nuevamente

### Error: "Secret not found"
- Verifica que los secrets existan:
  ```bash
  gcloud secrets list
  ```
- Verifica que Cloud Build tenga permisos:
  ```bash
  PROJECT_NUMBER=$(gcloud projects describe sermaluc-gestion-servicios --format="value(projectNumber)")
  gcloud secrets get-iam-policy backend-database-url
  ```

### Error: "Cloud SQL connection failed"
- Verifica que `--add-cloudsql-instances` esté configurado correctamente
- Verifica que la instancia Cloud SQL exista:
  ```bash
  gcloud sql instances describe nomina-sql
  ```

### Error: "Variable substitution failed"
- Verifica que las variables estén configuradas en el trigger:
  ```bash
  gcloud builds triggers describe sermaluc-deploy --format="yaml" | grep substitutions
  ```
- Las variables deben usar el prefijo `_` (ej: `_DATABASE_URL`)

## 📚 Comandos Útiles

```bash
# Ver estado de todos los triggers
gcloud builds triggers list

# Ver historial de builds
gcloud builds list --limit=10

# Ver logs de un servicio Cloud Run
gcloud run services logs read gestion-backend --region=us-central1 --limit=50

# Cancelar un build en progreso
gcloud builds cancel BUILD_ID

# Ver variables de sustitución del trigger
gcloud builds triggers describe sermaluc-deploy --format="value(substitutions)"
```

## ✅ Checklist Final

- [ ] Script de configuración ejecutado
- [ ] Repositorio GitHub conectado a Cloud Build
- [ ] Trigger creado para rama `main`
- [ ] Variables de sustitución configuradas
- [ ] Permisos IAM configurados
- [ ] Secrets configurados y con permisos
- [ ] Primer build ejecutado exitosamente
- [ ] URLs obtenidas y variables actualizadas
- [ ] Servicios Cloud Run funcionando

## 🎉 ¡Listo!

Una vez completados todos los pasos, cada push a la rama `main` en GitHub automáticamente:
1. Trigger un build en Cloud Build
2. Construya las imágenes Docker
3. Las suba a Artifact Registry
4. Despliegue los servicios en Cloud Run

¡Tu sistema está completamente sincronizado con GCP! 🚀

