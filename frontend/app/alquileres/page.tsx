"use client"

import { Button } from "@/components/ui/button"
import { Calendar, ArrowLeft, AlertCircle, FileText, Handshake, CalendarClock, Banknote } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import Loading from "@/components/loading";
import { ContratoDetallado } from "@/types/ContratoDetallado";
import ModalRegistrarPagoAlquiler from "@/components/modal-registrar-pago-alquiler";
import BarraBusqueda from "@/components/busqueda/barra-busqueda";
import AlquileresToolbar from "@/components/alquileres/AlquileresToolbar";
import ContratoAlquilerCard from "@/components/alquileres/ContratoAlquilerCard";
import ContratoHistorialCard from "@/components/alquileres/ContratoHistorialCard";
import { useAuth } from "@/contexts/AuthProvider"
import EstadisticaCard from "@/components/estadisticas/estadistica-card"

export default function AlquileresPage() {

  const { hasPermission, hasRole, user } = useAuth();
  const searchParams = useSearchParams()
  const router = useRouter()

  // Leer filtro desde URL o usar "vigentes" por defecto
  const filtroFromURL = searchParams.get("filtro") as "vigentes" | "proximos-vencer" | "no-vigentes" | null
  const filtrosValidos = ["vigentes", "proximos-vencer", "no-vigentes"]
  const filtroInicial = filtroFromURL && filtrosValidos.includes(filtroFromURL) ? filtroFromURL : "vigentes"

  // Leer orden desde URL o usar valores por defecto
  const campoFromURL = searchParams.get("ordenCampo") as 'direccion' | 'locador' | 'fechaAumento' | null
  const dirFromURL = searchParams.get("ordenDir") as 'asc' | 'desc' | null
  const camposValidos = ["direccion", "locador", "fechaAumento"]
  const dirValidas = ["asc", "desc"]
  const ordenInicial = {
    campo: (campoFromURL && camposValidos.includes(campoFromURL) ? campoFromURL : 'direccion') as 'direccion' | 'locador' | 'fechaAumento',
    dir: (dirFromURL && dirValidas.includes(dirFromURL) ? dirFromURL : 'asc') as 'asc' | 'desc'
  }

  const [contratosBD, setContatosBD] = useState<ContratoDetallado[]>([])
  const [contratosMostrar, setContratosMostrar] = useState<ContratoDetallado[]>([])
  const [alquileresPendientes, setAlquileresPendientes] = useState<AlquilerItem[]>([])
  const [loading, setLoading] = useState(true);
  const [totalContratos, setTotalContratos] = useState(0)
  const [expandedCard, setExpandedCard] = useState<number | null>(null); // id del contrato expandido
  const [filtroContrato, setFiltroContrato] = useState<"vigentes" | "proximos-vencer" | "no-vigentes">(filtroInicial);
  const [vistaDetallada, setVistaDetallada] = useState<boolean>(false); // false = colapsada, true = detallada
  const [orden, setOrden] = useState<{campo: 'direccion' | 'locador' | 'fechaAumento', dir: 'asc' | 'desc'}>(ordenInicial);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoDetallado | null>(null);
  
  // Función para actualizar URL con filtro y orden
  const actualizarURL = (nuevoFiltro?: string, nuevoOrden?: typeof orden) => {
    const params = new URLSearchParams()
    const filtro = nuevoFiltro || filtroContrato
    const ordenActual = nuevoOrden || orden
    
    params.set("filtro", filtro)
    params.set("ordenCampo", ordenActual.campo)
    params.set("ordenDir", ordenActual.dir)
    
    router.push(`/alquileres?${params.toString()}`, { scroll: false })
  }

  // Función para cambiar filtro y actualizar URL
  const handleChangeFiltro = (nuevoFiltro: "vigentes" | "proximos-vencer" | "no-vigentes") => {
    setFiltroContrato(nuevoFiltro)
    actualizarURL(nuevoFiltro)
  }

  // Función para cambiar orden y actualizar URL
  const handleChangeOrden = (nuevoOrden: {campo: 'direccion' | 'locador' | 'fechaAumento', dir: 'asc' | 'desc'}) => {
    setOrden(nuevoOrden)
    actualizarURL(undefined, nuevoOrden)
  }
  
  const toggleCard = (id: number) => {
    // Si la vista es detallada no se colapsa individualmente
    if (vistaDetallada) return;
    setExpandedCard(expandedCard === id ? null : id);
  }

  //ESTADÍSTICAS
  const [cantidadProxVencer, setCantidadProxVencer] = useState(0);
  const [cantAlquileresNoPagos, setAlquileresNoPagos] = useState(0)
  const [loadingProxVencer, setLoadingProxVencer] = useState(true)
  const [loadingContadores, setLoadingContadores] = useState(true)
  const [loadingPendientes, setLoadingPendientes] = useState(true)

  const handleAbrirModalPago = (contrato: ContratoDetallado) => {
    setContratoSeleccionado(contrato);
    setModalPagoOpen(true);
  };

  // Traer cantidad de contratos a vencer en 30 dias
  useEffect(() => {
    setLoadingProxVencer(true)
    fetchWithToken(`${BACKEND_URL}/contratos/count/proximos-vencer`)
      .then((data) => setCantidadProxVencer(data || 0))
      .catch((err) => console.error("Error contratos a vencer:", err))
      .finally(() => setLoadingProxVencer(false))
  }, []);

  useEffect(() => {
    // Principal: cargar SOLO contratos y manejar loading
    let cancelled = false;
    const fetchContratos = async () => {
      setLoading(true);
      try {
  const data = await fetchWithToken(`${BACKEND_URL}/contratos/${filtroContrato}`);
        if (cancelled) return;
        setContatosBD(data);
        setContratosMostrar(data); // para búsqueda
      } catch (err: any) {
        console.error("Error al obtener contratos:", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchContratos();
    return () => { cancelled = true };
  }, [filtroContrato]);

  useEffect(() => {
    // Secundario: alquileres pendientes (no toca loading principal)
    const fetchPendientes = async () => {
      setLoadingPendientes(true)
      try {
        const alquileresPend = await fetchWithToken(`${BACKEND_URL}/alquileres/pendientes`);
        setAlquileresPendientes(alquileresPend);
      } catch (err: any) {
        console.error("Error al obtener alquileres pendientes:", err.message);
      } finally {
        setLoadingPendientes(false)
      }
    };
    fetchPendientes();
  }, [modalPagoOpen]);

  useEffect(() => {
    // Secundario: contadores (no toca loading). Se actualiza al montar y al cerrar modal de pago
    const fetchContadores = async () => {
      setLoadingContadores(true)
      try {
        const [total, alqNoPagos] = await Promise.all([
          fetchWithToken(`${BACKEND_URL}/contratos/count/vigentes`),
          fetchWithToken(`${BACKEND_URL}/alquileres/count/pendientes`),
        ]);
        setTotalContratos(total);
        setAlquileresNoPagos(alqNoPagos);
      } catch (err: any) {
        console.error("Error al traer contadores:", err.message);
      } finally {
        setLoadingContadores(false)
      }
    };
    fetchContadores();
  }, [modalPagoOpen]);


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
  const contratosOrdenados: ContratoDetallado[] = useMemo(() => {
    return [...contratosBD].sort((a, b) => {
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
  }, [contratosBD, orden]);


  if(loading){
    return(
      <div>
        <Loading text="Cargando contratos de alquiler"/>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
        <div className="mb-8 flex justify-between gap-3"> 
          <Link href={"/"}> 
            <Button variant="outline"> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver </Button> 
          </Link> 
          <div className="flex items-center space-x-4">
            {hasPermission("crear_contrato") ? (
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
        {filtroContrato !== 'no-vigentes' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <EstadisticaCard
            titulo="Contratos vigentes"
            valor={totalContratos}
            icono={<Handshake className=" text-foreground" />}
            coloresIcono="bg-secondary/20"
            subtitulo="Vigentes actualmente"
            cargando={loadingContadores}
          />

          <EstadisticaCard
            titulo="Contratos por vencer"
            valor={cantidadProxVencer}
            icono={<CalendarClock className=" text-orange-500" />}
            coloresIcono="bg-orange-200"
            subtitulo="Vencen el mes que viene"
            cargando={loadingProxVencer}
          />

          <EstadisticaCard
            titulo="Alquileres pendientes de pago"
            valor={cantAlquileresNoPagos}
            coloresIcono="bg-red-200"
            cargando={loadingContadores}
            icono={<Banknote className=" text-red-500" />}
          />
        </div>
        )}
        {/* Alquileres List */}
        <div className="flex items-center justify-between mt-15"> 
          <h2 className="text-xl font-semibold font-sans">
            {filtroContrato === 'vigentes' && 'Contratos de Alquiler Vigentes'}
            {filtroContrato === 'proximos-vencer' && 'Contratos próximos a vencer'}
            {filtroContrato === 'no-vigentes' && 'Contratos Inactivos'}
          </h2> 
        </div> 
        <div className="my-5"> 
            <div className="flex justify-center sm:justify-end items-center gap-4">
              <AlquileresToolbar
                vistaDetallada={vistaDetallada}
                setVistaDetallada={setVistaDetallada}
                orden={orden}
                setOrden={handleChangeOrden}
                filtroContrato={filtroContrato}
                setFiltroContrato={handleChangeFiltro}
              />
            </div>
          <div> {(!loading && contratosBD.length == 0) && ( <p className="text-lg text-secondary">No hay contratos activos actualmente</p> )} 
        </div>
        </div>
          <BarraBusqueda 
            arrayDatos={contratosOrdenados}
            placeholder="Busque por dirección o propietario..."
            setDatosFiltrados={setContratosMostrar}
            propiedadesBusqueda={["direccionInmueble", "nombrePropietario", "apellidoPropietario"]}
          />

        {filtroContrato !== 'no-vigentes' && (
          <div className="grid gap-4">
            {contratosMostrar?.map((contrato) => {
              const isExpanded = vistaDetallada || expandedCard === contrato.id;
              return (
                <ContratoAlquilerCard
                  key={contrato.id}
                  contrato={contrato}
                  isExpanded={isExpanded}
                  onToggle={toggleCard}
                  alquileresPendientes={alquileresPendientes as unknown as { contratoId: number }[]}
                  loadingPendientes={loadingPendientes}
                  onRegistrarPago={handleAbrirModalPago}
                />
              );
            })}
          </div>
        )}

        {filtroContrato === 'no-vigentes' && (
          <div className="grid gap-6">
            {contratosMostrar?.map((contrato) => (
              <ContratoHistorialCard key={contrato.id} contrato={contrato} />
            ))}
          </div>
        )}

        {/* Modal de Registro de Pago */}
        {filtroContrato !== 'no-vigentes' && contratoSeleccionado && (
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
