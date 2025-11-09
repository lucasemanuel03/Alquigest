"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Building2, User } from "lucide-react"
import { ContratoDetallado } from "@/types/ContratoDetallado"
import EstadoBadge from "@/components/contratos/estado-badge"
import VencimientoBadge from "@/components/contratos/vencimiento-badge"

type Props = {
  contrato: ContratoDetallado
}

export default function ContratoHistorialCard({ contrato }: Props) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      {/* Header */}
      <CardHeader className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_3fr_auto] items-center">
        {/* Dirección */}
            <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-yellow-700" />
            <div className="flex flex-col">
                <CardTitle className="text-lg md:text-xl font-bold">
                <Link href={`/inmuebles/${contrato.inmuebleId}`} className="hover:text-primary">
                    {contrato.direccionInmueble}
                </Link>
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                <b>Periodo:</b> {contrato.fechaInicio} - {contrato.fechaFin}
                </span>
            </div>
            </div>

        {/* Locador / Locatario */}
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="flex items-center gap-1 text-sm">
            <User className="h-5" />
            <p className="font-medium text-muted-foreground">Locador:</p>
            <p className="font-medium">
              {contrato.apellidoPropietario}, {contrato.nombrePropietario}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <User className="h-5" />
            <p className="font-medium text-muted-foreground">Locatario:</p>
            <p className="font-medium">
              {contrato.apellidoInquilino}, {contrato.nombreInquilino}
            </p>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-2 justify-end sm:justify-end md:justify-end">
          {contrato.estadoContratoId === 1 && (
            <VencimientoBadge fechaFin={contrato.fechaFin} />
          )}
          <EstadoBadge estado={contrato.estadoContratoNombre} />
        </div>
      </CardHeader>

      <CardContent className="transition-max-height duration-300 overflow-hidden">
        <div className="grid grid-cols-1 items-center justify-between pt-4 border-t gap-2 md:flex md:justify-between">
          <div className="flex gap-2">
            <Link href={`/contratos/${contrato.id}`}>
              <Button variant="outline" size="sm">Ver Contrato</Button>
            </Link>
            <Link href={`/alquileres/${contrato.id}/historial-pago-alquiler`}>
              <Button variant="outline" size="sm">Historial Pagos</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
