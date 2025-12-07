# Sermaluc - Gestión de Servicios

Sistema profesional de gestión de colaboradores y servicios para Sermaluc, desplegado en Google Cloud Platform.

## Arquitectura

- **Backend**: NestJS + TypeScript + Prisma (PostgreSQL)
- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Deployment**: Google Cloud Platform (Cloud Run)
- **Database**: Cloud SQL (PostgreSQL) - Instancia: `nomina-sql`
- **CI/CD**: Cloud Build
- **Scheduler**: Cloud Scheduler (sincronización periódica)

## Estructura del Proyecto

```
sermaluc-gestion-servicios/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── collaborators/
│   │   │   ├── services/
│   │   │   ├── clients/
│   │   │   └── sync/
│   │   ├── common/
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── Dockerfile
│   └── package.json
├── cloudbuild.yaml          # CI/CD Pipeline
└── README.md
```

## Setup Local

### Prerrequisitos

- Node.js 20+
- PostgreSQL (local o Cloud SQL)
- Cuenta de servicio de Google con acceso a Google Sheets API
- Credenciales de Google Cloud Platform

### Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Configurar base de datos
npx prisma migrate dev
npx prisma generate

# Iniciar servidor de desarrollo
npm run start:dev
```

El backend estará disponible en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con NEXT_PUBLIC_API_URL

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Variables de Entorno

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sermaluc_db"
GOOGLE_SERVICE_ACCOUNT_KEY="/path/to/service-account-key.json"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

### Frontend (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Google Sheets Integration

El sistema se sincroniza con las siguientes hojas de Google Sheets:

1. **Master Sheet** (Full Access)
   - URL: `https://docs.google.com/spreadsheets/d/1TA-fkVC7T7dlBa9VWIPOIeSEOosDk_Cd1-VFKERByng/edit?gid=269393876#gid=269393876`
   - Contiene: Asignaciones de colaboradores y actualizaciones a nivel de servicio

2. **HR Payroll Sheet - Chile** (Read Only)
   - URL: `https://docs.google.com/spreadsheets/d/1UhHy65woxg5h9TLOvKY3qWqU77npKuQQKP8in5PaPb8/edit?gid=0#gid=0`
   - Contiene: Información oficial de HR de colaboradores chilenos

3. **HR Payroll Sheet - Perú** (Read Only)
   - URL: `https://docs.google.com/spreadsheets/d/1UhHy65woxg5h9TLOvKY3qWqU77npKuQQKP8in5PaPb8/edit?gid=306343796#gid=306343796`
   - Contiene: Información oficial de HR de colaboradores peruanos

## Sincronización

La sincronización se ejecuta mediante:

1. **Endpoint interno**: `POST /internal/sync/collaborators`
2. **Cloud Scheduler**: Configurado para ejecutar periódicamente el endpoint

Para ejecutar manualmente:

```bash
curl -X POST http://localhost:3001/internal/sync/collaborators
```

## Deployment

El sistema se despliega automáticamente mediante Cloud Build cuando se hace push a la rama principal.

### Configuración de Cloud Build

1. Conectar repositorio a Cloud Build
2. Configurar triggers para la rama principal
3. Configurar Secret Manager con:
   - `DATABASE_URL`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`
   - `FRONTEND_URL`
   - `NEXT_PUBLIC_API_URL`

### Servicios Cloud Run

- **gestion-backend**: Backend API
- **gestion-frontend**: Frontend Next.js

### Cloud Scheduler

Configurar un job para ejecutar periódicamente:

```bash
gcloud scheduler jobs create http sync-collaborators \
  --schedule="0 */6 * * *" \
  --uri="https://gestion-backend-XXXXX.run.app/internal/sync/collaborators" \
  --http-method=POST \
  --oidc-service-account-email=YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com
```

## Brand Guidelines

- **Fuente**: Rubik (SemiBold/Bold para títulos, Regular para cuerpo)
- **Color primario**: #0072FF
- **UI**: Limpia, moderna, legible y accesible
- **Componentes**: Tailwind CSS + shadcn/ui

## Desarrollo

### Scripts Disponibles

**Backend:**
- `npm run start:dev` - Desarrollo con hot reload
- `npm run build` - Compilar para producción
- `npm run start:prod` - Ejecutar producción
- `npm run prisma:studio` - Abrir Prisma Studio
- `npm run prisma:migrate` - Ejecutar migraciones

**Frontend:**
- `npm run dev` - Desarrollo
- `npm run build` - Compilar para producción
- `npm run start` - Ejecutar producción

## Base de Datos

### Modelos Principales

- **Collaborator**: Información de colaboradores
- **Service**: Servicios
- **CostCenter**: Centros de costo
- **Client**: Clientes
- **ServiceAssignment**: Historial de asignaciones
- **ChangeLog**: Registro de cambios
- **SyncLog**: Logs de sincronización

## API Endpoints

### Colaboradores
- `GET /collaborators` - Lista de colaboradores (con filtros)
- `GET /collaborators/:id` - Detalle de colaborador
- `GET /collaborators/rut/:rutDni` - Buscar por RUT

### Servicios
- `GET /services` - Lista de servicios

### Clientes
- `GET /clients` - Lista de clientes

### Sincronización
- `POST /internal/sync/collaborators` - Ejecutar sincronización
- `GET /internal/sync/health` - Estado de sincronizaciones

## Licencia

Privado - Sermaluc

