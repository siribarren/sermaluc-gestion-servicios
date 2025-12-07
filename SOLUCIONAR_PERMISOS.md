# Solucionar Problemas de Permisos en GCP

Si encuentras errores de permisos al ejecutar `setup-github-gcp.sh`, sigue esta guía.

> **📋 Comandos para Administrador**: Ver `COMANDOS_SOLICITAR_PERMISOS.md` para los comandos exactos que el administrador debe ejecutar.

## 🔴 Error: "does not have permission to access projects instance"

Este error indica que tu cuenta no tiene los permisos necesarios en el proyecto GCP.

### Solución 1: Verificar Permisos Actuales

```bash
# Ver tu cuenta actual
gcloud auth list

# Ver proyectos a los que tienes acceso
gcloud projects list

# Verificar acceso al proyecto específico
gcloud projects describe sermaluc-gestion-servicios
```

### Solución 2: Solicitar Permisos al Administrador

**📋 Ver `COMANDOS_SOLICITAR_PERMISOS.md` para los comandos exactos que el administrador debe ejecutar.**

**Opción Rápida (Recomendada):**

Solicita al administrador que ejecute este comando único:

```bash
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/editor"
```

Este rol incluye todos los permisos necesarios para desarrollo y deployment.

**Opción Específica (Más Restrictiva):**

Si prefieres permisos más específicos, el administrador puede ejecutar los comandos en `COMANDOS_SOLICITAR_PERMISOS.md` (Opción 2).

### Solución 3: Usar Cuenta de Servicio (Alternativa)

Si tienes acceso a una cuenta de servicio con permisos:

```bash
# Activar cuenta de servicio
gcloud auth activate-service-account SERVICE_ACCOUNT_EMAIL \
  --key-file=/path/to/key.json

# Verificar
gcloud auth list
```

## 🔴 Error: "Service sourcerepo.googleapis.com is not available"

Este servicio NO es necesario si estás usando GitHub directamente. El script ha sido actualizado para hacerlo opcional.

**No necesitas hacer nada** - el script continuará sin este servicio.

## 🔴 Error: "Bind permission denied for service"

Este error indica que no tienes permisos para habilitar APIs.

**Solución**: Solicita el rol `roles/serviceusage.serviceUsageAdmin` al administrador del proyecto.

## 📋 Checklist de Permisos

Verifica que tengas estos permisos:

- [ ] Acceso al proyecto `sermaluc-gestion-servicios`
- [ ] Rol: `roles/serviceusage.serviceUsageAdmin` (para habilitar APIs)
- [ ] Rol: `roles/cloudbuild.builds.editor` (para crear triggers)
- [ ] Rol: `roles/iam.serviceAccountUser` (para usar service accounts)
- [ ] Rol: `roles/secretmanager.secretAccessor` (para leer secrets, si vas a configurarlos)

## 🔍 Verificar Permisos Actuales

```bash
# Ver tus permisos en el proyecto
gcloud projects get-iam-policy sermaluc-gestion-servicios \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:simon.iribarren@sermaluc.cl" \
  --format="table(bindings.role)"
```

## 🛠️ Comandos para Administradores

**📋 Ver `COMANDOS_SOLICITAR_PERMISOS.md` para un script completo y detallado.**

**Comando Rápido (Recomendado):**

```bash
gcloud projects add-iam-policy-binding sermaluc-gestion-servicios \
  --member="user:simon.iribarren@sermaluc.cl" \
  --role="roles/editor"
```

Este comando otorga todos los permisos necesarios de una vez.

## 🚀 Continuar Después de Obtener Permisos

Una vez que tengas los permisos:

```bash
# Verificar acceso
gcloud projects describe sermaluc-gestion-servicios

# Ejecutar script nuevamente
./setup-github-gcp.sh
```

## 📞 Contactar Administrador

Si no tienes acceso, contacta al administrador del proyecto GCP y solicita:

1. Acceso al proyecto `sermaluc-gestion-servicios`
2. Rol `roles/editor` o los roles específicos mencionados arriba

El administrador puede ver quién tiene acceso con:

```bash
gcloud projects get-iam-policy sermaluc-gestion-servicios \
  --format="table(bindings.role,bindings.members)"
```

