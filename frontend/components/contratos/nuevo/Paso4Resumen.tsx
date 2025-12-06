"use client";
import { Separator } from '@/components/ui/separator';
import { BuildingIcon, User, Calendar1Icon, Receipt, ChartColumnIcon, Clock, Blocks, CheckSquareIcon, PercentCircle, FileText } from 'lucide-react';
import { Contrato } from '@/types/Contrato';
import { DatosAdicionales } from '@/hooks/useNuevoContratoForm';
import { ServicioContrato, TIPO_SERVICIO_LABEL } from '@/types/ServicioContrato';
import TipoServicioIcon from '@/components/tipoServicioIcon';

interface Paso4Props {
  formData: Contrato;
  datosAdicionales: DatosAdicionales;
  serviciosContrato: ServicioContrato[];
  formatMontoVisual: (v: number) => string;
  pdfFile?: File | null; // archivo PDF opcional cargado en el paso anterior
}

export default function Paso4Resumen({ formData, datosAdicionales, serviciosContrato, formatMontoVisual, pdfFile }: Paso4Props) {
  return (
    <>
      <div className="flex items-center gap-2">
        <CheckSquareIcon className='h-5 w-5'/>
        <span className="font-semibold">Confirme los Datos</span>
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BuildingIcon className="h-4 w-4" />
          <p><b>Inmueble:</b> {datosAdicionales.direccionInmueble}</p>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <p><b>Locador:</b> {datosAdicionales.nombrePropietario} {datosAdicionales.apellidoPropietario}</p>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <p><b>Locatario:</b> {datosAdicionales.nombreInquilino} {datosAdicionales.apellidoInquilino}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar1Icon className="h-4 w-4" />
          <p><b>Fechas:</b> Desde: {formData.fechaInicio} - Hasta: {formData.fechaFin}</p>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          <p><b>Monto Inicial de Alquiler:</b> $ {formatMontoVisual(formData.monto)}</p>
        </div>
        <div className="flex items-center gap-2">
          <PercentCircle className="h-4 w-4" />
          <p><b>Porcentaje Honorarios:</b> {formatMontoVisual(formData.porcentajeHonorario)}%</p>
        </div>
        <div className="flex items-center gap-2">
          <ChartColumnIcon className="h-4 w-4" />
          <p><b>Aumento:</b> {formData.tipoAumento} ({formData.tipoAumento === 'ICL' ? 'según índice mensual' : `${formData.porcentajeAumento}%`})</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <p><b>Periodo de Aumento:</b> cada {formData.periodoAumento} meses</p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <p><b>¿Se adjunta PDF?:</b> {pdfFile ? 'Sí' : 'No'}</p>
        </div>
      </div>
      <Separator className="my-4" />
      <div>
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <Blocks className="h-5 w-5" />
            <p className='font-semibold'>Servicios controlados:</p>
          </div>
            {serviciosContrato.map((servicio) => (
              <div className='' >
                {(servicio.esActivo) &&
                  <div className='my-2 grid grid-cols-3 gap-5 items-center justify-between bg-muted/40 rounded-xl border-border border-1 p-2 text-sm'>
                    <div className='flex items-center gap-2'>
                      <TipoServicioIcon tipoServicio={servicio.tipoServicioId} className="h-7 w-7" />
                      <p className='font-bold'>{TIPO_SERVICIO_LABEL[servicio.tipoServicioId]}</p>
                    </div>
                    <div>
                      <p> Nro. de Cuenta: {servicio.nroCuenta || 'Sin cuenta'}</p>
                      {servicio.nroContratoServicio && <p> Nro. de Contrato: {servicio.nroContratoServicio}</p>}
                    </div>
                    <p>{servicio.esDeInquilino ? 'A cargo del Locatario' : 'A cargo del Estudio'}</p> 
                  </div>
                }
          </div>
            ))}
        </div>
      </div>
    </>
  );
}
