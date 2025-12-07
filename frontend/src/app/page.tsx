import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Gestión de Servicios
          </h1>
          <p className="text-lg text-muted-foreground">
            Sistema de gestión de colaboradores y servicios
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link href="/colaboradores">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Colaboradores</CardTitle>
                <CardDescription>
                  Gestiona y visualiza información de colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ver lista completa de colaboradores, estados y asignaciones
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/servicios">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Servicios</CardTitle>
                <CardDescription>
                  Administra servicios y asignaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualiza servicios activos y sus colaboradores
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/sync">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Sincronización</CardTitle>
                <CardDescription>
                  Estado de sincronización con Google Sheets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitorea el estado de las sincronizaciones
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

