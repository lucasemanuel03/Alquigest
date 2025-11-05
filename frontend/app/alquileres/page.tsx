"use client"

import { Button } from "@/components/ui/button"
import { Calendar, ArrowLeft, AlertCircle, FileText } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { fetchWithToken } from "@/utils/functions/auth-functions/fetchWithToken"
import BACKEND_URL from "@/utils/backendURL"
import Loading from "@/components/loading";
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ContratoDetallado } from "@/types/ContratoDetallado";
import auth from "@/utils/functions/auth-functions/auth";
import ModalRegistrarPagoAlquiler from "@/components/modal-registrar-pago-alquiler";
import BarraBusqueda from "@/components/busqueda/barra-busqueda";
import StatCard from "@/components/alquileres/StatCard";
import AlquileresToolbar from "@/components/alquileres/AlquileresToolbar";
import ContratoAlquilerCard from "@/components/alquileres/ContratoAlquilerCard";
import { useAuth } from "@/contexts/AuthProvider"

export default function AlquileresPage() {

  const { hasPermission, hasRole, user } = useAuth();
  const searchParams = useSearchParams()
  const router = useRouter()

  // Leer filtro desde URL o usar "vigentes" por defecto
  const filtroFromURL = searchParams.get("filtro") as "vigentes" | "proximos-vencer" | null
  const filtrosValidos = ["vigentes", "proximos-vencer"]
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
  const [filtroContrato, setFiltroContrato] = useState<"vigentes" | "proximos-vencer">(filtroInicial);
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
  const handleChangeFiltro = (nuevoFiltro: "vigentes" | "proximos-vencer") => {
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
    // Principal: contratos filtrados + alquileres pendientes (maneja loading)
    const fetchPrincipal = async () => {
      console.log("Ejecutando fetch principal: Contratos y Alquileres pendientes...");
      setLoading(true);


      try {
        const [data, alquileresPend] = await Promise.all([
          fetchWithToken(`${BACKEND_URL}/contratos/${filtroContrato}`),
          fetchWithToken(`${BACKEND_URL}/alquileres/pendientes`),
        ]);

        console.log("Datos contratos:", data);
        console.log("Alquileres pendientes:", alquileresPend);

        setContatosBD(data);
        setContratosMostrar(data); // para búsqueda
        setAlquileresPendientes(alquileresPend);
        setLoading(false);

      } catch (err: any) {
        console.error("Error en fetch principal:", err.message);
        setLoading(false);
      }
    };

    fetchPrincipal();
  }, [filtroContrato, modalPagoOpen]);

  useEffect(() => {
    // Secundario: contadores (no toca loading)
    const fetchContadores = async () => {
      try {
        const [total, alqNoPagos] = await Promise.all([
          fetchWithToken(`${BACKEND_URL}/contratos/count/vigentes`),
          fetchWithToken(`${BACKEND_URL}/alquileres/count/pendientes`),
        ]);
        
        setTotalContratos(total);
        setAlquileresNoPagos(alqNoPagos);
      } catch (err: any) {
        console.error("Error al traer contadores:", err.message);
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Contratos Vigentes"
            value={totalContratos || "N/A"}
            description="Vigentes actualmente"
            icon={<Calendar className="h-5 w-5 text-foreground" />}
          />
          <StatCard
            title="Contratos por vencer"
            value={<span className="text-orange-600">{cantidadProxVencer}</span>}
            description="Vencen el mes que viene"
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          />
          <StatCard
            title="Alquileres No Pagos"
            value={<span className="text-orange-600">{cantAlquileresNoPagos}</span>}
            description="No pagaron antes del día 10"
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          />
          <StatCard
            title="Servicios No Pagos"
            value={<span className="text-orange-600">N/A</span>}
            description="Pendientes de pagar"
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          />
        </div>
        {/* Alquileres List */} 
        <div className="space-y-6"> 
          <div className="flex justify-between my-10">
            <div className="flex items-center justify-between"> 
              <h2 className="text-xl font-semibold font-sans">
                {filtroContrato === 'vigentes' ? 'Contratos de Alquiler Vigentes' : 'Contratos próximos a vencer'}
              </h2> 
            </div>
            <div className="flex items-center gap-4">
              <AlquileresToolbar
                vistaDetallada={vistaDetallada}
                setVistaDetallada={setVistaDetallada}
                orden={orden}
                setOrden={handleChangeOrden}
                filtroContrato={filtroContrato}
                setFiltroContrato={handleChangeFiltro}
              />
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

        <div className="grid gap-4">
          {contratosOrdenados?.map((contrato) => {
            const isExpanded = vistaDetallada || expandedCard === contrato.id;
            return (
              <ContratoAlquilerCard
                key={contrato.id}
                contrato={contrato}
                isExpanded={isExpanded}
                onToggle={toggleCard}
                alquileresPendientes={alquileresPendientes as unknown as { contratoId: number }[]}
                onRegistrarPago={handleAbrirModalPago}
              />
            );
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
