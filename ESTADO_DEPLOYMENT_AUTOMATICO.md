# Estado del Deployment Automático

## ✅ Lo que YA está configurado

1. **`cloudbuild.yaml`** - Pipeline de CI/CD completo:
   - ✅ Build de imágenes Docker (backend y frontend)
   - ✅ Push a Artifact Registry
   - ✅ Deploy automático a Cloud Run (backend y frontend)
   - ✅ Configuración de variables de entorno y secrets

2. **Repositorio GitHub** - Código está en GitHub:
   - ✅ Repositorio: `https://github.com/siribarren/sermaluc-gestion-servicios`
   - ✅ Rama `main` activa

## ❌ Lo que FALTA para deployment automático

Para que cada `git push` automáticamente trigger un build y deployment, necesitas:

### 1. Conectar Repositorio GitHub a Cloud Build

**Estado**: ❌ No configurado

**Pasos necesarios**:
1. Ve a: https://console.cloud.google.com/cloud-build/triggers?project=sermaluc-gestion-servicios
2. Click en **"CONECTAR REPOSITORIO"**
3. Selecciona **"GitHub (Cloud Build GitHub App)"**
4. Autoriza la aplicación
5. Selecciona: `siribarren/sermaluc-gestion-servicios`
6. Click en **"CONECTAR"**

### 2. Crear Trigger de Cloud Build

**Estado**: ❌ No configurado

**Pasos necesarios**:

**Opción A: Desde la Consola Web**
1. En la página de Triggers, click en **"CREAR TRIGGER"**
2. Configura:
   - **Nombre**: `sermaluc-deploy`
   - **Evento**: Push a una rama
   - **Rama**: `^main$`
   - **Configuración**: Archivo de configuración de Cloud Build
   - **Ubicación del archivo**: `cloudbuild.yaml`
   - **Región**: `us-central1`
3. **Variables de sustitución**:
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

### 3. Verificar Permisos

**Estado**: ⚠️ Verificar

Asegúrate de tener:
- ✅ Permisos en GCP (ver `SOLUCIONAR_PERMISOS.md`)
- ✅ Permisos de Cloud Build configurados (ver `setup-github-gcp.sh`)

## 🔄 Flujo Completo (Una vez configurado)

```
git push origin main
    ↓
GitHub detecta push
    ↓
Cloud Build Trigger se activa automáticamente
    ↓
Cloud Build ejecuta cloudbuild.yaml:
    1. Build backend Docker image
    2. Build frontend Docker image
    3. Push imágenes a Artifact Registry
    4. Deploy backend a Cloud Run
    5. Deploy frontend a Cloud Run
    ↓
✅ Servicios actualizados en Cloud Run
```

## 📋 Checklist de Configuración

- [ ] Repositorio GitHub conectado a Cloud Build
- [ ] Trigger `sermaluc-deploy` creado
- [ ] Variables de sustitución configuradas en el trigger
- [ ] Permisos IAM configurados (ejecutar `./setup-github-gcp.sh`)
- [ ] Secrets configurados en Secret Manager
- [ ] Artifact Registry creado
- [ ] Probar con un push: `git push origin main`

## 🧪 Probar el Deployment Automático

Una vez configurado el trigger:

```bash
# Hacer un cambio pequeño
echo "# Test" >> README.md
git add README.md
git commit -m "Test: Verificar deployment automático"
git push origin main

# Monitorear el build
gcloud builds list --ongoing

# Ver logs en tiempo real
gcloud builds log --stream $(gcloud builds list --limit=1 --format="value(id)")
```

## 📚 Documentación Relacionada

- **[SINCRONIZAR_GITHUB_GCP.md](./SINCRONIZAR_GITHUB_GCP.md)** - Guía completa paso a paso
- **[CONFIGURAR_GITHUB_GCP.md](./CONFIGURAR_GITHUB_GCP.md)** - Configuración detallada
- **[SOLUCIONAR_PERMISOS.md](./SOLUCIONAR_PERMISOS.md)** - Si encuentras problemas de permisos

## ⚠️ Nota Importante

**Actualmente, cada `git push` NO trigger automáticamente un build** porque:
1. El repositorio GitHub no está conectado a Cloud Build
2. No existe un trigger configurado

Una vez que completes los pasos 1 y 2 arriba, **SÍ funcionará automáticamente** con cada push a `main`.

