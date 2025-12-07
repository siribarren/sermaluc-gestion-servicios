# Diagramas del Sistema - Sermaluc Gestión de Servicios

## Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Fuentes de Datos"
        MS[Master Sheet<br/>Google Sheets<br/>Full Access]
        HRC[HR Payroll Sheet<br/>Chile<br/>Read Only]
        HRP[HR Payroll Sheet<br/>Perú<br/>Read Only]
    end

    subgraph "Google Cloud Platform"
        subgraph "Cloud Run"
            BE[Backend<br/>NestJS + Prisma<br/>gestion-backend]
            FE[Frontend<br/>Next.js + Tailwind<br/>gestion-frontend]
        end

        subgraph "Base de Datos"
            DB[(Cloud SQL<br/>PostgreSQL<br/>nomina-sql)]
        end

        subgraph "Servicios GCP"
            CS[Cloud Scheduler<br/>Sincronización Periódica]
            SM[Secret Manager<br/>Credenciales]
            AR[Artifact Registry<br/>Docker Images]
            CB[Cloud Build<br/>CI/CD Pipeline]
        end
    end

    subgraph "Usuarios"
        ADMIN[Administradores]
        HR[Recursos Humanos]
        COORD[Coordinadores]
    end

    MS -->|Sync API| BE
    HRC -->|Sync API| BE
    HRP -->|Sync API| BE
    
    CS -->|POST /internal/sync/collaborators| BE
    BE -->|Upsert| DB
    BE -->|Read/Write| DB
    
    FE -->|API Calls| BE
    BE -->|Query| DB
    
    ADMIN -->|Navegar| FE
    HR -->|Consultar| FE
    COORD -->|Gestionar| FE
    
    CB -->|Build & Deploy| BE
    CB -->|Build & Deploy| FE
    CB -->|Push Images| AR
    
    BE -.->|Lee Secretos| SM
    FE -.->|Config| SM

    style MS fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style HRC fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style HRP fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style BE fill:#0056CC,stroke:#333,stroke-width:2px,color:#fff
    style FE fill:#0056CC,stroke:#333,stroke-width:2px,color:#fff
    style DB fill:#336791,stroke:#333,stroke-width:2px,color:#fff
```

## Flujo de Sincronización de Datos

```mermaid
sequenceDiagram
    participant CS as Cloud Scheduler
    participant BE as Backend API
    participant GS as Google Sheets API
    participant DB as Cloud SQL
    participant CL as ChangeLog

    Note over CS: Cada 6 horas
    CS->>BE: POST /internal/sync/collaborators
    
    activate BE
    BE->>BE: syncMasterSheet()
    BE->>GS: Leer Master Sheet
    GS-->>BE: Datos de colaboradores
    
    loop Para cada fila
        BE->>DB: Buscar colaborador por RUT
        alt Colaborador existe
            BE->>BE: Detectar cambios
            BE->>CL: Registrar cambios
            BE->>DB: Actualizar colaborador
        else Colaborador nuevo
            BE->>DB: Crear colaborador
        end
        
        BE->>DB: Upsert CostCenter
        BE->>DB: Upsert Service
        BE->>DB: Upsert Client
        
        alt Hay cambio de servicio
            BE->>DB: Crear ServiceAssignment
        end
    end
    
    BE->>DB: Crear SyncLog (success)
    deactivate BE
    
    BE->>BE: syncHRSheets()
    BE->>GS: Leer HR Sheet Chile
    GS-->>BE: Datos HR Chile
    BE->>DB: Reconciliar fecha ingreso oficial
    
    BE->>GS: Leer HR Sheet Perú
    GS-->>BE: Datos HR Perú
    BE->>DB: Reconciliar fecha ingreso oficial
    
    BE-->>CS: Sync completado
