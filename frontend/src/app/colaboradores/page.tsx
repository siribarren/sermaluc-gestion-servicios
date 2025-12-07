'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import api from '@/lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'

async function fetchCollaborators(search?: string, estado?: string) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (estado) params.append('estado', estado)
  
  const res = await api.get(`/collaborators?${params.toString()}`)
  return res.data
}

export default function ColaboradoresPage() {
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['collaborators', search, estadoFilter],
    queryFn: () => fetchCollaborators(search || undefined, estadoFilter || undefined),
  })

  const estados = ['Activo', 'Activo Perú', 'Cambio CC', 'Finiquitado']

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Colaboradores</h1>
        <p className="text-muted-foreground">
          Gestiona y visualiza información de colaboradores
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Buscar por nombre o RUT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p>Cargando colaboradores...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar colaboradores</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data && data.length > 0 ? (
            data.map((collab: any) => (
              <Link key={collab.id} href={`/colaboradores/${collab.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{collab.nombre}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><span className="font-medium">RUT:</span> {collab.rutDni}</p>
                          <p>
                            <span className="font-medium">Estado:</span>{' '}
                            <span className={`px-2 py-1 rounded text-xs ${
                              collab.estado === 'Activo' || collab.estado === 'Activo Perú'
                                ? 'bg-green-100 text-green-800'
                                : collab.estado === 'Finiquitado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {collab.estado}
                            </span>
                          </p>
                          {collab.service && (
                            <p><span className="font-medium">Servicio:</span> {collab.service.name}</p>
                          )}
                          {collab.costCenter && (
                            <p><span className="font-medium">Centro de Costo:</span> {collab.costCenter.name}</p>
                          )}
                          {collab.client && (
                            <p><span className="font-medium">Cliente:</span> {collab.client.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {collab.fechaIngresoSermaluc && (
                          <p>
                            Ingreso: {format(new Date(collab.fechaIngresoSermaluc), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No se encontraron colaboradores
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

