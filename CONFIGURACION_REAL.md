# Configuración Real de Cloud SQL

## Información de la Instancia

- **Nombre de Instancia**: `nomina-sql`
- **Base de Datos**: `db-nomina`
- **Usuario**: `sermaluc-db`
- **Connection Name**: `sermaluc-gestion-servicios:us-central1:nomina-sql`
- **Versión PostgreSQL**: `17.7`
- **Región**: `us-central1`
- **IP Pública**: `35.188.67.177` (habilitada)
- **IP Saliente**: `35.192.101.189`
- **Puerto**: `5432`
- **Conectividad IP Privada**: Deshabilitada
- **Conectividad IP Pública**: Habilitada

## DATABASE_URL para Diferentes Entornos

### Para Cloud Run (Unix Socket)

```bash
DATABASE_URL="postgresql://sermaluc-db:TU_PASSWORD@/db-nomina?host=/cloudsql/sermaluc-gestion-servicios:us-central1:nomina-sql"
```

### Para Desarrollo Local con Cloud SQL Proxy

```bash
DATABASE_URL="postgresql://sermaluc-db:TU_PASSWORD@127.0.0.1:5432/db-nomina"
```

### Para Conexión Directa (IP Pública)

```bash
DATABASE_URL="postgresql://sermaluc-db:TU_PASSWORD@35.188.67.177:5432/db-nomina"
```

**Nota**: Para usar IP pública, necesitas autorizar tu IP en Cloud SQL.

## Configurar Secret Manager

```bash
# Crear/actualizar secret DATABASE_URL para Cloud Run
echo "postgresql://sermaluc-db:TU_PASSWORD@/db-nomina?host=/cloudsql/sermaluc-gestion-servicios:us-central1:nomina-sql" | \
  gcloud secrets create database-url --data-file=- || \
  gcloud secrets versions add database-url --data-file=-
```

## Ejecutar Migraciones

### Opción 1: Cloud SQL Proxy (Recomendado)

```bash
# 1. Descargar Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# 2. Conectar (en una terminal)
./cloud-sql-proxy sermaluc-gestion-servicios:us-central1:nomina-sql

# 3. En otra terminal, ejecutar migraciones
cd backend
export DATABASE_URL="postgresql://sermaluc-db:TU_PASSWORD@127.0.0.1:5432/db-nomina"
npx prisma migrate deploy
npx prisma generate
```

### Opción 2: IP Pública (Requiere autorización)

```bash
# 1. Autorizar tu IP
gcloud sql instances patch nomina-sql \
  --authorized-networks=TU_IP_PUBLICA/32

# 2. Ejecutar migraciones
cd backend
export DATABASE_URL="postgresql://sermaluc-db:TU_PASSWORD@35.188.67.177:5432/db-nomina"
npx prisma migrate deploy
npx prisma generate
```

## Verificar Conexión

```bash
# Con Cloud SQL Proxy
psql "postgresql://sermaluc-db:TU_PASSWORD@127.0.0.1:5432/db-nomina"

# Con IP Pública (después de autorizar)
psql "postgresql://sermaluc-db:TU_PASSWORD@35.188.67.177:5432/db-nomina"
```

## Comandos Útiles

```bash
# Ver información de la instancia
gcloud sql instances describe nomina-sql

# Listar bases de datos
gcloud sql databases list --instance=nomina-sql

# Listar usuarios
gcloud sql users list --instance=nomina-sql

# Ver IPs autorizadas
gcloud sql instances describe nomina-sql \
  --format="value(settings.ipConfiguration.authorizedNetworks)"
```

