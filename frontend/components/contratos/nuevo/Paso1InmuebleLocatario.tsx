"use client";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import NuevoInquilinoModal from '@/app/inquilinos/nuevoInquilinoModal';
import { BuildingIcon, User, Plus } from 'lucide-react';
import { TIPOS_INMUEBLES } from '@/utils/constantes';
import { DatosAdicionales } from '@/hooks/useNuevoContratoForm';
import { Contrato } from '@/types/Contrato';
import NuevoInmuebleModal from '@/app/inmuebles/nuevo/nuevoInmuebleModal';
import BusquedaDesplegable from '@/components/busqueda/busqueda-desplegable';

interface Paso1Props {
  inmuebles: any[];
  propietarios: any[];
  inquilinos: any[];
  formData: Contrato;
  datosAdicionales: DatosAdicionales;
  onSelectInmueble: (inmueble: any, propietario: any) => void;
  onSelectInquilino: (inquilino: any) => void;
  onInquilinoCreado: (nuevo: any) => void;
  onInmuebleCreado: (nuevo: any) => void;
}

export default function Paso1InmuebleLocatario({
  inmuebles,
  propietarios,
  inquilinos,
  formData,
  datosAdicionales,
  onSelectInmueble,
  onSelectInquilino,
  onInquilinoCreado,
  onInmuebleCreado,
}: Paso1Props) {
  return (
    <>
      <Separator aria-setsize={4} />
      <div className="flex items-center gap-2 mb-4">
        <BuildingIcon className="h-5 w-5" />
        <span className="font-semibold">Datos del Inmueble</span>
      </div>
      <div className="space-y-4 w-full">
        <Label>Inmueble a Alquilar *
          {(inmuebles.length === 0) && (<p className="text-red-500">Actualmente No hay inmuebles disponibles en el sistema</p>)}
        </Label>
        <div className="flex items-center gap-5">
          <BusquedaDesplegable
            items={inmuebles}
            className='w-full max-w-90'
            placeholder='Buscar por dirección...'
            propiedadesBusqueda={['direccion']}
            onSelect={(item) => {
              const propietario = propietarios.find(p => p.id === item.propietarioId);
              onSelectInmueble(item, propietario);
            }}
          />
          <div>
            <NuevoInmuebleModal
              text="Nuevo"
              onInmuebleCreado={onInmuebleCreado}
            />
          </div>
        </div>
        <Label>Tipo de Inmueble</Label>
        <Input className="w-fit" value={TIPOS_INMUEBLES.find(t => t.id === datosAdicionales.tipoInmuebleId)?.nombre} readOnly />
        <Separator />
        <div className="flex items-center gap-2 mb-4 mt-6">
          <User className="h-5 w-5" />
          <span className="font-semibold">Datos del Locador</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nombre y Apellido</Label>
            <Input value={`${datosAdicionales.apellidoPropietario}, ${datosAdicionales.nombrePropietario}`} readOnly />
          </div>
          <div className="space-y-2">
            <Label>CUIL</Label>
            <Input value={datosAdicionales.dniPropietario} readOnly />
          </div>
        </div>
        <Separator />
        <div className="flex items-center gap-2 mb-4 mt-6">
          <User className="h-5 w-5" />
          <span className="font-semibold">Datos del Locatario</span>
        </div>
        <Label>Locatario *
          {(inquilinos.length === 0) && (<p className="text-red-500">Actualmente No hay Locatarios activos en el sistema</p>)}
        </Label>
        <div className="flex w-full items-center gap-5">
          <div className='w-full max-w-90'>
            <BusquedaDesplegable
              items={inquilinos}      
              placeholder='Buscar por apellido, nombre o CUIL'
              propiedadesBusqueda={['apellido', 'nombre', 'cuil']}
              getItemLabel={(inq) => `${inq.apellido}, ${inq.nombre} | CUIL: ${inq.cuil}`}
              onSelect={onSelectInquilino}
            />
          </div>
          <NuevoInquilinoModal
            text="Nuevo"
            onInquilinoCreado={(nuevo) => {
              onInquilinoCreado(nuevo);
            }}
          />
        </div>
      </div>
    </>
  );
}
