'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'

async function fetchSyncHealth() {
  const res = await api.get('/internal/sync/health')
  return res.data
}

export default function SyncPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sync-health'],
    queryFn: fetchSyncHealth,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSyncTypeLabel = (type: string) => {
    switch (type) {
      case 'master_sheet':
        return 'Master Sheet'
      case 'hr_sheet_chile':
        return 'HR Sheet - Chile'
      case 'hr_sheet_peru':
        return 'HR Sheet - Perú'
      default:
        return type
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Estado de Sincronización</h1>
        <p className="text-muted-foreground">
          Monitorea el estado de las sincronizaciones con Google Sheets
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p>Cargando estado de sincronización...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar estado de sincronización</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data && data.length > 0 ? (
            data.map((sync: any) => (
              <Card key={sync.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{getSyncTypeLabel(sync.syncType)}</CardTitle>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sync.status)}`}>
                      {sync.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Registros Procesados</p>
                      <p className="text-2xl font-bold">{sync.recordsProcessed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Creados</p>
                      <p className="text-2xl font-bold text-green-600">{sync.recordsCreated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Actualizados</p>
                      <p className="text-2xl font-bold text-blue-600">{sync.recordsUpdated}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <p>
                        Iniciado: {format(new Date(sync.startedAt), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </p>
                      {sync.completedAt && (
                        <p>
                          Completado: {format(new Date(sync.completedAt), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                        </p>
                      )}
                    </div>
                    {sync.errors && (
                      <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-800 mb-1">Errores:</p>
                        <pre className="text-xs text-red-600 overflow-auto">
                          {JSON.stringify(sync.errors, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No hay registros de sincronización
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

