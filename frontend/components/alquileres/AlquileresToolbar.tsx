"use client"

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Expand, Minimize2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type OrdenCampo = 'direccion' | 'locador' | 'fechaAumento';
type Orden = { campo: OrdenCampo; dir: 'asc' | 'desc' };

type Props = {
  vistaDetallada: boolean;
  setVistaDetallada: Dispatch<SetStateAction<boolean>>;
  orden: Orden;
  setOrden: Dispatch<SetStateAction<Orden>>;
  filtroContrato: 'vigentes' | 'proximos-vencer';
  setFiltroContrato: Dispatch<SetStateAction<'vigentes' | 'proximos-vencer'>>;
};

export default function AlquileresToolbar({
  vistaDetallada,
  setVistaDetallada,
  orden,
  setOrden,
  filtroContrato,
  setFiltroContrato,
}: Props) {
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setVistaDetallada((v) => !v)}
        title={vistaDetallada ? "Cambiar a vista colapsada" : "Cambiar a vista detallada"}
      >
        {vistaDetallada ? (
          <div className="flex">
            <Minimize2 className="h-4 w-4 mr-2" /> Vista general
          </div>
        ) : (
          <div className="flex">
            <Expand className="h-4 w-4 mr-2" /> Vista detallada
          </div>
        )}
      </Button>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Orden */}
        <div className="flex items-center gap-2">
          <p className="text-secondary">Orden:</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex hover:cursor-pointer select-none items-center gap-1">
                {orden.campo === 'direccion' && (orden.dir === 'asc' ? 'Dirección (A-Z)' : 'Dirección (Z-A)')}
                {orden.campo === 'locador' && (orden.dir === 'asc' ? 'Locador (A-Z)' : 'Locador (Z-A)')}
                {orden.campo === 'fechaAumento' && (orden.dir === 'asc' ? 'Próx. Aumento (Asc)' : 'Próx. Aumento (Desc)')}
                <ChevronDown className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setOrden({ campo: 'direccion', dir: 'asc' })}>Dirección (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrden({ campo: 'direccion', dir: 'desc' })}>Dirección (Z-A)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrden({ campo: 'locador', dir: 'asc' })}>Locador (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrden({ campo: 'locador', dir: 'desc' })}>Locador (Z-A)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrden({ campo: 'fechaAumento', dir: 'asc' })}>Próx. Aumento (Asc)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrden({ campo: 'fechaAumento', dir: 'desc' })}>Próx. Aumento (Desc)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filtro */}
        <div className="flex items-center gap-2">
          <p className="text-secondary">Filtro:</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex hover:cursor-pointer select-none items-center gap-1">
                {filtroContrato === 'vigentes' && 'Todos'}
                {filtroContrato === 'proximos-vencer' && 'Próximos a Vencer'}
                <ChevronDown className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFiltroContrato('vigentes')}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFiltroContrato('proximos-vencer')}>Próximos a vencer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
