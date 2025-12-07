# Comandos para Solicitar Permisos en GCP

Este documento contiene los comandos exactos que un **administrador del proyecto** debe ejecutar para otorgar los permisos necesarios.

## 👤 Información del Usuario

- **Email**: `simon.iribarren@sermaluc.cl`
- **Proyecto GCP**: `sermaluc-gestion-servicios`

## 🚀 Opción 1: Rol Editor (Recomendado - Más Fácil)

Este rol incluye todos los permisos necesarios para desarrollo y deployment:

```bash
# Configurar proyecto
gcloud config set project sermaluc-gestion-servicios

# Otorgar rol Editor
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/editor"
```

**✅ Con este rol, el usuario puede:**
- Habilitar APIs
- Crear y gestionar recursos de Cloud Build
- Desplegar en Cloud Run
- Acceder a Secret Manager
- Gestionar Artifact Registry
- Y más...

## 🔧 Opción 2: Permisos Específicos (Más Restrictivo)

Si prefieres otorgar solo los permisos mínimos necesarios:

```bash
# Configurar proyecto
gcloud config set project sermaluc-gestion-servicios

# 1. Permiso para habilitar APIs
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/serviceusage.serviceUsageAdmin"

# 2. Permiso para Cloud Build
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/cloudbuild.builds.editor"

# 3. Permiso para Cloud Run
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/run.admin"

# 4. Permiso para IAM (para otorgar permisos a service accounts)
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/iam.serviceAccountUser"

# 5. Permiso para Artifact Registry
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/artifactregistry.admin"

# 6. Permiso para Secret Manager (si necesita crear/leer secrets)
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/secretmanager.admin"
```

## 📋 Script Completo para Administrador

Copia y pega este script completo en tu terminal:

```bash
#!/bin/bash

# Script para otorgar permisos a simon.iribarren@sermaluc.cl
# Ejecutar como administrador del proyecto

PROJECT_ID="sermaluc-gestion-servicios"
USER_EMAIL="simon.iribarren@sermaluc.cl"

echo "🔐 Otorgando permisos a ${USER_EMAIL} en proyecto ${PROJECT_ID}..."

# Configurar proyecto
gcloud config set project ${PROJECT_ID}

# Opción A: Rol Editor (recomendado)
echo "📋 Otorgando rol Editor..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${USER_EMAIL}" \
  --role="roles/editor"

echo "✅ Permisos otorgados exitosamente"
echo ""
echo "El usuario ${USER_EMAIL} ahora puede:"
echo "  - Habilitar APIs"
echo "  - Crear triggers de Cloud Build"
echo "  - Desplegar en Cloud Run"
echo "  - Gestionar recursos del proyecto"
```

## 🔍 Verificar Permisos Otorgados

Después de otorgar permisos, verifica que se aplicaron correctamente:

```bash
# Ver todos los permisos del usuario
gcloud projects get-iam-policy sermaluc-gestion-servicios \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:simon.iribarren@sermaluc.cl" \
  --format="table(bindings.role)"
```

## 📧 Template de Email para Solicitar Permisos

Si necesitas solicitar permisos por email, puedes usar este template:

```
Asunto: Solicitud de Permisos GCP - Proyecto sermaluc-gestion-servicios

Hola [Nombre del Administrador],

Necesito permisos en el proyecto GCP "sermaluc-gestion-servicios" para configurar 
la integración de GitHub con Cloud Build y realizar deployments automáticos.

Mi email de GCP es: simon.iribarren@sermaluc.cl

Por favor, ejecuta uno de estos comandos:

Opción 1 (Recomendada - Rol Editor):
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/editor"

O si prefieres permisos más específicos, ver el archivo:
COMANDOS_SOLICITAR_PERMISOS.md

Gracias,
Simón Iribarren
```

## ⚠️ Notas Importantes

1. **El administrador debe tener permisos** `roles/owner` o `roles/resourcemanager.projectIamAdmin` para otorgar estos permisos.

2. **Verificar que el proyecto existe**:
   ```bash
   gcloud projects describe sermaluc-gestion-servicios
   ```

3. **Verificar que el usuario existe**:
   ```bash
   gcloud projects get-iam-policy sermaluc-gestion-servicios \
     --flatten="bindings[].members" \
     --format="table(bindings.members)" | grep simon.iribarren
   ```

4. **Los cambios pueden tardar unos minutos** en propagarse.

## ✅ Verificación por Parte del Usuario

Después de que el administrador otorgue los permisos, el usuario puede verificar:

```bash
# Verificar acceso al proyecto
gcloud projects describe sermaluc-gestion-servicios

# Verificar permisos
gcloud projects get-iam-policy sermaluc-gestion-servicios \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:simon.iribarren@sermaluc.cl" \
  --format="table(bindings.role)"

# Probar habilitar una API
gcloud services enable cloudbuild.googleapis.com --project=sermaluc-gestion-servicios
```

## 🆘 Troubleshooting

### Error: "Permission denied"
- Verifica que el administrador tenga permisos para otorgar roles
- Verifica que el email del usuario sea correcto
- Espera unos minutos y vuelve a intentar

### Error: "Project not found"
- Verifica que el proyecto ID sea correcto: `sermaluc-gestion-servicios`
- Verifica que el proyecto esté activo

### Error: "User not found"
- Verifica que el email sea correcto: `simon.iribarren@sermaluc.cl`
- El usuario debe tener una cuenta de Google Workspace o GCP

