import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CalendarArrowUp, CreditCard, FileChartColumnIncreasing, HandCoins } from "lucide-react"
import Link from "next/link"



function InformeCard(
    {tituloInforme="Informe de Contratos",
        descripcion="Genera un informe detallado de todos los contratos activos y finalizados.",
        iconInforme=<CreditCard/>,
        classNameHeader="",
        classNameCard="",
        urlInforme="/"  }: 
        {tituloInforme?: string, descripcion?: string, textBoton?: string, urlInforme?: string, iconInforme?: React.ReactNode, classNameHeader?: string, classNameCard?: string}) {
    return (
        <Link
            href={urlInforme}>
            <Card className={`hover:shadow-lg hover:border-primary/70  transition-all h-full p-5 py-8`}>
                <CardHeader className={`${classNameHeader}`}>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        {iconInforme}
                        {tituloInforme}
                    </CardTitle>
                    <CardDescription className={`${classNameCard} text-base`}>
                        {descripcion}
                    </CardDescription>

                </CardHeader>
            </Card>
        </Link>
    )
}


export default function InformesPage() {
  return (
    <div  className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
            <Link href={"/"} className="mb-8 flex flex-col gap-3">
                <Button variant="outline" className="w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
            </Link>
                <div className="flex items-center gap-2">
                    <FileChartColumnIncreasing className="h-14 w-14"/>
                    <div className="flex flex-col gap-0">
                        <p className="text-2xl font-bold ">Gestión de Informes</p>
                        <p className="text-secondary text-sm sm:text-lg">Aquí podrás ver y descargar informes detallados sobre los contratos, pagos y servicios.</p>
                    </div>
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-15">
                <InformeCard
                    urlInforme="/informes/honorarios-mes"
                    tituloInforme="Honorarios del mes"
                    iconInforme={<HandCoins/>} 
                    descripcion="Informe detallado de honorarios por inmuebles/locadores."
                    />
                <InformeCard
                    urlInforme="/informes/aumentos-alquileres"
                    tituloInforme="Aumentos de alquileres"
                    descripcion="Informe detallado del historial de aumentos de los contratos de alquiler."
                    iconInforme={<CalendarArrowUp />}
                />
            </div>
        </main>
    </div>
  )
}