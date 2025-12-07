'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import api from '@/lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { ArrowLeft } from 'lucide-react'

async function fetchCollaborator(id: string) {
  const res = await api.get(`/collaborators/${id}`)
  return res.data
}

export default function ColaboradorDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['collaborator', id],
    queryFn: () => fetchCollaborator(id),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Cargando...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-destructive">Error al cargar colaborador</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Link href="/colaboradores">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{data.nombre}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">RUT/DNI</p>
              <p className="font-medium">{data.rutDni}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estado</p>
              <span className={`px-2 py-1 rounded text-sm ${
                data.estado === 'Activo' || data.estado === 'Activo Perú'
                  ? 'bg-green-100 text-green-800'
                  : data.estado === 'Finiquitado'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {data.estado}
              </span>
            </div>
            {data.fechaIngresoOficial && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha Ingreso Oficial</p>
                <p className="font-medium">
                  {format(new Date(data.fechaIngresoOficial), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            )}
            {data.fechaIngresoSermaluc && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha Ingreso Sermaluc</p>
                <p className="font-medium">
                  {format(new Date(data.fechaIngresoSermaluc), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            )}
            {data.fechaFiniquito && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha Finiquito</p>
                <p className="font-medium">
                  {format(new Date(data.fechaFiniquito), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            )}
            {data.fechaFinalizacion && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha Finalización</p>
                <p className="font-medium">
                  {format(new Date(data.fechaFinalizacion), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            )}
            {data.service && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Servicio</p>
                <p className="font-medium">{data.service.name}</p>
              </div>
            )}
            {data.costCenter && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Centro de Costo</p>
                <p className="font-medium">{data.costCenter.name}</p>
              </div>
            )}
            {data.client && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                <p className="font-medium">{data.client.name}</p>
              </div>
            )}
            {data.cargo && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cargo</p>
                <p className="font-medium">{data.cargo}</p>
              </div>
            )}
            {data.coordinator && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Coordinador</p>
                <p className="font-medium">{data.coordinator}</p>
              </div>
            )}
            {data.tarifa && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tarifa</p>
                <p className="font-medium">${data.tarifa.toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data.serviceAssignments && data.serviceAssignments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Historial de Asignaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.serviceAssignments.map((assignment: any) => (
                <div key={assignment.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{assignment.service.name}</p>
                      {assignment.costCenter && (
                        <p className="text-sm text-muted-foreground">
                          CC: {assignment.costCenter.name}
                        </p>
                      )}
                      {assignment.client && (
                        <p className="text-sm text-muted-foreground">
                          Cliente: {assignment.client.name}
                        </p>
                      )}
                      {assignment.cargo && (
                        <p className="text-sm text-muted-foreground">
                          Cargo: {assignment.cargo}
                        </p>
                      )}
                      {assignment.coordinator && (
                        <p className="text-sm text-muted-foreground">
                          Coordinador: {assignment.coordinator}
                        </p>
                      )}
                      {assignment.tarifa && (
                        <p className="text-sm text-muted-foreground">
                          Tarifa: ${assignment.tarifa.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>
                        Desde: {format(new Date(assignment.fechaCambio), 'dd/MM/yyyy', { locale: es })}
                      </p>
                      {assignment.fechaFinalizacion && (
                        <p>
                          Hasta: {format(new Date(assignment.fechaFinalizacion), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.changeLogs && data.changeLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Cambios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.changeLogs.map((log: any) => (
                <div key={log.id} className="flex justify-between items-start p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium">{log.field}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.oldValue} → {log.newValue}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tipo: {log.changeType} | Fuente: {log.source}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

