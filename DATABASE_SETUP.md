# Guía de Configuración de Base de Datos

Esta guía te ayudará a crear y configurar la base de datos PostgreSQL para el sistema Sermaluc Gestión de Servicios.

## Opción 1: Cloud SQL (Producción/Desarrollo en GCP)

### Paso 1: Crear Instancia Cloud SQL

```bash
# Obtener PROJECT_ID
PROJECT_ID=$(gcloud config get-value project)

# Crear instancia PostgreSQL
gcloud sql instances create nomina-sql \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=TU_PASSWORD_SEGURO \
  --storage-type=SSD \
  --storage-size=20GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --enable-bin-log

# Nota: db-f1-micro es el tier más económico para desarrollo
# Para producción, considera db-n1-standard-1 o superior
```

### Paso 2: Crear Base de Datos

```bash
# Crear la base de datos
gcloud sql databases create sermaluc_db --instance=nomina-sql

# Verificar que se creó
gcloud sql databases list --instance=nomina-sql
```

### Paso 3: Crear Usuario de Base de Datos

```bash
# Crear usuario (reemplaza USERNAME y PASSWORD)
gcloud sql users create sermaluc_user \
  --instance=nomina-sql \
  --password=TU_PASSWORD_SEGURO

# Verificar usuarios
gcloud sql users list --instance=nomina-sql
```

### Paso 4: Obtener Información de Conexión

```bash
# Obtener connection name (necesario para Cloud SQL Proxy)
gcloud sql instances describe nomina-sql \
  --format="value(connectionName)"

# Obtener IP pública (si necesitas conexión externa)
gcloud sql instances describe nomina-sql \
  --format="value(ipAddresses[0].ipAddress)"
```

### Paso 5: Configurar DATABASE_URL

Para Cloud Run (usando Unix socket):

```bash
# Formato para Cloud Run
DATABASE_URL="postgresql://sermaluc_user:PASSWORD@/sermaluc_db?host=/cloudsql/PROJECT_ID:us-central1:nomina-sql"
```

Para desarrollo local con Cloud SQL Proxy:

```bash
# Formato para Cloud SQL Proxy
DATABASE_URL="postgresql://sermaluc_user:PASSWORD@127.0.0.1:5432/sermaluc_db"
```

### Paso 6: Ejecutar Migraciones

#### Opción A: Usando Cloud SQL Proxy (Recomendado para desarrollo)

```bash
# 1. Descargar Cloud SQL Proxy
# Para macOS ARM64:
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64

# Para macOS Intel:
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64

# Para Linux:
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64

# Dar permisos de ejecución
chmod +x cloud-sql-proxy

# 2. Conectar a Cloud SQL (en una terminal)
PROJECT_ID=$(gcloud config get-value project)
./cloud-sql-proxy $PROJECT_ID:us-central1:nomina-sql

# 3. En otra terminal, ejecutar migraciones
cd backend

# Configurar DATABASE_URL
export DATABASE_URL="postgresql://sermaluc_user:TU_PASSWORD@127.0.0.1:5432/sermaluc_db"

# Ejecutar migraciones
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate
```

#### Opción B: Usando Cloud Shell

```bash
# 1. Abrir Cloud Shell en la consola de GCP
# 2. Clonar el repositorio o subir los archivos
# 3. Instalar dependencias
cd backend
npm install

# 4. Configurar DATABASE_URL usando IP pública
export DATABASE_URL="postgresql://sermaluc_user:PASSWORD@IP_PUBLICA:5432/sermaluc_db"

# 5. Ejecutar migraciones
npx prisma migrate deploy
npx prisma generate
```

#### Opción C: Desde máquina local con IP autorizada

```bash
# 1. Autorizar tu IP en Cloud SQL
gcloud sql instances patch nomina-sql \
  --authorized-networks=TU_IP_PUBLICA/32

# 2. Configurar DATABASE_URL
export DATABASE_URL="postgresql://sermaluc_user:PASSWORD@IP_PUBLICA:5432/sermaluc_db"

# 3. Ejecutar migraciones
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Opción 2: PostgreSQL Local (Desarrollo)

### Paso 1: Instalar PostgreSQL

#### macOS (usando Homebrew)

```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows

Descargar e instalar desde: https://www.postgresql.org/download/windows/

### Paso 2: Crear Base de Datos Local

```bash
# Conectar a PostgreSQL
psql postgres

# Crear base de datos
CREATE DATABASE sermaluc_db;

# Crear usuario (opcional, puedes usar el usuario por defecto)
CREATE USER sermaluc_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE sermaluc_db TO sermaluc_user;

# Salir
\q
```

### Paso 3: Configurar DATABASE_URL

```bash
# Crear archivo .env en backend/
cd backend
cat > .env << EOF
DATABASE_URL="postgresql://sermaluc_user:tu_password@localhost:5432/sermaluc_db"
GOOGLE_SERVICE_ACCOUNT_KEY="/path/to/service-account-key.json"
FRONTEND_URL="http://localhost:3000"
PORT=3001
EOF
```

