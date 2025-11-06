"use client";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar1Icon } from 'lucide-react';
import { Contrato } from '@/types/Contrato';
import { useState } from 'react';

interface Paso2Props {
  formData: Contrato;
  onChange: (field: string, value: any) => void;
}

export default function Paso2Fechas({ formData, onChange }: Paso2Props) {
  const fechaActual = new Date().toISOString().split('T')[0]
  formData.fechaInicio = fechaActual

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Calendar1Icon className="h-5 w-5" />
        <span className="font-semibold">Paso 2: Fechas</span>
      </div>
      <div className="space-y-4">
        <Label>Inicio del Contrato *</Label>
        <Input
          type="date"

          value={formData.fechaInicio}
          onChange={(e) => onChange('fechaInicio', e.target.value)}
          required
        />
        <Label>Fin del Contrato *</Label>
        <Input
          type="date"
          min={formData.fechaInicio || new Date().toISOString().split('T')[0]}
          value={formData.fechaFin}
          onChange={(e) => onChange('fechaFin', e.target.value)}
          required
        />
        <Label>Periodo de Aumento (meses)</Label>
        <Input
          placeholder="Ingrese cada cuantos meses se actualizará el alquiler (1 a 12)"
          type="number"
          min={1}
          max={12}
          value={formData.periodoAumento}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (e.target.value === '' || (value >= 1 && value <= 12)) {
              onChange('periodoAumento', e.target.value);
            }
          }}
        />
      </div>
    </>
  );
}
