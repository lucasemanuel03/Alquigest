"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import InmuebleIcon from "@/components/inmueble-icon";
import ProximoAumentoBadge from "@/components/contratos/proximo-aumento-badge";
import VencimientoBadge from "@/components/contratos/vencimiento-badge";
import EstadoBadge from "@/components/contratos/estado-badge";
import { CalendarCheck, Import, Receipt, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ContratoDetallado } from "@/types/ContratoDetallado";
import { MouseEvent } from "react";

export type AlquilerPendiente = { contratoId: number };

type Props = {
  contrato: ContratoDetallado;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  alquileresPendientes: AlquilerPendiente[];
  onRegistrarPago: (contrato: ContratoDetallado) => void;
  loadingPendientes?: boolean;
};

export default function ContratoAlquilerCard({
    contrato,
    isExpanded,
    onToggle,
    alquileresPendientes,
    onRegistrarPago,
    loadingPendientes = false,
  }: Props) {
  const estaPendiente = alquileresPendientes.some((a) => a.contratoId === contrato.id);

  const handleRegistrarPago = (e: MouseEvent) => {
    e.stopPropagation();
    onRegistrarPago(contrato);
  };

  //Refactorizar NULL's
  if(contrato.montoUltimoAlquiler === null) {
    contrato.montoUltimoAlquiler = 0;
  }

  console.log("ContratoAlquilerCard - contrato:", contrato);

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onToggle(contrato.id)}
    >
      {/* Header */}
      <CardHeader className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_3fr_auto] items-center">
        {/* Dirección */}
        <div className="flex items-center gap-2">
          <InmuebleIcon tipoInmuebleString={contrato?.tipoInmueble} className="h-7 w-7" />
          <CardTitle className="text-xl md:text-xl font-semibold">
            <Link href={`/inmuebles/${contrato.inmuebleId}`} className="hover:text-primary">
              {contrato.direccionInmueble}
            </Link>
          </CardTitle>
        </div>

        {/* Locador / Locatario */}
        <div className="flex flex-col gap-5  md:flex-row">
          <div className="flex items-center gap-1 text-sm md:text-base">
            <User className="h-5" />
            <p className="font-medium text-muted-foreground">Locador:</p>
            <p className="font-medium">{contrato.apellidoPropietario}, {contrato.nombrePropietario}</p>
          </div>
          <div className="flex items-center gap-1 text-sm md:text-base">
            <User className="h-5" />
            <p className="font-medium text-muted-foreground">Locatario:</p>
            <p className="font-medium">{contrato.apellidoInquilino}, {contrato.nombreInquilino}</p>
          </div>
        </div>

        {/* Estado */}
        <div className="flex flex-col items-end sm:justify-end md:justify-end gap-2">
          <div className="flex gap-2">
            <ProximoAumentoBadge fechaAumento={contrato.fechaAumento} />
            <VencimientoBadge fechaFin={contrato.fechaFin} />
            <EstadoBadge estado={contrato.estadoContratoNombre} />
          </div>
          {/* ESTADO PAGO ALQUILER */}
          <div className="flex items-center justify-end sm:justify-end md:justify-end gap-2 min-h-6">
            {loadingPendientes ? (
              <Skeleton className="h-6 w-30" />
            ) : estaPendiente ? (
              <Badge className="bg-red-300 text-red-950 w-30">Alquiler No pagado</Badge>
            ) : (
              <Badge className="bg-emerald-300 text-emerald-950 w-30">Alquiler Pagado</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Contenido expandible */}
      <CardContent
        className={`transition-max-height duration-300 overflow-hidden ${
          isExpanded ? "max-h-[1000px]" : "max-h-0"
        }`}
        aria-expanded={isExpanded}
        role="region"
      >
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-md">
          <div>
            <p className="text-md font-medium text-muted-foreground">Monto Alquiler</p>
            <p className="font-bold text-green-600">${contrato.montoUltimoAlquiler.toLocaleString("es-AR") || "No especificado"}</p>
          </div>
          <div>
            <p className="text-md font-medium text-muted-foreground">Próximo Aumento</p>
            <p className="font-bold text-orange-500">
              {(() => {
                if (!contrato.fechaAumento) return "No especificado";
                const raw = String(contrato.fechaAumento).trim();
                // Si viene como dd/mm/aaaa, extraemos mm/aaaa directamente
                const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (m) {
                  const mes = m[2].padStart(2, "0");
                  const anio = m[3];
                  return `${mes}/${anio}`;
                }
                // Último recurso: devolver el string original
                return raw;
              })()}
            </p>
          </div>
          <div>
            <p className="text-md font-medium text-muted-foreground">Vencimiento: </p>
            <p className="font-bold text-red-500">{contrato.fechaFin}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center justify-between pt-4 border-t gap-2 md:flex md:justify-between">
          <div className="flex gap-2">
            <Link href={`/contratos/${contrato.id}`}>
              <Button variant="outline" size="sm">Ver Contrato</Button>
            </Link>
            <Link href={`/alquileres/${contrato.id}/historial-pago-alquiler`}>
              <Button variant="outline" size="sm">
                <CalendarCheck />
                Ver Historial
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!estaPendiente}
              className="bg-green-600 hover:bg-green-700"
              onClick={handleRegistrarPago}
            >
              <Import />
              Registrar Pago
            </Button>
            <Link href={`/alquileres/${contrato.id}/generar-recibo`}>
              <Button variant="outline" size="sm">
                <Receipt className="h-4 w-4 mr-2" />
                Generar Mercedes Locativas
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
