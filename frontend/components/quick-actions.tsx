import NuevoInquilinoModal from "@/app/inquilinos/nuevoInquilinoModal";
import NuevoPropietarioModal from "@/app/propietarios/nuevoPropietarioModal";
import { useMemo, useState } from "react";

import Link from "next/link";
import { Button } from "./ui/button";
import { Blocks, FastForward, FilePlus2, FileText, Home, HousePlusIcon, Plus, Receipt, SquareArrowOutUpRight, UserCircle2, UserPlus, UserPlus2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import NuevoInmuebleModal from "@/app/inmuebles/nuevo/nuevoInmuebleModal";
import { useAuth } from "@/contexts/AuthProvider";
import PagoServiciosModal from "./pago-servicios-modal";
import PagoAlquileresModal from "./pago-alquileres-modal";

export default function QuickActions() {
  const { hasPermission, hasRole, user } = useAuth();
  const [openInquilino, setOpenInquilino] = useState(false)
  const [openPropietario, setOpenPropietario] = useState(false)
  const [openInmueble, setOpenInmueble] = useState(false)
  const [openPagoServicios, setOpenPagoServicios] = useState(false)
  const [openPagoAlquileres, setOpenPagoAlquileres] = useState(false)
  // permisos
  const perms = useMemo(() => ({
    crearPropietario: hasPermission("crear_propietario"),
    crearInquilino: hasPermission("crear_inquilino"),
    crearInmueble: hasPermission("crear_inmueble"),
    crearUsuario: hasPermission("crear_usuario_abogada"), //CAMBIAR PROVISORIO!!!!
    crearContrato: hasPermission("crear_contrato"),
  }), [])
  return (
    <div>
        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="fixed bg-primary bottom-15 right-3 sm:right-15 rounded-2xl p-4 shadow-lg shadow-black/60 hover:brightness-110 transition-all cursor-pointer z-999">
            <div className="flex items-center sm:space-x-2 text-background">
              <SquareArrowOutUpRight className="w-6 h-6 " />
              <span className="hidden sm:block">Accesos Directos</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {/* Pagar Alquileres */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenPagoAlquileres(true) }}>
              <Button  size="sm" className="w-full flex items-center justify-start bg-green-600 hover:bg-green-800" >
                <Receipt className="mr-2 text-background" />
                Pagar Alquileres (Beta)
              </Button>
            </DropdownMenuItem>
            {/* Pagar Servicios */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenPagoServicios(true) }}>
              <Button  size="sm" className="w-full flex items-center justify-start bg-green-600 hover:bg-green-800" >
                <Blocks className="mr-2 text-background" />
                Pagar Servicios (Beta)
              </Button>
            </DropdownMenuItem>
            {/* Nuevo Locador */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (perms.crearPropietario) setOpenPropietario(true) }}>
              <Button  size="sm" className="w-full flex items-center justify-start" disabled={!perms.crearPropietario}>
                <UserPlus className="mr-2 text-background" />
                Nuevo Locador
              </Button>
            </DropdownMenuItem>
            {/* Nuevo Locatario */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (perms.crearInquilino) setOpenInquilino(true) }}>
              <Button size="sm" className="w-full flex items-center justify-start" disabled={!perms.crearInquilino}>
                <UserPlus className=" mr-2 text-background" />
                Nuevo Locatario
              </Button>
            </DropdownMenuItem>
            {/* Nuevo Inmueble */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (perms.crearInmueble) setOpenInmueble(true) }}>
              <Button  size="sm" className="w-full flex items-center justify-start" disabled={!perms.crearInmueble}>
                <HousePlusIcon className="mr-2 text-background" />
                Nuevo Inmueble
              </Button>
            </DropdownMenuItem>
            {/* Nuevo Contrato */}
            <DropdownMenuItem>
              {perms.crearContrato ? (
                <Link href={"/contratos/nuevo"} className="w-full">
                  <Button size="sm" className="w-full flex items-center justify-start">
                    <FileText className="mr-2 text-background" />
                    Nuevo Contrato
                  </Button>
                </Link>
              ) : (
                <Button size="sm" className="w-full flex items-center justify-start" disabled>
                  <FilePlus2 className="mr-2 text-background" />
                  Nuevo Contrato
                </Button>
              )}
            </DropdownMenuItem>
            {/* Nuevo Usuario */}
            <DropdownMenuItem>
              {perms.crearUsuario ? (
                <Link href={"/auth/signup"} className="w-full">
                  <Button variant="outline" size="sm" className="w-full flex items-center justify-start">
                    <UserPlus2 className="h-5 w-5 mr-2" />
                    Nuevo Usuario
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" className="w-full flex items-center justify-start" disabled>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Nuevo Usuario
                </Button>
              )}
            </DropdownMenuItem>
            {/* Generar Informe */}
            <DropdownMenuItem>
              <Link href={"/informes"} className="w-full">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-start">
                  <FileText className="h-5 w-5 mr-2" />
                  Generar Informe
                </Button>
              </Link>
            </DropdownMenuItem>
            
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modales controlados y fuera del dropdown para evitar unmount */}
        <div>
          <PagoAlquileresModal open={openPagoAlquileres} onOpenChange={setOpenPagoAlquileres} />
          <PagoServiciosModal open={openPagoServicios} onOpenChange={setOpenPagoServicios} />
          <NuevoPropietarioModal open={openPropietario} onOpenChange={setOpenPropietario} showTrigger={false} />
          <NuevoInquilinoModal open={openInquilino} onOpenChange={setOpenInquilino} showTrigger={false} />
          <NuevoInmuebleModal open={openInmueble} onOpenChange={setOpenInmueble} showTrigger={false} />
        </div>
        </div>
    )

}