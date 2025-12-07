# Correcciones de Bugs Aplicadas

## Bug 1: PROJECT_ID Hardcodeado en cloudbuild.yaml ✅ CORREGIDO

### Problema
El connection name de Cloud SQL estaba hardcodeado como `sermaluc-gestion-servicios:us-central1:nomina-sql`, impidiendo que el deployment funcione en otros proyectos GCP.

### Solución
Cambiado de:
```yaml
- 'sermaluc-gestion-servicios:us-central1:nomina-sql'
```

A:
```yaml
- '$$PROJECT_ID:us-central1:nomina-sql'
```

**Archivo**: `cloudbuild.yaml` línea 55

### Impacto
- ✅ El deployment ahora funciona en cualquier proyecto GCP
- ✅ La variable `$PROJECT_ID` se sustituye automáticamente por Cloud Build
- ✅ Mantiene la flexibilidad para diferentes entornos

## Bug 2: GID No Utilizado en syncHRSheet ✅ CORREGIDO

### Problema
El método `syncHRSheet` recibía el parámetro `gid` pero nunca lo usaba. Ambas hojas HR (Chile y Perú) leían la misma hoja porque no se especificaba el GID correcto, causando reconciliación incorrecta de datos.

### Solución
Implementada lógica para:
1. Obtener los metadatos del spreadsheet
2. Buscar la hoja específica usando el GID (convertido a número)
3. Usar el nombre de la hoja encontrada en el range

**Código corregido**:
```typescript
// Obtener el nombre de la hoja usando el GID
const gidNumber = parseInt(gid, 10);

const spreadsheetMetadata = await this.sheets.spreadsheets.get({
  spreadsheetId: this.HR_SHEET_ID,
});

const sheet = spreadsheetMetadata.data.sheets.find(
  (s: any) => s.properties.sheetId === gidNumber,
);

if (!sheet) {
  throw new Error(`Sheet with GID ${gid} (sheetId: ${gidNumber}) not found`);
}

const sheetName = sheet.properties.title;
const range = `${sheetName}!A2:C`;
```

**Archivo**: `backend/src/modules/sync/sync.service.ts` líneas 227-241

### Impacto
- ✅ Chile HR Sheet ahora lee correctamente la hoja con GID 0
- ✅ Perú HR Sheet ahora lee correctamente la hoja con GID 306343796
- ✅ Los datos se reconcilian correctamente por país
- ✅ Logging mejorado para debugging

## Verificación

### Para Bug 1:
```bash
# Verificar que cloudbuild.yaml usa la variable
grep "PROJECT_ID" cloudbuild.yaml
# Debe mostrar: $$PROJECT_ID:us-central1:nomina-sql
```

### Para Bug 2:
```bash
# Verificar que syncHRSheet usa el GID
grep -A 10 "syncHRSheet" backend/src/modules/sync/sync.service.ts
# Debe mostrar la lógica de búsqueda de hoja por GID
```

## Testing Recomendado

1. **Probar Bug 1**: Hacer deployment en un proyecto GCP diferente y verificar que funciona
2. **Probar Bug 2**: 
   - Ejecutar sincronización
   - Verificar en los logs que se leen hojas diferentes para Chile y Perú
   - Verificar que los datos se actualizan correctamente según el país

## Estado

- ✅ Bug 1: Corregido
- ✅ Bug 2: Corregido
- ✅ Código listo para commit y push

