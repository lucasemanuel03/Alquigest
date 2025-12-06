"use client"

import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, HandCoins } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ExportarHonorariosPDF from '@/components/informes/exportar-honorarios-pdf'
import BACKEND_URL from '@/utils/backendURL'
import { fetchWithToken } from '@/utils/functions/auth-functions/fetchWithToken'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface HonorarioInmueble {
	inmuebleId: number
	direccionInmueble: string
	contratoId: number
	nombrePropietario: string
	apellidoPropietario: string
	nombreInquilino: string
	apellidoInquilino: string
	montoAlquiler: number
	honorario: number
}

interface HonorariosResponse {
	periodo: string
	honorariosPorInmueble: HonorarioInmueble[]
	totalHonorarios: number
}

export default function HonorariosMesPage() {
	const [data, setData] = useState<HonorariosResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			setError(null)
			try {
                const resp = await fetchWithToken(`${BACKEND_URL}/informes/honorarios`)
                // Normalizar respuesta según nuevo esquema
                const normalizado: HonorariosResponse = {
                    periodo: resp?.periodo ?? '--/----',
                    honorariosPorInmueble: Array.isArray(resp?.honorariosPorInmueble) ? resp.honorariosPorInmueble : [],
                    totalHonorarios: typeof resp?.totalHonorarios === 'number' ? resp.totalHonorarios : 0,
                }
                setData(normalizado)
			} catch (e: any) {
				setError(e.message || 'Error al cargar informe')
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [])

	const formatoMoneda = (valor: number) => valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })

			const honorariosOrdenados = useMemo(() => {
				if (!data) return []
				const items = Array.isArray(data.honorariosPorInmueble) ? data.honorariosPorInmueble : []
				// Ordenar por honorario descendente para priorizar mayores importes
				return [...items].sort((a, b) => b.honorario - a.honorario)
			}, [data])

	return (
		<div className="min-h-screen bg-background">
			<main className="container mx-auto px-6 py-8 pt-25 sm:pt-28">
				<Link href={"/informes"} className="mb-8 flex flex-col gap-3">
					<Button variant="outline" className="w-fit">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Volver
					</Button>
				</Link>

				<div className="flex items-center gap-2 mb-8">
					<HandCoins className="h-12 w-12" />
					<div className="flex flex-col gap-0">
						<p className="text-2xl font-bold">Honorarios del mes</p>
						<p className="text-secondary">Detalle de los alquileres y sus honorarios correspondientes al período actual.</p>
					</div>
				</div>

				{/* Resumen */}
				<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
					<Card>
						<CardHeader className="pb-2 flex flex-col items-center">
							<CardTitle className="text-base sm:text-lg font-light">Período</CardTitle>
							<CardDescription>
                                <p className='text-lg sm:text-2xl font-bold text-primary'>
                                    {loading ? <Skeleton className="h-5 w-24" /> : data?.periodo || '--/----'}
                                </p>
                                </CardDescription>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2 flex flex-col items-center">
							<CardTitle className="text-base sm:text-lg font-light">Total Honorarios</CardTitle>
							<CardDescription>
                                <p className='text-lg sm:text-2xl font-bold text-primary'>
								    {loading ? <Skeleton className="h-5 w-32" /> : data ? formatoMoneda(data.totalHonorarios) : '—'}
                                </p>
                            </CardDescription>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2 flex flex-col items-center">
							<CardTitle className="text-base sm:text-lg font-light">Alquileres pagados</CardTitle>
							<CardDescription>
                                <p className='text-lg sm:text-2xl font-bold'>
                                    {loading ? <Skeleton className="h-5 w-24" /> : data ? `${data.honorariosPorInmueble.length}` : '—'}
                                </p>
                                    
							</CardDescription>
						</CardHeader>
					</Card>
                    <Card>
						<CardHeader className="pb-2 flex flex-col items-center">
							<CardTitle className="text-base sm:text-lg font-light">Honorarios promedio</CardTitle>
							<CardDescription>
                                <p className='text-lg sm:text-2xl font-bold'>
                                    {loading ? <Skeleton className="h-5 w-24" /> : data ? `${formatoMoneda(data.honorariosPorInmueble.length > 0 ? data.totalHonorarios / data.honorariosPorInmueble.length : 0)}` : '—'}
                                </p>
                                    
							</CardDescription>
						</CardHeader>
					</Card>
				</div>

				<div className="flex justify-between items-center mb-6">
					<p className="text-lg font-semibold">Listado de Alquileres pagados</p>
					{data && (
					  <ExportarHonorariosPDF
					    periodo={data.periodo}
					    totalHonorarios={data.totalHonorarios}
					    honorarios={honorariosOrdenados}
					    promedioHonorarios={data.honorariosPorInmueble.length ? data.totalHonorarios / data.honorariosPorInmueble.length : 0}
					    disabled={loading || !!error}
					  />
					)}
				</div>

				{/* Estado de carga / error */}
				{error && (
					<div className="mb-6 text-red-500 text-sm">{error}</div>
				)}
				{loading && !data && (
					<div className="space-y-3">
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className="h-24 w-full" />
						))}
					</div>
				)}

				{!loading && data && honorariosOrdenados.length === 0 && (
					<p className="text-secondary">No hay honorarios registrados para el período.</p>
				)}

				{/* Lista de honorarios por inmueble */}
				<div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
					{honorariosOrdenados.map(item => (
                        <Link href={`/contratos/${item.contratoId}`}>
                            <Card key={`${item.inmuebleId}-${item.contratoId}`} className="hover:shadow-sm transition-colors">
                                <CardHeader className="">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold flex flex-col sm:flex-row sm:items-center gap-1">
                                            <span className="text-foreground">{item.direccionInmueble}</span>
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm flex flex-col sm:flex-row sm:gap-5">
                                        <span>Locador: {item.apellidoPropietario}, {item.nombrePropietario}</span>
                                        <span>Locatario: {item.apellidoInquilino}, {item.nombreInquilino}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <div className="flex flex-col text-sm gap-1">
                                            <span>Monto alquiler: <strong>{formatoMoneda(item.montoAlquiler)}</strong></span>
                                            <span className='text-primary'>Honorario: <strong>{formatoMoneda(item.honorario)}</strong></span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
					))}

				</div>
			</main>
		</div>
	)
}

