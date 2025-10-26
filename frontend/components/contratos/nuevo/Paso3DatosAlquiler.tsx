"use client";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Percent } from 'lucide-react';
import { Contrato } from '@/types/Contrato';

interface Paso3Props {
  formData: Contrato;
  montoDisplay: string;
  onMontoChange: (value: string) => void;
  onMontoBlur: () => void;
  onChange: (field: string, value: any) => void;
  formatMontoVisual: (v: number) => string;
}

export default function Paso3DatosAlquiler({
  formData,
  montoDisplay,
  onMontoChange,
  onMontoBlur,
  onChange,
}: Paso3Props) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-5 w-5" />
        <span className="font-semibold">Paso 3: Datos de Alquiler</span>
      </div>
      <div className="space-y-4 w-fit">
        <Label>Monto Inicial de Locación *</Label>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="$ 0"
          value={montoDisplay}
          onChange={(e) => onMontoChange(e.target.value)}
          onBlur={onMontoBlur}
          required
        />
        <Label>Tipo de Aumento *</Label>
        <Select
          value={formData.tipoAumento}
          onValueChange={(value) => {
            onChange('tipoAumento', value);
            if (value === 'ICL') {
              onChange('porcentajeAumento', '0');
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo de aumento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Porcentaje fijo">Porcentaje fijo</SelectItem>
            <SelectItem value="ICL">ICL</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <Label>Porcentaje de Aumento</Label>
        </div>
        <div className="relative w-fit">
          <Input
            type="number"
            inputMode='decimal'
            min={0}
            value={formData.porcentajeAumento}
            disabled={formData.tipoAumento !== 'Porcentaje fijo'}
            onChange={(e) => onChange('porcentajeAumento', e.target.value)}
            placeholder={formData.tipoAumento === 'ICL' ? 'N/A para ICL' : 'Ingrese porcentaje'}
            className="pr-8"
          />
          {formData.porcentajeAumento && formData.tipoAumento === 'Porcentaje fijo' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          )}
        </div>
        {formData.tipoAumento === 'ICL' && (
          <p className="text-xs text-muted-foreground">El porcentaje se calcula por índice ICL y no puede modificarse manualmente.</p>
        )}
      </div>
    </>
  );
}
