# Guía de Setup Local - Sermaluc Gestión de Servicios

Esta guía te ayudará a configurar el proyecto localmente para desarrollo.

## Prerrequisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior (o acceso a Cloud SQL)
- npm o yarn
- Cuenta de Google Cloud con acceso a Google Sheets API
- Archivo de credenciales de Service Account de Google

## Paso 1: Clonar y Configurar el Proyecto

```bash
# Navegar al directorio del proyecto
cd sermaluc-gestion-servicios
```

## Paso 2: Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cat > .env << EOF
DATABASE_URL="postgresql://usuario:password@localhost:5432/sermaluc_db"
GOOGLE_SERVICE_ACCOUNT_KEY="/ruta/a/tu/service-account-key.json"
FRONTEND_URL="http://localhost:3000"
PORT=3001
EOF

# Editar .env con tus credenciales reales
```

### Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb sermaluc_db

# O si usas Cloud SQL, configurar Cloud SQL Proxy
# cloud-sql-proxy PROJECT_ID:us-central1:nomina-sql

# Ejecutar migraciones
npx prisma migrate dev --name init

# Generar cliente Prisma
npx prisma generate
```

### Iniciar Backend

```bash
# Modo desarrollo (con hot reload)
npm run start:dev

# El backend estará disponible en http://localhost:3001
```

## Paso 3: Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
```

### Iniciar Frontend

```bash
# Modo desarrollo
npm run dev

# El frontend estará disponible en http://localhost:3000
```

## Paso 4: Configurar Google Sheets API

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto o seleccionar uno existente
3. Habilitar Google Sheets API
4. Crear una cuenta de servicio:
   - Ir a IAM & Admin > Service Accounts
   - Crear nueva cuenta de servicio
   - Descargar clave JSON
5. Compartir las hojas de Google Sheets con el email de la cuenta de servicio:
   - Master Sheet: Dar acceso de "Editor"
   - HR Sheets: Dar acceso de "Lector"

## Paso 5: Probar la Sincronización

Una vez que ambos servicios estén corriendo:

```bash
# Ejecutar sincronización manualmente
curl -X POST http://localhost:3001/internal/sync/collaborators

# Ver estado de sincronización
curl http://localhost:3001/internal/sync/health
```

## Estructura de Archivos Importantes

```
backend/
├── .env                    # Variables de entorno (crear manualmente)
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
└── src/
    └── modules/
        └── sync/          # Módulo de sincronización

frontend/
├── .env.local             # Variables de entorno (crear manualmente)
└── src/
    └── app/               # Páginas de Next.js
```

## Comandos Útiles

### Backend

```bash
# Ver base de datos en Prisma Studio
npm run prisma:studio

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos (CUIDADO: borra todos los datos)
npx prisma migrate reset

# Generar cliente Prisma después de cambios en schema
npx prisma generate
```

### Frontend

```bash
# Build para producción
npm run build

# Ejecutar producción localmente
npm run start

# Linter
npm run lint
```

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
cd backend
npx prisma generate
```

### Error: "Database connection failed"

- Verificar que PostgreSQL esté corriendo
- Verificar DATABASE_URL en .env
- Si usas Cloud SQL, verificar que Cloud SQL Proxy esté corriendo

### Error: "Google Sheets API authentication failed"

- Verificar que GOOGLE_SERVICE_ACCOUNT_KEY apunte al archivo correcto
- Verificar que la cuenta de servicio tenga acceso a las hojas
- Verificar que Google Sheets API esté habilitada

### Error: CORS en frontend

- Verificar que FRONTEND_URL en backend .env sea correcta
- Verificar que NEXT_PUBLIC_API_URL en frontend .env sea correcta

## Próximos Pasos

1. Ejecutar primera sincronización
2. Verificar datos en Prisma Studio
3. Explorar la interfaz en http://localhost:3000
4. Revisar logs del backend para cualquier error

## Desarrollo

Para desarrollo activo:

1. Backend: `npm run start:dev` (hot reload activo)
2. Frontend: `npm run dev` (hot reload activo)
3. Prisma Studio: `npm run prisma:studio` (para ver/editar datos)

