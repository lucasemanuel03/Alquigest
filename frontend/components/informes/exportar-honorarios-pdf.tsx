"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import jsPDF from "jspdf"

export interface HonorarioItemPDF {
  inmuebleId: number
  direccionInmueble: string
  contratoId: number
  nombrePropietario: string
  apellidoPropietario: string
  nombreInquilino: string
  apellidoInquilino: string
  montoAlquiler: number
  honorario: number
}

interface ExportarHonorariosPDFProps {
  periodo: string
  totalHonorarios: number
  honorarios: HonorarioItemPDF[]
  promedioHonorarios?: number
  disabled?: boolean
  onBeforeGenerate?: () => Promise<void> | void
}

// Helper formato moneda ARS
const formatoMoneda = (valor: number) =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  })

export default function ExportarHonorariosPDF({
  periodo,
  totalHonorarios,
  honorarios,
  promedioHonorarios,
  disabled,
  onBeforeGenerate,
}: ExportarHonorariosPDFProps) {
  const cargarImagen = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      }
      img.onerror = reject
      img.src = src
    })
  }

  const generarPDF = async () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" })
    const fechaActual = new Date()
    const fechaCompleta = fechaActual.toLocaleDateString("es-AR")

    // Intentar cargar logo
    try {
      const logo = await cargarImagen("/alquigest-dark.png")
      doc.addImage(logo, "PNG", 30, 30, 110, 20)
    } catch (e) {
      // Silenciar error de logo
    }

    // Encabezado
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(0, 50, 100)
    doc.text("Informe de Honorarios Mensuales", 30, 80)

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(`Período: ${periodo}`, 30, 100)
    doc.setFont("helvetica", "normal")
    doc.text(`Fecha de generación: ${fechaCompleta}`, 30, 115)
    doc.text(`Alquileres pagados: ${honorarios.length}`, 30, 130)
    doc.text(`Total Honorarios: ${formatoMoneda(totalHonorarios)}`, 30, 145)
    if (honorarios.length > 0) {
      const prom = typeof promedioHonorarios === "number" ? promedioHonorarios : totalHonorarios / honorarios.length
      doc.text(`Honorario promedio: ${formatoMoneda(prom)}`, 30, 160)
    }

    // Línea separadora
    doc.setLineWidth(0.5)
    doc.line(30, 180, 560, 180)

    // Tabla de detalles
    let y = 195
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("Detalle de alquileres pagados", 30, y)
    y += 15

    // Definir columnas (reducimos Dirección y damos más espacio a Locador/Locatario)
    const COL_DIR_X = 30, COL_DIR_W = 120
    const COL_LOCADOR_X = 160, COL_LOCADOR_W = 150
    const COL_LOCATARIO_X = 320, COL_LOCATARIO_W = 150
    const COL_ALQUILER_X_RIGHT = 500 // alineado a la derecha
    const COL_HONORARIO_X_RIGHT = 560 // alineado a la derecha

    const headerY = y
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("Dirección", COL_DIR_X, headerY)
    doc.text("Locador", COL_LOCADOR_X, headerY)
    doc.text("Locatario", COL_LOCATARIO_X, headerY)
    doc.text("Alquiler", COL_ALQUILER_X_RIGHT - 40, headerY) // título cerca de la columna numérica
    doc.text("Honorario", COL_HONORARIO_X_RIGHT - 50, headerY)

    y += 6
    doc.setLineWidth(0.3)
    doc.line(30, y, 560, y)
    y += 10

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    honorarios.forEach((h) => {
      // Salto a nueva página si es necesario
      if (y > 760) {
        doc.addPage()
        y = 40
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.text("Dirección", COL_DIR_X, y)
        doc.text("Locador", COL_LOCADOR_X, y)
        doc.text("Locatario", COL_LOCATARIO_X, y)
        doc.text("Alquiler", COL_ALQUILER_X_RIGHT - 40, y)
        doc.text("Honorario", COL_HONORARIO_X_RIGHT - 50, y)
        y += 6
        doc.line(30, y, 560, y)
        y += 10
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
      }

      // Preparar textos (permitir múltiples líneas para locador/locatario)
      const locadorFull = `${h.apellidoPropietario}, ${h.nombrePropietario}`
      const locatarioFull = `${h.apellidoInquilino}, ${h.nombreInquilino}`

      const direccionLines = doc.splitTextToSize(h.direccionInmueble, COL_DIR_W)
      const locadorLines = doc.splitTextToSize(locadorFull, COL_LOCADOR_W)
      const locatarioLines = doc.splitTextToSize(locatarioFull, COL_LOCATARIO_W)

      const lineHeight = 10
      const maxLines = Math.max(direccionLines.length, locadorLines.length, locatarioLines.length)

      for (let i = 0; i < maxLines; i++) {
        const yLine = y + i * lineHeight
        const dirLine = direccionLines[i]
        const locLine = locadorLines[i]
        const loctLine = locatarioLines[i]
        if (dirLine) doc.text(dirLine, COL_DIR_X, yLine)
        if (locLine) doc.text(locLine, COL_LOCADOR_X, yLine)
        if (loctLine) doc.text(loctLine, COL_LOCATARIO_X, yLine)
        // Solo escribir montos en la primera línea de la fila
        if (i === 0) {
          doc.text(formatoMoneda(h.montoAlquiler), COL_ALQUILER_X_RIGHT, yLine, { align: 'right' as const })
          doc.text(formatoMoneda(h.honorario), COL_HONORARIO_X_RIGHT, yLine, { align: 'right' as const })
        }
      }

      // Incrementar y según la mayor altura usada
      y += maxLines * lineHeight
      y += 4
    })

    // Totales finales
    if (y > 740) {
      doc.addPage()
      y = 60
    }
    doc.setLineWidth(0.5)
    doc.line(30, y, 560, y)
    y += 30
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.setTextColor(0, 100, 0)
    doc.text(`Total de Honorarios: ${formatoMoneda(totalHonorarios)}`, 30, y)
    y += 25

    // Pie
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Reporte generado por el sistema AlquiGest.", 30, 815)
    doc.text("Gestione alquileres de forma simple.", 30, 828)

    const safePeriodo = periodo.replace(/[^0-9A-Za-z_-]/g, "_")
    const nombreArchivo = `Honorarios_${safePeriodo}.pdf`
    doc.save(nombreArchivo)
  }

  const handleClick = async () => {
    if (disabled) return
    if (onBeforeGenerate) {
      try {
        await onBeforeGenerate()
      } catch (e) {
        console.error("Error pre generación PDF honorarios:", e)
      }
    }
    await generarPDF()
  }

  return (
    <Button onClick={handleClick} disabled={disabled || !honorarios.length} variant="secondary">
      <FileDown className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  )
}
