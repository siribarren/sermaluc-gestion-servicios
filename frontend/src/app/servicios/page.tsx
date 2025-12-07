'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'

async function fetchServices() {
  const res = await api.get('/services')
  return res.data
}

export default function ServiciosPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  })

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Servicios</h1>
        <p className="text-muted-foreground">
          Lista de servicios activos
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p>Cargando servicios...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar servicios</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data && data.length > 0 ? (
            data.map((service: any) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {service._count?.collaborators || 0} colaborador(es)
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No se encontraron servicios
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