```

## Arquitectura de Base de Datos

```mermaid
erDiagram
    COLLABORATOR ||--o{ SERVICE_ASSIGNMENT : "tiene"
    COLLABORATOR ||--o{ CHANGE_LOG : "registra"
    COLLABORATOR }o--|| COST_CENTER : "asignado a"
    COLLABORATOR }o--|| SERVICE : "trabaja en"
    COLLABORATOR }o--o| CLIENT : "asignado a"
    SERVICE ||--o{ SERVICE_ASSIGNMENT : "historial"
    
    COLLABORATOR {
        uuid id PK
        string rut_dni UK
        string nombre
        string estado
        datetime fecha_ingreso_oficial
        datetime fecha_ingreso_sermaluc
        datetime fecha_finiquito
        datetime fecha_finalizacion
        uuid cost_center_id FK
        uuid service_id FK
        uuid client_id FK
        string cargo
        string coordinator
        decimal tarifa
    }
    
    SERVICE_ASSIGNMENT {
        uuid id PK
        uuid collaborator_id FK
        uuid service_id FK
        uuid cost_center_id FK
        uuid client_id FK
        datetime fecha_cambio
        datetime fecha_finalizacion
        decimal tarifa
        string cargo
        string coordinator
    }
    
    CHANGE_LOG {
        uuid id PK
        uuid collaborator_id FK
        string field
        string old_value
        string new_value
        string change_type
        string source
        datetime created_at
    }
    
    COST_CENTER {
        uuid id PK
        string code UK
        string name
    }
    
    SERVICE {
        uuid id PK
        string name UK
    }
    
    CLIENT {
        uuid id PK
        string name UK
    }
    
    SYNC_LOG {
        uuid id PK
        string sync_type
        string status
        int records_processed
        int records_created
        int records_updated
        json errors
        datetime started_at
        datetime completed_at
    }
```

## Flujo de Usuario - Gestión de Colaboradores

```mermaid
journey
    title Flujo de Usuario: Consultar Colaboradores
    section Acceso
      Abrir aplicación: 5: Usuario
      Ver página principal: 5: Usuario
    section Navegación
      Click en "Colaboradores": 5: Usuario
      Cargar lista de colaboradores: 4: Sistema
    section Búsqueda
      Aplicar filtros: 5: Usuario
      Buscar por nombre/RUT: 5: Usuario
      Ver resultados filtrados: 4: Sistema
    section Detalle
      Click en colaborador: 5: Usuario
      Ver información completa: 4: Sistema
      Ver historial asignaciones: 4: Sistema
      Ver historial cambios: 4: Sistema
```

## Pipeline CI/CD

```mermaid
graph LR
    subgraph "Repositorio Git"
        GH[GitHub / Cloud Source<br/>Repositories]
    end
    
    subgraph "Cloud Build"
        TRIG[Trigger<br/>Push a main]
        BUILD1[Build Backend<br/>Docker Image]
        BUILD2[Build Frontend<br/>Docker Image]
        PUSH1[Push Backend<br/>Artifact Registry]
        PUSH2[Push Frontend<br/>Artifact Registry]
        DEP1[Deploy Backend<br/>Cloud Run]
        DEP2[Deploy Frontend<br/>Cloud Run]
    end
    
    subgraph "Producción"
        CR1[Cloud Run<br/>gestion-backend]
        CR2[Cloud Run<br/>gestion-frontend]
    end
    
    GH -->|Push| TRIG
    TRIG --> BUILD1
    TRIG --> BUILD2
    BUILD1 --> PUSH1
    BUILD2 --> PUSH2
    PUSH1 --> DEP1
    PUSH2 --> DEP2
    DEP1 --> CR1
    DEP2 --> CR2
    
    style GH fill:#24292e,stroke:#333,stroke-width:2px,color:#fff
    style TRIG fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style CR1 fill:#0056CC,stroke:#333,stroke-width:2px,color:#fff
    style CR2 fill:#0056CC,stroke:#333,stroke-width:2px,color:#fff
```

## Proceso de Negocio - Gestión de Colaboradores

```mermaid
flowchart TD
    START([Inicio del Proceso])
    
    subgraph "Fuentes de Datos"
        MS[Master Sheet<br/>Actualización Manual]
        HR[HR Sheets<br/>Datos Oficiales]
    end
    
    subgraph "Sincronización Automática"
        SCHED[Cloud Scheduler<br/>Cada 6 horas]
        SYNC[Proceso de Sincronización]
        VALID[Validación y Normalización]
    end
    
    subgraph "Base de Datos"
        DB[(PostgreSQL<br/>Datos Normalizados)]
        HIST[Historial de Cambios]
    end
    
    subgraph "Usuarios del Sistema"
        VIEW[Visualizar Colaboradores]
        FILTER[Filtrar y Buscar]
        DETAIL[Ver Detalles]
    end
    
    START --> MS
    START --> HR
    
    MS --> SCHED
    HR --> SCHED
    
    SCHED -->|Trigger| SYNC
    SYNC --> VALID
    
    VALID -->|Nuevos| DB
    VALID -->|Actualizaciones| DB
    VALID -->|Cambios Detectados| HIST
    
    DB --> VIEW
    VIEW --> FILTER
    FILTER --> DETAIL
    
    DETAIL --> END([Fin])
    
    style MS fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style HR fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style DB fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    style SCHED fill:#34A853,stroke:#333,stroke-width:2px,color:#fff
```

## Arquitectura de Componentes - Backend

```mermaid
graph TB
    subgraph "NestJS Backend"
        MAIN[main.ts<br/>Bootstrap]
        
        subgraph "Módulos"
            COLLAB[CollaboratorsModule<br/>Gestión Colaboradores]
            SYNC[SyncModule<br/>Sincronización]
            SERV[ServicesModule<br/>Servicios]
            CLIENTS[ClientsModule<br/>Clientes]
        end
        
        subgraph "Common"
            PRISMA[PrismaModule<br/>Database Client]
            CONFIG[ConfigModule<br/>Variables Entorno]
        end
        
        subgraph "Controllers"
            COLLAB_CTRL[CollaboratorsController<br/>GET /collaborators]
            SYNC_CTRL[SyncController<br/>POST /internal/sync]
        end
        
        subgraph "Services"
            COLLAB_SVC[CollaboratorsService<br/>Lógica Negocio]
            SYNC_SVC[SyncService<br/>Google Sheets API]
        end
    end
    
    subgraph "External"
        GS[Google Sheets API]
        DB[(Prisma Client<br/>PostgreSQL)]
    end
    
    MAIN --> COLLAB
    MAIN --> SYNC
    MAIN --> SERV
    MAIN --> CLIENTS
    
    COLLAB --> COLLAB_CTRL
    COLLAB --> COLLAB_SVC
    SYNC --> SYNC_CTRL
    SYNC --> SYNC_SVC
    
    COLLAB_SVC --> PRISMA
    SYNC_SVC --> PRISMA
    SYNC_SVC --> GS
    
    PRISMA --> DB
    
    CONFIG --> SYNC_SVC
    
    style MAIN fill:#E0234E,stroke:#333,stroke-width:2px,color:#fff
    style SYNC_SVC fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style DB fill:#336791,stroke:#333,stroke-width:2px,color:#fff
```

## Arquitectura de Componentes - Frontend

```mermaid
graph TB
    subgraph "Next.js Frontend"
        LAYOUT[Layout<br/>Root Layout]
        HEADER[Header<br/>Navegación]
        LOGO[Logo<br/>Sermaluc]
        
        subgraph "Páginas"
            HOME[Home<br/>Dashboard]
            COLLAB[Colaboradores<br/>Lista y Filtros]
            COLLAB_DET[Detalle Colaborador<br/>Información Completa]
            SERV[Servicios<br/>Lista Servicios]
            SYNC_PAGE[Sincronización<br/>Estado Sync]
        end
        
        subgraph "Componentes UI"
            CARD[Card]
            BUTTON[Button]
            INPUT[Input]
        end
        
        subgraph "Librerías"
            RQ[React Query<br/>Data Fetching]
            API[API Client<br/>Axios]
        end
    end
    
    subgraph "Backend API"
        BE_API[Backend NestJS<br/>REST API]
    end
    
    LAYOUT --> HEADER
    HEADER --> LOGO
    
    LAYOUT --> HOME
    LAYOUT --> COLLAB
    LAYOUT --> COLLAB_DET
    LAYOUT --> SERV
    LAYOUT --> SYNC_PAGE
    
    COLLAB --> CARD
    COLLAB --> INPUT
    COLLAB_DET --> CARD
    SYNC_PAGE --> CARD
    
    COLLAB --> RQ
    COLLAB_DET --> RQ
    SERV --> RQ
    SYNC_PAGE --> RQ
    
    RQ --> API
    API --> BE_API
    
    style LAYOUT fill:#000000,stroke:#333,stroke-width:2px,color:#fff
    style HEADER fill:#0056CC,stroke:#333,stroke-width:2px,color:#fff
    style BE_API fill:#E0234E,stroke:#333,stroke-width:2px,color:#fff
```

## Flujo de Datos - Sincronización Completa

```mermaid
flowchart TD
    START([Cloud Scheduler<br/>Trigger])
    
    subgraph "Master Sheet Sync"
        MS1[Leer Master Sheet]
        MS2[Parsear Filas]
        MS3[Validar Datos]
        MS4[Upsert Colaboradores]
        MS5[Detectar Cambios]
        MS6[Crear ChangeLog]
        MS7[Crear ServiceAssignment]
    end
    
    subgraph "HR Sheets Sync"
        HR1[Leer HR Sheet Chile]
        HR2[Leer HR Sheet Perú]
        HR3[Reconciliar RUT/DNI]
        HR4[Actualizar fecha_ingreso_oficial]
    end
    
    subgraph "Finalización"
        LOG[Crear SyncLog]
        SUCCESS[Estado: Success]
        ERROR[Estado: Error]
    end
    
    START --> MS1
    MS1 --> MS2
    MS2 --> MS3
    MS3 --> MS4
    MS4 --> MS5
    MS5 --> MS6
    MS5 --> MS7
    
    MS7 --> HR1
    HR1 --> HR2
    HR2 --> HR3
    HR3 --> HR4
    
    HR4 --> LOG
    LOG --> SUCCESS
    
    MS3 -->|Error| ERROR
    HR3 -->|Error| ERROR
    ERROR --> LOG
    
    SUCCESS --> END([Fin])
    ERROR --> END
    
    style START fill:#34A853,stroke:#333,stroke-width:2px,color:#fff
    style SUCCESS fill:#34A853,stroke:#333,stroke-width:2px,color:#fff
    style ERROR fill:#EA4335,stroke:#333,stroke-width:2px,color:#fff
```

## Modelo de Datos - Relaciones Principales

```mermaid
classDiagram
    class Collaborator {
        +UUID id
        +String rutDni
        +String nombre
        +String estado
        +DateTime fechaIngresoOficial
        +DateTime fechaIngresoSermaluc
        +DateTime fechaFiniquito
        +DateTime fechaFinalizacion
        +String cargo
        +String coordinator
        +Decimal tarifa
        +getServiceAssignments()
        +getChangeLogs()
    }
    
    class ServiceAssignment {
        +UUID id
        +DateTime fechaCambio
        +DateTime fechaFinalizacion
        +Decimal tarifa
        +String cargo
        +String coordinator
    }
    
    class ChangeLog {
        +UUID id
        +String field
        +String oldValue
        +String newValue
        +String changeType
        +String source
        +DateTime createdAt
    }
    
    class Service {
        +UUID id
        +String name
    }
    
    class CostCenter {
        +UUID id
        +String code
        +String name
    }
    
    class Client {
        +UUID id
        +String name
    }
    
    class SyncLog {
        +UUID id
        +String syncType
        +String status
        +Int recordsProcessed
        +Int recordsCreated
        +Int recordsUpdated
        +Json errors
        +DateTime startedAt
        +DateTime completedAt
    }
    
    Collaborator "1" --> "*" ServiceAssignment
    Collaborator "1" --> "*" ChangeLog
    Collaborator "1" --> "0..1" Service
    Collaborator "1" --> "0..1" CostCenter
    Collaborator "1" --> "0..1" Client
    Service "1" --> "*" ServiceAssignment
```

## Seguridad y Accesos

```mermaid
graph TB
    subgraph "Google Cloud Platform"
        subgraph "IAM & Permissions"
            SA1[Cloud Build<br/>Service Account]
            SA2[Cloud Run<br/>Service Account]
            SA3[Cloud Scheduler<br/>Service Account]
        end
        
        subgraph "Secret Manager"
            SEC1[DATABASE_URL]
            SEC2[GOOGLE_SERVICE_ACCOUNT_KEY]
            SEC3[FRONTEND_URL]
            SEC4[NEXT_PUBLIC_API_URL]
        end
        
        subgraph "Resources"
            CR[Cloud Run Services]
            CSQL[Cloud SQL]
            AR[Artifact Registry]
        end
    end
    
    SA1 -->|secretAccessor| SEC1
    SA1 -->|secretAccessor| SEC2
    SA1 -->|run.admin| CR
    SA1 -->|artifactregistry.writer| AR
    SA1 -->|cloudsql.client| CSQL
    
    SA2 -->|secretAccessor| SEC1
    SA2 -->|secretAccessor| SEC2
    SA2 -->|cloudsql.client| CSQL
    
    SA3 -->|run.invoker| CR
    
    style SA1 fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style SA2 fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style SA3 fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff
    style SEC1 fill:#EA4335,stroke:#333,stroke-width:2px,color:#fff
    style SEC2 fill:#EA4335,stroke:#333,stroke-width:2px,color:#fff
```

