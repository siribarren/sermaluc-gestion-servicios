# Configuración Rápida de Base de Datos

## Tu Configuración Actual

✅ **Instancia**: `nomina-sql`  
✅ **Base de Datos**: `db-nomina`  
✅ **Usuario**: `sermaluc-db`  
✅ **Connection Name**: `sermaluc-gestion-servicios:us-central1:nomina-sql`  
✅ **PostgreSQL**: `17.7`  
✅ **IP Pública**: `35.188.67.177`

## Pasos Rápidos

### 1. Configurar DATABASE_URL en Secret Manager

```bash
# Obtener la contraseña del usuario sermaluc-db
# (Si no la tienes, puedes resetearla con gcloud sql users set-password)

# Crear/actualizar secret
echo "postgresql://sermaluc-db:TU_PASSWORD@/db-nomina?host=/cloudsql/sermaluc-gestion-servicios:us-central1:nomina-sql" | \
  gcloud secrets create database-url --data-file=- || \
  gcloud secrets versions add database-url --data-file=-
```

### 2. Ejecutar Migraciones

#### Opción A: Cloud SQL Proxy (Recomendado)

```bash
# Terminal 1: Iniciar Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy
./cloud-sql-proxy sermaluc-gestion-servicios:us-central1:nomina-sql

# Terminal 2: Ejecutar migraciones
cd backend
export DATABASE_URL="postgresql://sermaluc-db:TU_PASSWORD@127.0.0.1:5432/db-nomina"
npx prisma migrate deploy
npx prisma generate
```

#### Opción B: IP Pública

```bash
# 1. Autorizar tu IP (solo la primera vez)
gcloud sql instances patch nomina-sql \
  --authorized-networks=TU_IP_PUBLICA/32

# 2. Ejecutar migraciones
cd backend
export DATABASE_URL="postgresql://sermaluc-db:TU_PASSWORD@35.188.67.177:5432/db-nomina"
npx prisma migrate deploy
npx prisma generate
```

### 3. Verificar

```bash
# Abrir Prisma Studio
cd backend
npx prisma studio

# O verificar con psql
psql "postgresql://sermaluc-db:TU_PASSWORD@127.0.0.1:5432/db-nomina" -c "\dt"
```

## Comandos Útiles

```bash
# Ver información de la instancia
gcloud sql instances describe nomina-sql

# Ver bases de datos
gcloud sql databases list --instance=nomina-sql

# Ver usuarios
gcloud sql users list --instance=nomina-sql

# Resetear contraseña (si es necesario)
gcloud sql users set-password sermaluc-db \
  --instance=nomina-sql \
  --password=NUEVA_PASSWORD
```

## Troubleshooting

### Error: "password authentication failed"
- Verifica la contraseña del usuario `sermaluc-db`
- Puedes resetearla con el comando anterior

### Error: "connection refused" (IP Pública)
- Verifica que tu IP esté autorizada
- Verifica que la IP pública esté habilitada en la instancia

### Error: "database does not exist"
- Verifica que la base de datos `db-nomina` exista:
  ```bash
  gcloud sql databases list --instance=nomina-sql
  ```

## Próximos Pasos

Una vez que las migraciones estén ejecutadas:

1. ✅ Verificar que las tablas se crearon: `npx prisma studio`
2. ✅ Probar la conexión desde el backend
3. ✅ Ejecutar primera sincronización: `POST /internal/sync/collaborators`

