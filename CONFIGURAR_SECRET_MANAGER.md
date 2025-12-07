# Cómo Configurar Secret Manager - Paso a Paso

## Paso 1: Configurar DATABASE_URL en Secret Manager

### Opción A: Desde la Consola Web de GCP (Más Fácil) 🌐

1. **Abre la Consola de Google Cloud Platform**
   - Ve a: https://console.cloud.google.com/
   - Asegúrate de estar en el proyecto: `sermaluc-gestion-servicios`

2. **Navega a Secret Manager**
   - En el menú izquierdo, busca "Secret Manager" o "Administrador de secretos"
   - O ve directamente a: https://console.cloud.google.com/security/secret-manager

3. **Crear el Secret DATABASE_URL**
   - Click en el botón **"+ CREAR SECRETO"** o **"CREATE SECRET"**
   
4. **Completar el formulario:**
   - **Nombre**: `database-url` (en minúsculas, sin espacios)
   - **Valor del secreto**: 
     ```
     postgresql://sermaluc-db:TU_PASSWORD@/db-nomina?host=/cloudsql/sermaluc-gestion-servicios:us-central1:nomina-sql
     ```
     ⚠️ **Reemplaza `TU_PASSWORD` con la contraseña real del usuario `sermaluc-db`**
   
5. **Click en "CREAR SECRETO"**

6. **Verificar que se creó**
   - Deberías ver `database-url` en la lista de secretos

### Opción B: Desde la Terminal (Línea de Comandos) 💻

```bash
# 1. Asegúrate de estar autenticado
gcloud auth login

# 2. Selecciona el proyecto correcto
gcloud config set project sermaluc-gestion-servicios

# 3. Crear el secret DATABASE_URL
# Reemplaza TU_PASSWORD con la contraseña real
echo "postgresql://sermaluc-db:TU_PASSWORD@/db-nomina?host=/cloudsql/sermaluc-gestion-servicios:us-central1:nomina-sql" | \
  gcloud secrets create database-url --data-file=-
```

**Si el secret ya existe y quieres actualizarlo:**

```bash
# Agregar una nueva versión del secret
echo "postgresql://sermaluc-db:TU_PASSWORD@/db-nomina?host=/cloudsql/sermaluc-gestion-servicios:us-central1:nomina-sql" | \
  gcloud secrets versions add database-url --data-file=-
```

## Paso 2: Configurar Otros Secrets Necesarios

### GOOGLE_SERVICE_ACCOUNT_KEY

**Desde la Consola Web:**
1. Ve a Secret Manager
2. Click en "CREAR SECRETO"
3. **Nombre**: `google-service-account-key`
4. **Valor**: Sube el archivo JSON de tu service account
   - Click en "Subir archivo" o "Upload file"
   - Selecciona el archivo `service-account-key.json`

**Desde la Terminal:**
```bash
gcloud secrets create google-service-account-key \
  --data-file=/ruta/a/tu/service-account-key.json
```

### FRONTEND_URL (se actualizará después del deploy)

**Desde la Consola Web:**
1. Ve a Secret Manager
2. Click en "CREAR SECRETO"
3. **Nombre**: `frontend-url`
4. **Valor**: `https://placeholder.run.app` (temporal, se actualizará después)

**Desde la Terminal:**
```bash
echo "https://placeholder.run.app" | \
  gcloud secrets create frontend-url --data-file=-
```

### NEXT_PUBLIC_API_URL (se actualizará después del deploy)

**Desde la Consola Web:**
1. Ve a Secret Manager
2. Click en "CREAR SECRETO"
3. **Nombre**: `next-public-api-url`
4. **Valor**: `https://placeholder.run.app` (temporal, se actualizará después)

**Desde la Terminal:**
```bash
echo "https://placeholder.run.app" | \
  gcloud secrets create next-public-api-url --data-file=-
```

## Verificar que los Secrets Están Creados

**Desde la Consola Web:**
- Ve a Secret Manager
- Deberías ver estos secrets:
  - ✅ `database-url`
  - ✅ `google-service-account-key`
  - ✅ `frontend-url`
  - ✅ `next-public-api-url`

**Desde la Terminal:**
```bash
gcloud secrets list
```

## Dar Permisos a Cloud Build

Los secrets necesitan permisos para que Cloud Build pueda acceder a ellos:

**Desde la Consola Web:**
1. Ve a Secret Manager
2. Click en cada secret
3. Click en "PERMISOS" o "PERMISSIONS"
4. Click en "AGREGAR PRINCIPAL" o "ADD PRINCIPAL"
5. **Nuevo principal**: 
   ```
   [TU_PROJECT_NUMBER]@cloudbuild.gserviceaccount.com
   ```
   (Reemplaza TU_PROJECT_NUMBER con el número de tu proyecto)
6. **Rol**: Selecciona "Secret Manager Secret Accessor"
7. Click en "GUARDAR"

**Desde la Terminal:**
```bash
# Obtener PROJECT_NUMBER
PROJECT_NUMBER=$(gcloud projects describe sermaluc-gestion-servicios --format="value(projectNumber)")

# Dar permisos a Cloud Build
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

## ⚠️ Importante: Obtener la Contraseña

Si no conoces la contraseña del usuario `sermaluc-db`, puedes:

1. **Resetear la contraseña:**
   ```bash
   gcloud sql users set-password sermaluc-db \
     --instance=nomina-sql \
     --password=NUEVA_PASSWORD_SEGURA
   ```

2. **O verificar si existe el usuario:**
   ```bash
   gcloud sql users list --instance=nomina-sql
   ```

## Checklist

- [ ] Secret `database-url` creado con la contraseña correcta
- [ ] Secret `google-service-account-key` creado
- [ ] Secret `frontend-url` creado (temporal)
- [ ] Secret `next-public-api-url` creado (temporal)
- [ ] Permisos dados a Cloud Build service account
- [ ] Secrets verificados en la lista

## Próximo Paso

Una vez configurados los secrets, puedes proceder con:
- Ejecutar migraciones de base de datos
- Configurar Cloud Build
- Hacer deployment

