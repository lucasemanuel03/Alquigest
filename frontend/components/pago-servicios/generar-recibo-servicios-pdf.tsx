"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import jsPDF from 'jspdf'

interface DatosReciboServicios {
  periodo: string
  servicios: {
    id: number
    nombreTipoServicio: string
    monto: number
  }[]
  contrato: {
    fechaInicioContrato: string
    tipoInmueble: string
  }
  propietario: {
    nombre: string
    apellido: string
    direccion: string
    barrio: string
    dni: string
  }
  inquilino: {
    nombre: string
    apellido: string
    direccion: string
    barrio: string
    dni: string
  }
}

interface GenerarReciboServiciosPDFProps {
  datos: DatosReciboServicios
  direccionInmueble: string
}

export default function GenerarReciboServiciosPDF({
  datos,
  direccionInmueble
}: GenerarReciboServiciosPDFProps) {
  
  // Convierte número a texto en español (montos)
  const numeroATexto = (num: number): string => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']
    
    if (num === 0) return 'cero'
    if (num === 100) return 'cien'
    
    let texto = ''
    
    // Miles
    if (num >= 1000) {
      const miles = Math.floor(num / 1000)
      if (miles === 1) {
        texto += 'mil '
      } else {
        texto += numeroATexto(miles) + ' mil '
      }
      num = num % 1000
    }
    
    // Centenas
    if (num >= 100) {
      texto += centenas[Math.floor(num / 100)] + ' '
      num = num % 100
    }
    
    // Decenas y unidades
    if (num >= 20) {
      texto += decenas[Math.floor(num / 10)]
      if (num % 10 !== 0) {
        texto += ' y ' + unidades[num % 10]
      }
    } else if (num >= 10) {
      texto += especiales[num - 10]
    } else if (num > 0) {
      texto += unidades[num]
    }
    
    return texto.trim()
  }

  // Convierte fecha a texto legal
  const fechaATextoLegal = (fecha: Date): string => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    
    const dia = fecha.getDate()
    const mes = meses[fecha.getMonth()]
    const anio = fecha.getFullYear()
    
    // Convertir año a texto
    const anioTexto = numeroATexto(anio)
    
    return `${dia} de ${mes} del año ${anioTexto}`
  }

  const calcularTotal = () => {
    return datos.servicios.reduce((sum, servicio) => sum + servicio.monto, 0)
  }

  // Convierte fecha de contrato a texto legal
  const fechaContratoATexto = (fechaISO: string): string => {
    const fecha = new Date(fechaISO)
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    
    const dia = fecha.getDate()
    const mes = meses[fecha.getMonth()]
    const anio = fecha.getFullYear()
    const anioTexto = numeroATexto(anio)
    
    return `día ${dia} de ${mes} del año ${anioTexto}`
  }

  // Genera el texto de los servicios para el recibo
  const generarTextoServicios = (): string => {
    if (datos.servicios.length === 0) return ''
    
    const textoServicios = datos.servicios.map((servicio, index) => {
      const montoTexto = numeroATexto(servicio.monto)
      const esUltimo = index === datos.servicios.length - 1
      const esPenultimo = index === datos.servicios.length - 2
      
      let texto = `la suma de pesos ${montoTexto} ($${servicio.monto.toLocaleString('es-AR')}) a fin de abonar parte proporcional de ${servicio.nombreTipoServicio} correspondiente al periodo ${datos.periodo}`
      
      if (esUltimo && datos.servicios.length > 1) {
        texto = 'y ' + texto
      } else if (!esUltimo && !esPenultimo) {
        texto += ', '
      } else if (esPenultimo) {
        texto += ' '
      }
      
      return texto
    }).join('')
    
    return textoServicios
  }
  
  const generarPDF = async () => {
    const doc = new jsPDF()
    const fechaActual = new Date()
    const fechaTextoLegal = fechaATextoLegal(fechaActual)
    const fechaContratoTexto = fechaContratoATexto(datos.contrato.fechaInicioContrato)
    
    // Texto del recibo legal
    const textoRecibo = `Córdoba, ${fechaTextoLegal}. Recibo en nombre y representación de la parte locadora, ${generarTextoServicios()}. Dicho pago tiene como causa contrato de locación que comenzó a regir el ${fechaContratoTexto} y suscripto entre ${datos.propietario.apellido.toUpperCase()} ${datos.propietario.nombre.toUpperCase()} DNI ${datos.propietario.dni} con domicilio en ${datos.propietario.direccion} de barrio ${datos.propietario.barrio} de la Ciudad de Córdoba, por una parte, como LOCADORA y por la otra parte, ${datos.inquilino.apellido.toUpperCase()} ${datos.inquilino.nombre.toUpperCase()} DNI ${datos.inquilino.dni}, con domicilio real en ${datos.inquilino.direccion} de barrio ${datos.inquilino.barrio} de la Ciudad de Córdoba, como LOCATARIA del inmueble ubicado en ${direccionInmueble} de barrio ${datos.propietario.barrio} de la Ciudad de Córdoba, destinado a ${datos.contrato.tipoInmueble.toLowerCase()}.`
    
    // Configuración del documento
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    
    // Márgenes
    const margenIzquierdo = 20
    const margenDerecho = 190
    const anchoTexto = margenDerecho - margenIzquierdo
    
    // Dividir el texto en líneas que quepan en el ancho disponible
    const lineas = doc.splitTextToSize(textoRecibo, anchoTexto)
    
    // Agregar el texto justificado
    let yPosition = 40
    const interlineado = 7
    
    lineas.forEach((linea: string) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 40
      }
      
      doc.text(linea, margenIzquierdo, yPosition, { align: 'justify', maxWidth: anchoTexto })
      yPosition += interlineado
    })
    
    // Espacio después del texto principal
    yPosition += 20
    
    // Firma
    if (yPosition > 240) {
      doc.addPage()
      yPosition = 40
    }
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    
    // Línea para la firma
    const centroX = (margenIzquierdo + margenDerecho) / 2
    doc.line(centroX - 30, yPosition, centroX + 30, yPosition)
    
    yPosition += 7
    doc.text('Firma y Aclaración', centroX, yPosition, { align: 'center' })
    
    yPosition += 7
    doc.text('Estudio Jurídico - Carina Andrea Torres', centroX, yPosition, { align: 'center' })
    
    // Pie de página en la última página
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.text('Recibo generado por el sistema AlquiGest.', centroX, 280, { align: 'center' })
    
    // Guardar el PDF
    const [mes, anio] = datos.periodo.split('/')
    const nombreArchivo = `Recibo_Servicios_${datos.inquilino.apellido}_${mes}_${anio}.pdf`
    doc.save(nombreArchivo)
  }

  return (
    <Button onClick={generarPDF} className="bg-amber-500 hover:bg-amber-600">
      <FileDown className="h-4 w-4 mr-2" />
      Generar PDF
    </Button>
  )
}
