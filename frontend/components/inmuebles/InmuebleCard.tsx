"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Eye, MapPin, PenBox, Ruler, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Inmueble } from "@/types/Inmueble"
import { TIPOS_INMUEBLES, ESTADOS_INMUEBLE } from "@/utils/constantes"
import BadgeInmueble from "./badge-inmueble"

type Props = {
  inmueble: Inmueble
  propietarioNombre?: string
  canEdit: boolean
  onEdit: (inmueble: Inmueble) => void
}

export default function InmuebleCard({ inmueble, propietarioNombre, canEdit, onEdit }: Props) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{inmueble.direccion}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              Córdoba
            </div>
          </div>
          <BadgeInmueble  estadoInmueble={inmueble.estado} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 mr-3" />
            <span className="text-sm text-muted-foreground">Tipo:</span>
          </div>
          <div className="flex items-center font-semibold">
            {TIPOS_INMUEBLES.find((t) => t.id === inmueble.tipoInmuebleId)?.nombre || "Desconocido"}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="h-5 w-5 mr-3" />
            <span className="text-sm text-muted-foreground">Propietario:</span>
          </div>
          <div className="flex items-center">
            <Link className="hover:text-yellow-700 transition-colors flex" href={`/propietarios/${inmueble.propietarioId}`}>
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{propietarioNombre || "Desconocido"}</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Ruler className="h-5 w-5 mr-3" />
            <span className="text-sm text-muted-foreground">Superficie:</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium">
              {inmueble.superficie ? `${inmueble.superficie} m²` : "No especificada"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link href={`/inmuebles/${inmueble.id}`}>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              <Eye />
              Ver Detalles
            </Button>
          </Link>
          <Button
            onClick={() => onEdit(inmueble)}
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            disabled={!canEdit}
          >
            <PenBox />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
