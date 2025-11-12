import { ESTADOS_INMUEBLE } from "@/utils/constantes";
import { Badge } from "../ui/badge";

export default function BadgeInmueble({ estadoInmueble } : { estadoInmueble: number }) {
  
    switch (estadoInmueble) {
      case 1: // Disponible
        return (
          <div className="flex flex-col items-end space-y-1">
            <Badge className="bg-emerald-600/80 w-25">
              {ESTADOS_INMUEBLE[estadoInmueble - 1].nombre}
            </Badge>
          </div>
        );
      case 2: // En Reparación
        return (
          <div className="flex flex-col items-end space-y-1">
            <Badge className="bg-orange-600/80 w-25">
              {ESTADOS_INMUEBLE[estadoInmueble - 1].nombre}
            </Badge>
          </div>
        );
      case 4: // ALQUILADO
        return (
          <div className="flex flex-col items-end space-y-1">
            <Badge className="bg-yellow-600/80 w-25">
              {ESTADOS_INMUEBLE[estadoInmueble - 1].nombre}
            </Badge>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-end space-y-1">
            <Badge variant={"secondary"} className="w-25">
              {ESTADOS_INMUEBLE[estadoInmueble - 1].nombre}
            </Badge>
          </div>
        );

    }
}