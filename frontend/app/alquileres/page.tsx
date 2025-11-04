"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, Receipt, AlertCircle, User, FileText, ChevronDown, Expand, Minimize2, CalendarCheck, Import } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import Loading from "@/components/loading";
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import InmuebleIcon from "@/components/inmueble-icon";
import { ContratoDetallado } from "@/types/ContratoDetallado";
import EstadoBadge from "@/components/contratos/estado-badge";
import ProximoAumentoBadge from "@/components/contratos/proximo-aumento-badge";
import auth from "@/utils/functions/auth-functions/auth";
import ModalRegistrarPagoAlquiler from "@/components/modal-registrar-pago-alquiler";
import VencimientoBadge from "@/components/contratos/vencimiento-badge";
import { set } from "lodash";
import BarraBusqueda from "@/components/busqueda/barra-busqueda";

export default function AlquileresPage() {

  const [contratosBD, setContatosBD] = useState<ContratoDetallado[]>([])
  const [contratosMostrar, setContratosMostrar] = useState<ContratoDetallado[]>([])
  const [alquileresPendientes, setAlquileresPendientes] = useState<AlquilerItem[]>([])
  const [loading, setLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false); // nuevo estado para transición
  const [totalContratos, setTotalContratos] = useState(0)
  const [expandedCard, setExpandedCard] = useState<number | null>(null); // id del contrato expandido
  const [filtroContrato, setFiltroContrato] = useState<"vigentes" | "proximos-vencer">("vigentes");
  const [vistaDetallada, setVistaDetallada] = useState<boolean>(false); // false = colapsada, true = detallada
  const [orden, setOrden] = useState<{campo: 'direccion' | 'locador' | 'fechaAumento', dir: 'asc' | 'desc'}>({ campo: 'direccion', dir: 'asc' });
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoDetallado | null>(null);
  
  const toggleCard = (id: number) => {
    // Si la vista es detallada no se colapsa individualmente
    if (vistaDetallada) return;
    setExpandedCard(expandedCard === id ? null : id);
  }

  //ESTADÍSTICAS
  const [cantidadProxVencer, setCantidadProxVencer] = useState(0);
  const [cantAlquileresNoPagos, setAlquileresNoPagos] = useState(0)

  const handleAbrirModalPago = (contrato: ContratoDetallado) => {
    setContratoSeleccionado(contrato);
    setModalPagoOpen(true);
  };

  // Traer cantidad de contratos a vencer en 30 dias
  useEffect(() => {
    fetchWithToken(`${BACKEND_URL}/contratos/count/proximos-vencer`)
      .then((data) => setCantidadProxVencer(data || 0))
      .catch((err) => console.error("Error contratos a vencer:", err));
  }, []);

  useEffect(() => {
  const fetchTodosLosDatos = async () => {
    console.log("Ejecutando fetch de Contratos y Alquileres...");
    setLoading(true);
    setIsRendering(false);
    
    try {
      // Fetch de contratos y estadísticas
      const [data, total, alqNoPagos, alquileresPend] = await Promise.all([
        fetchWithToken(`${BACKEND_URL}/contratos/${filtroContrato}`),
        fetchWithToken(`${BACKEND_URL}/contratos/count/vigentes`),
        fetchWithToken(`${BACKEND_URL}/alquileres/count/pendientes`),
        fetchWithToken(`${BACKEND_URL}/alquileres/pendientes`)
      ]);

      console.log("Datos parseados del backend:", data);
      setContatosBD(data);
      setContratosMostrar(data); //para busqueda
      setTotalContratos(total);
      setAlquileresNoPagos(alqNoPagos);
      setAlquileresPendientes(alquileresPend);
      
      // Dar tiempo para que React procese los datos antes de ocultar loading
      setTimeout(() => {
        setLoading(false);
        // Activar animación de fade-in
        requestAnimationFrame(() => {
          setIsRendering(true);
        });
      }, 100);
    } catch (err: any) {
      console.error("Error al traer datos:", err.message);
      setLoading(false);
    }
  };

  fetchTodosLosDatos();
}, [filtroContrato, modalPagoOpen]);


  // Ordenamiento derivado (después de tener contratosBD)
  const parseFecha = (s?: string | null) => {
    if (!s) return null;
    const parts = s.split('/');
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    const d = parseInt(dd, 10); const m = parseInt(mm, 10) - 1; const y = parseInt(yyyy, 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    return new Date(y, m, d);
  };
  const contratosOrdenados: ContratoDetallado[] = [...contratosBD].sort((a, b) => {
    const dirFactor = orden.dir === 'asc' ? 1 : -1;
    if (orden.campo === 'direccion') {
      return a.direccionInmueble.localeCompare(b.direccionInmueble, 'es', { sensitivity: 'base' }) * dirFactor;
    }
    if (orden.campo === 'locador') {
      return a.apellidoPropietario.localeCompare(b.apellidoPropietario, 'es', { sensitivity: 'base' }) * dirFactor;
    }
    const da = parseFecha(a.fechaAumento);
    const db = parseFecha(b.fechaAumento);
    const ta = da ? da.getTime() : (orden.dir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    const tb = db ? db.getTime() : (orden.dir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    return (ta - tb) * dirFactor;
  });


  if(loading){
    return(
      <div>
        <Loading text="Cargando contratos de alquiler"/>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-30">
        <div className="mb-8 flex justify-between gap-3"> 
          <div> <Button variant="outline" onClick={() => window.history.back()}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver </Button> 
          </div> 
          <div className="flex items-center space-x-4">
            {auth.tienePermiso("crear_contrato") ? (
              <Link href={"/contratos/nuevo"}>
                <Button size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Nuevo Contrato
                </Button>
              </Link>
            ) : (
              <Button disabled size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Nuevo Contrato
              </Button>
            )}
          </div>

        </div> 
        
        {/* Stats Summary */} 
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"> 
          <Card> 
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
            <CardTitle className="text-md md:text-md font-medium ">Contratos Vigentes</CardTitle> 
            <Calendar className="h-5 w-5 text-foreground" /> </CardHeader> 
            <CardContent className="flex flex-col items-center"> 
              <div className="text-3xl font-bold font-sans text-foreground">
                {totalContratos || "N/A"}
              </div> 
              <p className="text-sm text-muted-foreground">Vigentes actualmente</p> 
              </CardContent> 
            </Card> 
            <Card> 
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
                <CardTitle className="text-md md:text-md font-medium ">Contratos por vencer</CardTitle> 
                <AlertCircle className="h-5 w-5 text-orange-500" /> 
              </CardHeader> 
              <CardContent className="flex flex-col items-center"> 
                <div className="text-3xl font-bold font-sans text-orange-600">{cantidadProxVencer}</div> 
                <p className="text-sm text-muted-foreground">Vencen el mes que viene</p> 
              </CardContent> 
            </Card> 
            <Card> 
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
                <CardTitle className="text-md md:text-md font-medium ">Alquileres No Pagos</CardTitle> 
                <AlertCircle className="h-5 w-5 text-orange-500" /> </CardHeader> 
                <CardContent className="flex flex-col items-center"> 
                  <div className="text-3xl font-bold font-sans text-orange-600">{cantAlquileresNoPagos}</div> 
                  <p className="text-sm text-muted-foreground">No pagaron antes del día 10</p> 
                </CardContent> 
              </Card> 
              <Card> 
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
                  <CardTitle className="text-md md:text-md font-medium ">Servicios No Pagos</CardTitle>                  
                  <AlertCircle className="h-5 w-5 text-orange-500" /> 
                </CardHeader> 
                <CardContent className="flex flex-col items-center"> 
                  <div className="text-3xl font-bold font-sans text-orange-600">N/A</div> 
                  <p className="text-sm text-muted-foreground">Pendientes de pagar</p> 
                </CardContent> 
              </Card> 
        </div> 
        {/* Alquileres List */} 
        <div className="space-y-6"> 
          <div className="flex justify-between my-10">
            <div className="flex items-center justify-between"> 
              <h2 className="text-xl font-semibold font-sans">Contratos de Alquiler Vigentes</h2> 
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVistaDetallada(v => !v)}
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
          </div>  
          <div> {(!loading && contratosBD.length == 0) && ( <p className="text-lg text-secondary">No hay contratos activos actualmente</p> )} 
        </div>
        </div>

          <BarraBusqueda 
            arrayDatos={contratosBD}
            placeholder="No Disponible [En Desarrollo]..."
            setDatosFiltrados={setContratosMostrar}
            propiedadesBusqueda={["direccionInmueble", "nombrePropietario", "apellidoPropietario"]}
          />

        {/* Spinner mientras se procesan las cards */}
        {!loading && !isRendering && contratosMostrar.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Preparando contratos...</p>
          </div>
        )}

        <div className={`grid gap-4 transition-opacity duration-500 ${isRendering ? 'opacity-100' : 'opacity-0'}`}>
          {contratosOrdenados?.map((contrato) => {
            const isExpanded = vistaDetallada || expandedCard === contrato.id;
            return (
              <Card 
                key={contrato.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => toggleCard(contrato.id)}
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
                        <User className="h-5"/>
                        <p className="font-medium text-muted-foreground">Locador:</p>
                        <p className="font-medium">{contrato.apellidoPropietario}, {contrato.nombrePropietario} </p>
                      </div>
                    <div className="flex items-center gap-1 text-sm md:text-base">
                      <User className="h-5"/>
                      <p className="font-medium text-muted-foreground">Locatario:</p>
                      <p className="font-medium">{contrato.apellidoInquilino}, {contrato.nombreInquilino} </p>
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
                    <div className="flex items-center justify-end sm:justify-end md:justify-end gap-2">
                      {alquileresPendientes.some((a) => a.contratoId === contrato.id) ? (
                        <Badge className="bg-red-300 text-red-950">Alquiler No Pago</Badge>
                      ) : (
                        <Badge className="bg-emerald-300 text-emerald-950">Mes Alquiler Pagado</Badge>
                      )}
                    </div>
                  </div>
                  
                </CardHeader>
                {/* 
                  {!isExpanded && (
                    <div className="flex items-end justify-center text-xs text-muted-foreground">
                      <p>Click para ver detalles</p>
                    </div>
                  )}
                */}
                  
                {/* Contenido expandible solo en móviles o cuando está expandida */}
                <CardContent 
                  className={`transition-max-height duration-300 overflow-hidden ${
                    isExpanded ? "max-h-[1000px]" : "max-h-0"
                  }`}
                  aria-expanded={isExpanded}
                  role="region"
                  data-view={vistaDetallada ? 'detallada' : 'colapsada'}
                >
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-md">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monto Alquiler</p>
                      <p className="font-bold text-green-600">${contrato.montoUltimoAlquiler.toLocaleString("es-AR")}</p>
                    </div>
                    <div>
                      <p className="text-md font-medium text-muted-foreground">Próximo Aumento</p>
                      <p className="text-lg font-bold text-orange-500">{contrato.fechaAumento || "No especifiado"}</p>
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
                          <CalendarCheck/>
                          Ver Pagos Alquiler</Button>
                      </Link>
                      
                    </div>
                    <div className="flex gap-2">  
                      <Button 
                        size="sm"
                        disabled={!(alquileresPendientes.some((a) => a.contratoId === contrato.id))}
                        className="bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirModalPago(contrato);
                        }}
                      >
                        <Import/>
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
            )
          })}
        </div>

        {/* Modal de Registro de Pago */}
        {contratoSeleccionado && (
          <ModalRegistrarPagoAlquiler
            open={modalPagoOpen}
            onOpenChange={setModalPagoOpen}
            contrato={contratoSeleccionado}
          />
        )}
      </main>
    </div>
  )
}
