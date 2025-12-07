# Guía para Subir a Git

## Opción 1: Usar el Script Automático

Ejecuta el script que crea los comandos necesarios:

```bash
bash deploy-to-git.sh
```

El script te guiará paso a paso para:
- Inicializar Git (si no está inicializado)
- Agregar archivos
- Hacer commit
- Configurar remote
- Hacer push

## Opción 2: Comandos Manuales

### Paso 1: Inicializar Git (si no está inicializado)

```bash
cd "/Users/simoniribarren/Library/Mobile Documents/com~apple~CloudDocs/sermaluc-gestion-servicios"
git init
git branch -M main
```

### Paso 2: Agregar Archivos

```bash
git add .
```

### Paso 3: Verificar qué se va a commitear

```bash
git status
```

### Paso 4: Hacer Commit

```bash
git commit -m "Initial commit: Sermaluc Gestión de Servicios"
```

### Paso 5: Configurar Remote

#### Para GitHub:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
```

#### Para Cloud Source Repositories (GCP):

```bash
# Primero obtén tu PROJECT_ID
PROJECT_ID=$(gcloud config get-value project)

# Agrega el remote
git remote add google https://source.developers.google.com/p/${PROJECT_ID}/r/sermaluc-gestion-servicios
```

### Paso 6: Hacer Push

#### Para GitHub:

```bash
git push -u origin main
```

#### Para Cloud Source Repositories:

```bash
git push -u google main
```

## Verificar Estado

```bash
# Ver estado del repositorio
git status

# Ver remotes configurados
git remote -v

# Ver historial de commits
git log --oneline
```

## Archivos que NO se suben (gracias a .gitignore)

- `node_modules/` - Dependencias de Node.js
- `.env*` - Archivos de variables de entorno
- `*.log` - Archivos de log
- Service account keys - Credenciales de Google
- Archivos de build - `.next/`, `dist/`, etc.

## Próximos Pasos Después del Push

1. **Si usas GitHub**: Configura Cloud Build trigger para GitHub
2. **Si usas Cloud Source Repositories**: El trigger ya debería estar configurado
3. **Monitorea el build**: `gcloud builds list`
4. **Verifica el deployment**: Los servicios se desplegarán automáticamente

## Troubleshooting

### Error: "remote origin already exists"

```bash
# Ver remotes actuales
git remote -v

# Si quieres cambiar el URL del remote
git remote set-url origin NUEVO_URL

# O eliminar y recrear
git remote remove origin
git remote add origin NUEVO_URL
```

### Error: "fatal: refusing to merge unrelated histories"

```bash
# Si estás haciendo push a un repositorio que ya tiene contenido
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: "Permission denied"

- Verifica que tengas permisos de escritura en el repositorio
- Para GitHub, verifica tu token de acceso
- Para Cloud Source Repositories, verifica que tengas permisos IAM

## Comandos Útiles

```bash
# Ver qué archivos están siendo rastreados
git ls-files

# Ver diferencias antes de commitear
git diff

# Deshacer cambios en archivos específicos
git restore archivo.txt

# Ver historial completo
git log

# Crear una nueva rama
git checkout -b nombre-rama

# Cambiar de rama
git checkout main
```

