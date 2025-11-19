"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown } from "lucide-react"
import Link from "next/link"
import NuevoInmuebleModal from "@/app/inmuebles/nuevo/nuevoInmuebleModal"
import { Inmueble } from "@/types/Inmueble"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type FiltroInmuebles = "activos" | "inactivos" | "alquilados" | "disponibles"

type Props = {
  filtro: FiltroInmuebles
  onChangeFiltro: (filtro: FiltroInmuebles) => void
  count: number
  onInmuebleCreado: (nuevo: Inmueble) => void
}

const etiquetaFiltro: Record<FiltroInmuebles, string> = {
  activos: "Activos",
  inactivos: "Inactivos",
  alquilados: "Alquilados",
  disponibles: "Disponibles",
}

export default function InmueblesHeader({ filtro, onChangeFiltro, count, onInmuebleCreado }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-5">
      <div className="mt-8 flex items-center justify-between">
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <NuevoInmuebleModal 
          text="Nuevo Inmueble" 
          onInmuebleCreado={(data) => onInmuebleCreado(data.inmueble)} 
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Inmuebles {etiquetaFiltro[filtro]}</h2>
          <p className="text-muted-foreground font-sans">Cantidad Actual: {count}</p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-secondary">Filtro:</p>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-1">
                {etiquetaFiltro[filtro]}
                <ChevronDown />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onChangeFiltro("activos")}>Activos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeFiltro("inactivos")}>Inactivos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeFiltro("alquilados")}>Alquilados</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeFiltro("disponibles")}>Disponibles</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
