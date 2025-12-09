"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Users,
  CreditCard,
  Notebook,
  FileChartColumnIncreasing,
  EditIcon,
  Receipt,
  Handshake,
  PiggyBank,
} from "lucide-react"

import { useEffect, useRef, useState } from "react"
import { fetchJSON } from "@/utils/functions/fetchWithCredentials"
import Loading from "@/components/loading"
import EstadisticaCard from "@/components/estadisticas/estadistica-card"
import { createSwapy } from "swapy"
import CardPages from "@/components/home/CardPages"
import CardPagesSecundarias from "@/components/home/CardPagesSecundarias"

export default function HomePage() {
  const [loading, setLoading] = useState(false)
  const [cargandoContadores, setCargandoContadores] = useState(true)
  const [editingLayout, setEditingLayout] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [contadores, setContadores] = useState({
    cantInmueblesActivos: -99,
    cantContratosVigentes: -99,
    cantServiciosNoPagos: -99,
    honorariosDelMes: -99,
  })
  const SLOTS = ["a", "b", "c", "d", "e", "f"] as const
  const DEFAULT_ORDER = [
    "locadores",
    "pago-servicios",
    "alquileres",
    "inquilinos",
    "inmuebles",
    "informes",
  ] as const
  type ItemId = typeof DEFAULT_ORDER[number]
  const [order, setOrder] = useState<ItemId[]>([...DEFAULT_ORDER])

  // Cargar contadores (placeholder: desactivar loading inmediatamente)
  useEffect(() => {
  const fetchContadores = async () => {

    try {
      const cantInmuebles = await fetchJSON<number>('/inmuebles/count/activos');
      const cantContratos = await fetchJSON<number>('/contratos/count/vigentes');
      const cantServicios = await fetchJSON('/pagos-servicios/count/pendientes')
      const honorarios = await fetchJSON<number>('/alquileres/honorarios')

      setContadores({
        cantInmueblesActivos: cantInmuebles,
        cantContratosVigentes: cantContratos,
        cantServiciosNoPagos: cantServicios.serviciosPendientes,
        honorariosDelMes: honorarios
      });

      setCargandoContadores(false);
    } catch (err: any) {
      console.error("Error al traer contadores:", err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchContadores();
}, []);

  // Inicializar / destruir Swapy según modo edición
  useEffect(() => {
    if (editingLayout && containerRef.current) {
      // Inicializa Swapy (sin opciones personalizadas para compatibilidad tipada)
      const swapy = createSwapy(containerRef.current)
      return () => swapy.destroy()
    }
  }, [editingLayout])

  // Cargar orden desde localStorage al montar
  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      const raw = window.localStorage.getItem("homeCardOrder")
      if (!raw) return
      const parsed = JSON.parse(raw)
      const isValidArray = Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length
      const sameItems = isValidArray && DEFAULT_ORDER.every((id) => parsed.includes(id))
      if (sameItems) {
        setOrder(parsed as ItemId[])
      }
    } catch (e) {
      console.warn("No se pudo leer 'homeCardOrder' de localStorage:", e)
    }
  }, [])

  // Configuración por item
  const ITEM_CONFIG: Record<ItemId, {
    href: string;
    title: string;
    desc: string;
    iconPrimary: JSX.Element;
    iconSecondary: JSX.Element;
    borderClass: string;
    hoverBorderClass: string;
    iconWrapperClass: string;
  }> = {
    "locadores": {
      href: "/propietarios",
      title: "Locadores",
      desc: "Visualice y gestione la información de locadores registrados dentro del sistema",
      iconPrimary: <Users className="h-12 w-12 text-accent" />,
      iconSecondary: <Users className="h-7 w-7 text-secondary" />,
      borderClass: "border-2 border-[var(--amarillo-alqui)]/20",
      hoverBorderClass: "hover:border-[var(--amarillo-alqui)]",
      iconWrapperClass: "bg-accent/10 group-hover:bg-accent/20",
    },
    "pago-servicios": {
      href: "/pago-servicios",
      title: "Pago de Servicios",
      desc: "Gestiona los pagos de servicios de cada contrato controlados por el estudio jurídico",
      iconPrimary: <CreditCard className="h-12 w-12 text-green-600" />,
      iconSecondary: <CreditCard className="h-7 w-7 text-secondary" />,
      borderClass: "border-2 border-green-500/20",
      hoverBorderClass: "hover:border-green-500",
      iconWrapperClass: "bg-green-500/10 group-hover:bg-green-500/20",
    },
    "alquileres": {
      href: "/alquileres",
      title: "Contratos de Alquiler",
      desc: "Visualice y administre la información de todos los contratos de alquiler.",
      iconPrimary: <Notebook className="h-12 w-12 text-[var(--amarillo-alqui)]" />,
      iconSecondary: <Notebook className="h-7 w-7 text-secondary" />,
      borderClass: "border-2 border-[var(--amarillo-alqui)]/20",
      hoverBorderClass: "hover:border-[var(--amarillo-alqui)]",
      iconWrapperClass: "bg-[var(--amarillo-alqui)]/10 group-hover:bg-[var(--amarillo-alqui)]/20",
    },
    "inquilinos": {
      href: "/inquilinos",
      title: "Locatarios",
      desc: "Administra la información de locatarios registrados dentro del sistema",
      iconPrimary: <Users className="h-12 w-12 text-accent" />,
      iconSecondary: <Users className="h-7 w-7 text-secondary" />,
      borderClass: "border-2 border-[var(--amarillo-alqui)]/20",
      hoverBorderClass: "hover:border-[var(--amarillo-alqui)]",
      iconWrapperClass: "bg-secondary/10 group-hover:bg-secondary/20",
    },
    "inmuebles": {
      href: "/inmuebles",
      title: "Inmuebles",
      desc: "Administra la información de inmuebles de locadores registrados en el sistema",
      iconPrimary: <Building2 className="h-12 w-12 text-accent" />,
      iconSecondary: <Building2 className="h-7 w-7 text-secondary" />,
      borderClass: "border-2 border-[var(--amarillo-alqui)]/20",
      hoverBorderClass: "hover:border-[var(--amarillo-alqui)]",
      iconWrapperClass: "bg-primary/10 group-hover:bg-primary/20",
    },
    "informes": {
      href: "/informes",
      title: "Reportes e Informes",
      desc: "Visualice y exporte informes mensuales sobre alquileres y honorarios",
      iconPrimary: <FileChartColumnIncreasing className="h-12 w-12 text-accent" />,
      iconSecondary: <FileChartColumnIncreasing className="h-7 w-7 text-secondary" />,
      borderClass: "border-2 border-[var(--amarillo-alqui)]/20",
      hoverBorderClass: "hover:border-[var(--amarillo-alqui)]",
      iconWrapperClass: "bg-secondary/10 group-hover:bg-secondary/20",
    },
  }

  // Lee el orden actual del DOM por slots a..f
  const readDomOrder = (): ItemId[] | null => {
    try {
      if (!containerRef.current) return null
      const result: ItemId[] = []
      for (const slot of SLOTS) {
        const slotEl = containerRef.current.querySelector(`[data-swapy-slot="${slot}"]`)
        if (!slotEl) continue
        const itemEl = slotEl.querySelector("[data-swapy-item]") as HTMLElement | null
        const id = itemEl?.getAttribute("data-swapy-item") as ItemId | null
        if (id) result.push(id)
      }
      const isValid = result.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every((id) => result.includes(id))
      return isValid ? result : null
    } catch (e) {
      console.warn("No se pudo leer el orden desde el DOM:", e)
      return null
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Loading text="Cargando..." />
      </div>
    )
  }

  return (
    <div className="bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 ">¡Bienvenido!</h2>
            <p className="text-muted-foreground font-sans text-xs md:text-sm">
              Gestione alquileres de forma simple.
            </p>
          </div>
          
        </div>

  {/* Cards DATOS ACTUALES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mx-2">
          <EstadisticaCard
            titulo="Servicios Pendientes"
            valor={contadores.cantServiciosNoPagos}
            icono={<Receipt className=" text-orange-700" />}
            coloresIcono="bg-orange-300"
            subtitulo="Servicios aún no pagados"
            tituloAyuda="Cantidad de facturas de servicios que figuran como no pagadas en el sistema"
            cargando={cargandoContadores}
          />

          <EstadisticaCard
            titulo="Alquileres Activos"
            valor={contadores.cantContratosVigentes}
            icono={<Handshake className=" text-green-700" />}
            coloresIcono="bg-green-300"
            subtitulo="Con contrato/s vigente/s"
            tituloAyuda="Cantidad de alquileres que se encuentran activos en el sistema"
            cargando={cargandoContadores}
          />

          <EstadisticaCard
            titulo="Inmuebles Gestionados"
            valor={contadores.cantInmueblesActivos}
            icono={<Building2 className="text-yellow-700" />}
            coloresIcono="bg-amber-200"
            subtitulo="Bajo administración"
            tituloAyuda="Cantidad de inmuebles activos bajo administración del estudio jurídico"
            cargando={cargandoContadores}
          />

          <EstadisticaCard
            titulo="Honorarios del mes"
            valor={`$ ${contadores.honorariosDelMes.toLocaleString('es-AR')}`}
            icono={<PiggyBank className=" text-slate-700" />}
            coloresIcono="bg-slate-300"
            subtitulo="Cálculo real acumulativo"
            tituloAyuda="Suma de los honorarios correspondientes a los alquileres ya pagos del mes actual"
            cargando={cargandoContadores}
          />
        </div>

        {/* Botón modo edición */}
        <div className="mb-3 flex justify-end mr-2">
          <Button
            className="w-38"
            variant={editingLayout ? "secondary" : "outline"}
            onClick={() => {
              if (editingLayout) {
                // Esperar a que Swapy haya aplicado la última mutación del DOM
                requestAnimationFrame(() => {
                  const newOrder = readDomOrder()
                  if (newOrder) {
                    // Solo actualizar si difiere del estado actual
                    const changed = newOrder.some((id, i) => id !== order[i])
                    if (changed) {
                      setOrder(newOrder)
                      try {
                        window.localStorage.setItem("homeCardOrder", JSON.stringify(newOrder))
                      } catch (e) {
                        console.warn("No se pudo guardar 'homeCardOrder' en localStorage:", e)
                      }
                    }
                  }
                  setEditingLayout(false)
                })
              } else {
                setEditingLayout(true)
              }
            }}
          >
            <div className="flex items-center gap-2">
              <EditIcon className="h-4 w-4" />
              {editingLayout ? "Guardar Orden" : "Ordenar Paneles"}
            </div>
          </Button>
        </div>

        {/* Contenedor Swapy unificado */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 ${editingLayout ? 'cursor-move' : ''}`}
          ref={containerRef}
          data-swapy-container
        >
          {order.map((id, idx) => {
            const cfg = ITEM_CONFIG[id]
            const slot = SLOTS[idx]
            return (
              <div key={`${slot}-${id}`} data-swapy-slot={slot} className="lg:col-span-2">
                <div data-swapy-item={id}>
                  <div className="variant-primary">
                    <CardPages
                      href={cfg.href}
                      title={cfg.title}
                      description={cfg.desc}
                      icon={cfg.iconPrimary}
                      borderClass={cfg.borderClass}
                      hoverBorderClass={cfg.hoverBorderClass}
                      iconWrapperClass={cfg.iconWrapperClass}
                      disabled={editingLayout}
                    />
                  </div>
                  <div className="variant-secondary">
                    <CardPagesSecundarias
                      href={cfg.href}
                      title={cfg.title}
                      description={cfg.desc}
                      icon={cfg.iconSecondary}
                      disabled={editingLayout}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CSS variantes con animación suave (sin “slide from left”) */}
        <style jsx global>{`
          /* Transiciones base */
          [data-swapy-slot] .variant-primary,
          [data-swapy-slot] .variant-secondary {
            transition: opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
                        transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
                        max-height 260ms ease;
            will-change: opacity, transform, max-height;
            overflow: hidden;
          }

          /* Por defecto: mostrar secundaria y ocultar primaria con fade/scale vertical */
          [data-swapy-slot] .variant-primary {
            opacity: 0;
            transform: translateY(4px) scale(0.98);
            max-height: 0;
            pointer-events: none;
          }

          [data-swapy-slot] .variant-secondary {
            opacity: 1;
            transform: translateY(0) scale(1);
            max-height: 999px; /* acordeón suave */
            pointer-events: auto;
          }

          /* En primera fila (a,b,c): mostrar primaria y ocultar secundaria */
          [data-swapy-slot="a"] .variant-primary,
          [data-swapy-slot="b"] .variant-primary,
          [data-swapy-slot="c"] .variant-primary {
            opacity: 1;
            transform: translateY(0) scale(1);
            max-height: 999px;
            pointer-events: auto;
          }

          [data-swapy-slot="a"] .variant-secondary,
          [data-swapy-slot="b"] .variant-secondary,
          [data-swapy-slot="c"] .variant-secondary {
            opacity: 0;
            transform: translateY(4px) scale(0.98);
            max-height: 0;
            pointer-events: none;
          }

          /* Respeta preferencias de movimiento reducido */
          @media (prefers-reduced-motion: reduce) {
            [data-swapy-slot] .variant-primary,
            [data-swapy-slot] .variant-secondary {
              transition: none !important;
            }
          }
        `}</style>
      </main>
    </div>
  )
}
