# Configuración de Secrets - Tu Configuración Actual

## ✅ Secret Existente

Ya tienes configurado:
- **Nombre**: `backend-database-url`
- **Ruta completa**: `projects/1006045162138/secrets/backend-database-url`

## Verificar el Valor del Secret

Para verificar que el secret tiene el valor correcto:

### Desde la Consola Web:
1. Ve a: https://console.cloud.google.com/security/secret-manager
2. Click en `backend-database-url`
3. Click en la versión más reciente
4. Click en "VER VALOR DEL SECRETO" (necesitarás permisos)

### Desde la Terminal:
```bash
# Ver el valor del secret (necesitas permisos)
gcloud secrets versions access latest --secret="backend-database-url"
```

## Formato Esperado del DATABASE_URL

El secret `backend-database-url` debe contener:

```
postgresql://sermaluc-db:TU_PASSWORD@/db-nomina?host=/cloudsql/sermaluc-gestion-servicios:us-central1:nomina-sql
```

**Componentes:**
- Usuario: `sermaluc-db`
- Contraseña: `TU_PASSWORD` (la contraseña real)
- Base de datos: `db-nomina`
- Connection: `sermaluc-gestion-servicios:us-central1:nomina-sql`

## Actualizar el Secret (si es necesario)

Si necesitas actualizar el valor del secret:

### Desde la Consola Web:
1. Ve a Secret Manager
2. Click en `backend-database-url`
3. Click en "AGREGAR NUEVA VERSIÓN" o "ADD NEW VERSION"
4. Ingresa el nuevo valor
5. Click en "AGREGAR VERSIÓN"

### Desde la Terminal:
```bash
# Actualizar el secret con nuevo valor
echo "postgresql://sermaluc-db:TU_PASSWORD@/db-nomina?host=/cloudsql/sermaluc-gestion-servicios:us-central1:nomina-sql" | \
  gcloud secrets versions add backend-database-url --data-file=-
```

## Verificar Permisos de Cloud Build

Cloud Build necesita permisos para leer el secret:

```bash
# Obtener PROJECT_NUMBER
PROJECT_NUMBER=$(gcloud projects describe sermaluc-gestion-servicios --format="value(projectNumber)")

# Dar permisos a Cloud Build
gcloud secrets add-iam-policy-binding backend-database-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Otros Secrets Necesarios

Además de `backend-database-url`, necesitas estos secrets:

### 1. GOOGLE_SERVICE_ACCOUNT_KEY
```bash
gcloud secrets create google-service-account-key \
  --data-file=/ruta/a/tu/service-account-key.json
```

### 2. FRONTEND_URL (temporal, se actualizará después del deploy)
```bash
echo "https://placeholder.run.app" | \
  gcloud secrets create frontend-url --data-file=-
```

### 3. NEXT_PUBLIC_API_URL (temporal, se actualizará después del deploy)
```bash
echo "https://placeholder.run.app" | \
  gcloud secrets create next-public-api-url --data-file=-
```

## Configuración Actualizada en cloudbuild.yaml

He actualizado `cloudbuild.yaml` para usar tu secret `backend-database-url`:

```yaml
--set-secrets
DATABASE_URL=backend-database-url:latest,GOOGLE_SERVICE_ACCOUNT_KEY=google-service-account-key:latest
```

Esto significa que Cloud Build leerá el valor de `backend-database-url` y lo inyectará como variable de entorno `DATABASE_URL` en Cloud Run.

## Checklist

- [x] Secret `backend-database-url` existe
- [ ] Verificar que el valor del secret es correcto
- [ ] Dar permisos a Cloud Build para leer el secret
- [ ] Crear secret `google-service-account-key`
- [ ] Crear secret `frontend-url` (temporal)
- [ ] Crear secret `next-public-api-url` (temporal)

## Próximos Pasos

1. **Verificar el valor del secret** `backend-database-url`
2. **Dar permisos a Cloud Build** (comando arriba)
3. **Crear los otros secrets necesarios**
4. **Proceder con el deployment**

