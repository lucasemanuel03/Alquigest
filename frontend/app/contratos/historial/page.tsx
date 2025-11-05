"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BACKEND_URL from "@/utils/backendURL";
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken";
import { ArrowLeft, ArrowUpDown, Building2, ChevronDown, FileClock, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Loading from "@/components/loading";
import { useSearchParams, useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ContratoDetallado } from "@/types/ContratoDetallado";
import EstadoBadge from "@/components/contratos/estado-badge";
import VencimientoBadge from "@/components/contratos/vencimiento-badge";

export default function HistorialContratosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [contratosBD, setContatosBD] = useState<ContratoDetallado[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false); // nuevo estado para transición

  // Leer valores iniciales desde la URL (con validación) y caer a defaults si no existen
  const filtroFromURL = searchParams.get("filtro") as "vigentes" | "no-vigentes" | "proximos-vencer" | null;
  const validFiltros = ["vigentes", "no-vigentes", "proximos-vencer"] as const;
  const filtroInicial = (filtroFromURL && (validFiltros as readonly string[]).includes(filtroFromURL))
    ? (filtroFromURL as typeof validFiltros[number])
    : "vigentes";

  const campoFromURL = searchParams.get("ordenCampo") as "fechaInicio" | "fechaFin" | "nombrePropietario" | null;
  const validCampos = ["fechaInicio", "fechaFin", "nombrePropietario"] as const;
  const campoInicial = (campoFromURL && (validCampos as readonly string[]).includes(campoFromURL))
    ? (campoFromURL as typeof validCampos[number])
    : "fechaInicio";

  const dirFromURL = searchParams.get("ordenDir") as "asc" | "desc" | null;
  const dirInicial = dirFromURL === "desc" ? "desc" : "asc";

  // Estados controlados por URL
  const [filtroContrato, setFiltroContrato] = useState<"vigentes" | "no-vigentes" | "proximos-vencer">(filtroInicial);
  const [ordenarPor, setOrdenarPor] = useState<"fechaInicio" | "fechaFin" | "nombrePropietario">(campoInicial);
  const [ordenAscendente, setOrdenAscendente] = useState(dirInicial === "asc");

  // Helper para actualizar la URL preservando los valores actuales
  const actualizarURL = (
    nuevoFiltro?: "vigentes" | "no-vigentes" | "proximos-vencer",
    nuevoCampo?: "fechaInicio" | "fechaFin" | "nombrePropietario",
    nuevaDir?: "asc" | "desc"
  ) => {
    const params = new URLSearchParams();
    const filtro = nuevoFiltro || filtroContrato;
    const campo = nuevoCampo || ordenarPor;
    const dir = nuevaDir || (ordenAscendente ? "asc" : "desc");
    params.set("filtro", filtro);
    params.set("ordenCampo", campo);
    params.set("ordenDir", dir);
    router.push(`/contratos/historial?${params.toString()}`, { scroll: false });
  };

  // Función para ordenar contratos
  const ordenarContratos = (contratos: ContratoDetallado[]) => {
    return [...contratos].sort((a, b) => {
      let valorA: string;
      let valorB: string;
      
      switch (ordenarPor) {
        case "fechaInicio":
          valorA = a.fechaInicio || "";
          valorB = b.fechaInicio || "";
          break;
        case "fechaFin":
          valorA = a.fechaFin || "";
          valorB = b.fechaFin || "";
          break;
        case "nombrePropietario":
          valorA = `${a.apellidoPropietario} ${a.nombrePropietario}`.toLowerCase();
          valorB = `${b.apellidoPropietario} ${b.nombrePropietario}`.toLowerCase();
          break;
        default:
          return 0;
      }
      
      const resultado = valorA.localeCompare(valorB);
      return ordenAscendente ? resultado : -resultado;
    });
  };

  useEffect(() => {
    const fetchContratos = async () => {
      const url = `${BACKEND_URL}/contratos/${filtroContrato}`;

      console.log("Ejecutando fetch de Contratos...");
      setLoading(true);
      setIsRendering(false);
      
      try {
        const data = await fetchWithToken(url);
        console.log("Datos parseados del backend:", data);
        const datosOrdenados = ordenarContratos(data);
        setContatosBD(datosOrdenados);
        
        // Dar tiempo para que React procese los datos antes de ocultar loading
        setTimeout(() => {
          setLoading(false);
          // Activar animación de fade-in
          requestAnimationFrame(() => {
            setIsRendering(true);
          });
        }, 100);
      } catch (err: any) {
        console.error("Error al traer contratos:", err.message);
        setLoading(false);
      }
    };

    fetchContratos();
  // Incluye filtroContrato para refetch al cambiar filtro y mantener orden por defecto
  }, [ordenarPor, ordenAscendente, filtroContrato]);

  // Wrappers que actualizan estado y URL
  const handleFiltro = (f: "vigentes" | "no-vigentes" | "proximos-vencer") => {
    setFiltroContrato(f);
    actualizarURL(f);
  };
  const handleOrden = (
    campo: "fechaInicio" | "fechaFin" | "nombrePropietario",
    dir: "asc" | "desc"
  ) => {
    setOrdenarPor(campo);
    setOrdenAscendente(dir === "asc");
    actualizarURL(undefined, campo, dir);
  };

  const getTextoOrdenamiento = () => {
    const tipo = {
      "fechaInicio": "Fecha Inicio",
      "fechaFin": "Fecha Fin", 
      "nombrePropietario": "Nombre Propietario"
    }[ordenarPor];
    
    const direccion = ordenAscendente ? "(A-Z)" : "(Z-A)";
    return `${tipo} ${direccion}`;
  };

  // Reordenar cuando cambien los criterios de ordenamiento
  useEffect(() => {
    if (contratosBD.length > 0) {
      const datosOrdenados = ordenarContratos(contratosBD);
      setContatosBD(datosOrdenados);
    }
  }, [ordenarPor, ordenAscendente]);

  if (loading) {
    return <Loading text="Cargando historial de contratos" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-30">
        <div className="mb-8 flex justify-between gap-3">
          <Link href={"/"}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>

        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileClock className="h-7 w-7"/>
              <h2 className="text-2xl font-bold">Historial de Contratos</h2>
            </div>
            <div className="flex items-center gap-4">
              {/* Filtro */}
              <div className="flex items-center gap-2">
                <p className="text-secondary">Filtro:</p>
                <DropdownMenu>
                    <DropdownMenuTrigger >
                        <div className="flex">
                          {filtroContrato === "vigentes" && "Vigentes"}
                          {filtroContrato === "no-vigentes" && "No Vigentes"}
                          {filtroContrato === "proximos-vencer" && "Próximos a Vencer"}
                          <ChevronDown/>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleFiltro("vigentes")}>
                        Vigentes
                    </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFiltro("no-vigentes")}>
                        No Vigentes
                    </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFiltro("proximos-vencer")}>
                        Próximos a vencer
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Ordenamiento */}
              <div className="flex items-center gap-2">
                <p className="text-secondary">Ordenar:</p>
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <div className="flex items-center gap-1">
                          <ArrowUpDown className="h-4 w-4" />
                          {getTextoOrdenamiento()}
                          <ChevronDown/>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleOrden("fechaInicio", "asc")}>
                          Fecha Inicio (A-Z)
                      </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOrden("fechaInicio", "desc")}>
                          Fecha Inicio (Z-A)
                      </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOrden("fechaFin", "asc")}>
                          Fecha Fin (A-Z)
                      </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOrden("fechaFin", "desc")}>
                          Fecha Fin (Z-A)
                      </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOrden("nombrePropietario", "asc")}>
                          Nombre Propietario (A-Z)
                      </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOrden("nombrePropietario", "desc")}>
                          Nombre Propietario (Z-A)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div>
            {(!loading && contratosBD.length === 0) && (
              <p className="text-lg text-secondary">
                No hay contratos {filtroContrato} para mostrar
              </p>
            )}
          </div>
        </div>
        <div className={`grid gap-6 transition-opacity duration-500 ${isRendering ? 'opacity-100' : 'opacity-0'}`}>
          {contratosBD?.map((contrato) => (
            <Card
              key={contrato.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Header */}
              <CardHeader className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_3fr_auto] items-center">
                {/* Dirección */}
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-yellow-700" />
                  <CardTitle className="text-lg md:text-xl font-bold">
                    <Link href={`/inmuebles/${contrato.inmuebleId}`} className="hover:text-primary">
                      {contrato.direccionInmueble}
                    </Link>
                  </CardTitle>
                </div>

                {/* Locador / Locatario */}
                <div className="flex flex-col gap-5 md:flex-row">
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-5"/>
                    <p className="font-medium text-muted-foreground">Locador:</p>
                    <p className="font-medium">
                      {contrato.apellidoPropietario}, {contrato.nombrePropietario}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-5"/>
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

              <Separator />

              <CardContent className="transition-max-height duration-300 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-md">
                  <div>
                    <p className="text-md font-medium text-muted-foreground">Inicio del Contrato:</p>
                    <p className="font-bold">{contrato.fechaInicio || "No especificado"}</p>
                  </div>
                  <div>
                    <p className="text-md font-medium text-muted-foreground">Finalización:</p>
                    <p className="font-bold">{contrato.fechaFin}</p>
                  </div>
                </div>

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
          ))}
        </div>
      </main>
    </div>
  );
}
