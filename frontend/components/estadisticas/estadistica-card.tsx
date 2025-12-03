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

export default function EstadisticaCard({ titulo, valor = "N/A", icono, subtitulo, tituloAyuda = "", cargando=false, coloresIcono }: EstadisticaCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow border-1 border-foreground/20">
      <CardContent className="px-6">
        {cargando ? (
          <>
            {/* Mobile: Layout vertical */}
            <div className="flex flex-col gap-3 md:hidden">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-16" />
              {subtitulo && <Skeleton className="h-3 w-32" />}
            </div>
            
            {/* Desktop: Layout horizontal */}
            <div className="hidden md:flex justify-between items-center gap-4">
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-8 w-20 mb-2" />
                {subtitulo && <Skeleton className="h-3 w-40" />}
              </div>
              <div>
                <Skeleton className="h-16 w-16 rounded-lg" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Mobile: Layout vertical centrado */}
            <div className="flex flex-col gap-1 md:hidden">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs font-medium flex-1">{titulo}</CardTitle>
                <div className={`p-2 rounded-lg flex-shrink-0 ${coloresIcono}`}>
                  <div className="scale-75">
                    {icono}
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold font-sans text-foreground/80 break-all truncate">
                  <p title={valor.toString()}>{valor}</p>
              </div>
              {subtitulo && <p className="text-xs text-muted-foreground truncate">{subtitulo}</p>}
            </div>
            
            {/* Desktop: Layout horizontal */}
            <div className="hidden md:flex justify-between items-center gap-4">
              <div title={tituloAyuda} className="flex-1 min-w-0 hover:cursor-help">
                <CardTitle className="text-sm md:text-base font-medium">{titulo}</CardTitle>
                <div className="text-3xl font-bold font-sans text-foreground/80 break-words">{valor}</div>
                {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
              </div>
              <div className="flex-shrink-0">
                <div className={`p-4 rounded-lg ${coloresIcono}`}>
                  {icono}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}