### Paso 4: Ejecutar Migraciones

```bash
cd backend

# Ejecutar migraciones
npx prisma migrate dev --name init

# Generar cliente Prisma
npx prisma generate
```

### Paso 5: Verificar (Opcional)

```bash
# Abrir Prisma Studio para ver la base de datos
npx prisma studio

# O conectar directamente
psql -U sermaluc_user -d sermaluc_db
```

## Verificación de la Base de Datos

### Verificar Tablas Creadas

```bash
# Conectar a la base de datos
psql -U sermaluc_user -d sermaluc_db

# Listar tablas
\dt

# Ver estructura de una tabla
\d collaborators

# Ver datos
SELECT * FROM collaborators LIMIT 5;

# Salir
\q
```

### Usando Prisma Studio

```bash
cd backend
npx prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes ver y editar los datos.

## Comandos Útiles de Prisma

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones (producción)
npx prisma migrate deploy

# Resetear base de datos (CUIDADO: borra todos los datos)
npx prisma migrate reset

# Generar cliente Prisma
npx prisma generate

# Ver estado de migraciones
npx prisma migrate status

# Crear migración desde cambios en schema
npx prisma migrate dev --create-only
```

## Troubleshooting

### Error: "Connection refused"

**Cloud SQL:**
- Verifica que Cloud SQL Proxy esté corriendo
- Verifica que la instancia esté activa: `gcloud sql instances list`
- Verifica la IP autorizada

**Local:**
- Verifica que PostgreSQL esté corriendo: `brew services list` (macOS)
- Verifica el puerto: `lsof -i :5432`

### Error: "password authentication failed"

- Verifica el usuario y contraseña
- Para Cloud SQL, verifica que el usuario exista: `gcloud sql users list --instance=nomina-sql`
- Para local, verifica en `pg_hba.conf`

### Error: "database does not exist"

```bash
# Listar bases de datos
gcloud sql databases list --instance=nomina-sql  # Cloud SQL
# o
psql -U postgres -l  # Local
```

### Error: "relation does not exist"

- Las migraciones no se han ejecutado
- Ejecuta: `npx prisma migrate deploy`

### Resetear Base de Datos (Desarrollo)

```bash
# CUIDADO: Esto borra todos los datos
cd backend
npx prisma migrate reset

# Esto ejecutará:
# 1. Drop database
# 2. Create database
# 3. Apply all migrations
# 4. Run seed (si existe)
```

## Configuración para Cloud Run

Cuando despliegues en Cloud Run, la conexión se hace automáticamente usando Unix sockets si configuraste `--add-cloudsql-instances` en el deployment.

El `DATABASE_URL` debe tener este formato:

```
postgresql://usuario:password@/nombre_db?host=/cloudsql/PROJECT_ID:region:instance_name
```

Ejemplo:

```
postgresql://sermaluc_user:password@/sermaluc_db?host=/cloudsql/my-project:us-central1:nomina-sql
```

## Seguridad

### Mejores Prácticas

1. **Nunca commitees contraseñas** - Usa Secret Manager en GCP
2. **Usa contraseñas fuertes** - Mínimo 16 caracteres, mezcla de mayúsculas, minúsculas, números y símbolos
3. **Limita acceso** - Solo da permisos necesarios a usuarios
4. **Usa Cloud SQL Proxy** - Para desarrollo local, nunca expongas la IP pública
5. **Habilita backups** - Cloud SQL lo hace automáticamente si lo configuraste

### Rotar Contraseñas

```bash
# Cambiar contraseña de usuario
gcloud sql users set-password sermaluc_user \
  --instance=nomina-sql \
  --password=NUEVA_PASSWORD_SEGURA

# Actualizar en Secret Manager
echo "postgresql://sermaluc_user:NUEVA_PASSWORD@/sermaluc_db?host=/cloudsql/..." | \
  gcloud secrets versions add database-url --data-file=-
```

## Checklist

- [ ] Instancia Cloud SQL creada (o PostgreSQL local instalado)
- [ ] Base de datos `sermaluc_db` creada
- [ ] Usuario `sermaluc_user` creado con permisos
- [ ] `DATABASE_URL` configurado en `.env`
- [ ] Migraciones ejecutadas (`npx prisma migrate deploy`)
- [ ] Cliente Prisma generado (`npx prisma generate`)
- [ ] Base de datos verificada (Prisma Studio o psql)
- [ ] Backend puede conectarse a la base de datos

## Próximos Pasos

Una vez que la base de datos esté configurada:

1. **Probar conexión desde el backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Ejecutar primera sincronización:**
   ```bash
   curl -X POST http://localhost:3001/internal/sync/collaborators
   ```

3. **Verificar datos en Prisma Studio:**
   ```bash
   npx prisma studio
   ```

