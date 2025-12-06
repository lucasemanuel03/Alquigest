
"use client"

import RegistrarPago from "@/components/registrar-pago"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Building2, User } from "lucide-react"

export default function NuevoPagoPage({direccionInmueble, nombreInquilino, apellidoInquilino}: {direccionInmueble: string, nombreInquilino: string, apellidoInquilino: string}) {
  return (
    <div className="min-h-screen bg-background pt-25 sm:pt-28">
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Registrar Pago de Servicios</h1>
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle className="mx-5">
              Datos del Alquiler
            </CardTitle>
            <CardContent className="flex flex-col gap-3">
              <div className="flex gap-2 items-center">
                <Building2 className="h-5 w-5"/>
                <p className="font-semibold">{direccionInmueble}</p>
              </div>
              <div className="flex gap-2 items-center">
                <User className="h-5 w-5"/>
                <p className="font-semibold">Locatario: </p>
                <p>{apellidoInquilino}, {nombreInquilino}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardTitle className="mx-5">
              <p>Servicios A Pagar</p>
            </CardTitle>
            <CardContent>
              <RegistrarPago />
            </CardContent>
          </Card>
        </div>
        
        
      </main>
    </div>
  )
}
