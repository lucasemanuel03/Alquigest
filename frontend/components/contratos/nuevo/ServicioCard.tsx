import { BORDER_HOVER_CLASSES, ServicioContrato, TIPO_SERVICIO_LABEL } from "@/types/ServicioContrato";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TipoServicioIcon from "@/components/tipoServicioIcon";
import React from "react";

interface ServicioCardProps {
  s: ServicioContrato;
  updateServicio: (tipoServicio: number, patch: Partial<ServicioContrato>) => void;
}

const ServicioCard: React.FC<ServicioCardProps> = ({ s, updateServicio }) => {
  const expanded = s.esActivo;
  return (
    <Card
      key={s.tipoServicioId}
      className={`${BORDER_HOVER_CLASSES[s.tipoServicioId]} border-muted transition-all duration-200 hover:shadow-lg`}
    >
      <CardHeader
        className="flex flex-row items-center justify-between hover:cursor-pointer"
        onClick={() => updateServicio(s.tipoServicioId, { esActivo: !expanded })}
      >
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="flex items-center gap-3">
            <TipoServicioIcon tipoServicio={s.tipoServicioId} className="h-8 w-8" />
            {TIPO_SERVICIO_LABEL[s.tipoServicioId]}
          </div>
        </CardTitle>
        <div className="flex items-center">
          <Checkbox
            checked={s.esActivo}
            onCheckedChange={(v) => updateServicio(s.tipoServicioId, { esActivo: Boolean(v) })}
            className="mr-2 transition-all"
          />
          <div className="text-xs text-muted-foreground">
            {expanded ? "Con control" : "No controlado"}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`nroCuenta-${s.tipoServicioId}`}>Nro. de Cuenta</Label>
              <Input
                id={`nroCuenta-${s.tipoServicioId}`}
                type="text"
                required
                inputMode="numeric"
                value={s.nroCuenta ?? ""}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  updateServicio(s.tipoServicioId, { nroCuenta: onlyDigits ? Number(onlyDigits) : null });
                }}
                placeholder="Ej: 123456789"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>¿Quién paga?</Label>
              <Select
                value={s.esDeInquilino ? "inquilino" : "estudio"}
                onValueChange={(v) => updateServicio(s.tipoServicioId, { esDeInquilino: v === "inquilino" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquilino">Inquilino</SelectItem>
                  <SelectItem value="estudio">Estudio jurídico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-col">
              <Label>Periodicidad</Label>
              <Select
                value={s.esAnual ? "anual" : "mestral"}
                onValueChange={(v) => updateServicio(s.tipoServicioId, { esAnual: v === "anual" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodicidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="mestral">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ServicioCard;
