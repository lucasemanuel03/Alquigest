import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";


interface EstadisticaCardProps {
  titulo: string;
  valor?: string | number;
  icono: React.ReactNode;
  subtitulo?: string;
  tituloAyuda?: string;
  cargando?: boolean;
  coloresIcono?: string;
}

export default function EstadisticaCard({ titulo, valor = "N/A", icono, subtitulo, tituloAyuda = "Alquigest S.A.", cargando=false, coloresIcono }: EstadisticaCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow border-1 border-foreground/20">
      <CardContent className="flex justify-between items-center gap-4">
        <div>
          {cargando ? (
            <>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </>
          ) : (
            <>
              <CardTitle className="text-sm md:text-base font-medium ">{titulo}</CardTitle>
              
            </>
          )}

          {cargando ? (
            <>
              <Skeleton className="h-8 w-20 mb-2" />
              {subtitulo ? <Skeleton className="h-3 w-40" /> : null}
            </>
          ) : (
            <>
              <div className="text-3xl font-bold font-sans text-foreground/80">{valor}</div>
              {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
            </>
          )}
        </div>
        <div>
          <div className={` p-4 rounded-lg ${coloresIcono}`}>
            {icono}
          </div>
        </div>
      
   
      </CardContent>
    </Card>
  );
}