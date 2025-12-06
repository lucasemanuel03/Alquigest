"use client"

import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, CalendarArrowUp, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BACKEND_URL from '@/utils/backendURL'
import { fetchWithToken } from '@/utils/functions/auth-functions/fetchWithToken'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import GraficoAumentosContrato from '@/components/informes/grafico-aumentos'
import ExportarAumentosPDF from '@/components/informes/exportar-aumentos-pdf'

interface AumentoItem {
	aumentoId: number
	fechaAumento: string
	montoAnterior: number
	montoNuevo: number
	porcentajeAumento: number
}

interface AumentoPorContrato {
	contratoId: number
	direccionInmueble: string
	nombreInquilino: string
	apellidoInquilino: string
	nombrePropietario: string
	apellidoPropietario: string
	aumentos: AumentoItem[]
}

interface AumentosResponse {
	periodoDesde: string
	periodoHasta: string
	aumentosPorContrato: AumentoPorContrato[]
}

export default function AumentosAlquileresPage() {
	const [data, setData] = useState<AumentosResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [meses, setMeses] = useState('12')
	const [expandidos, setExpandidos] = useState<Record<number, boolean>>({})

	const fetchData = async (mesesParam: string) => {
		setLoading(true)
		setError(null)
		try {
			const resp = await fetchWithToken(`${BACKEND_URL}/informes/aumentos?meses=${mesesParam}`)
			const normalizado: AumentosResponse = {
				periodoDesde: resp?.periodoDesde ?? '--/----',
				periodoHasta: resp?.periodoHasta ?? '--/----',
				aumentosPorContrato: Array.isArray(resp?.aumentosPorContrato) ? resp.aumentosPorContrato : [],
			}
			setData(normalizado)
		} catch (e: any) {
			setError(e.message || 'Error al cargar informe')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData(meses)
	}, [meses])

	const formatoMoneda = (valor: number) => valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })

	// Evita desfase de mes por huso horario cuando vienen fechas 'YYYY-MM-DD'
	const formatoMesAnioLocal = (fecha: string) => {
		if (!fecha) return '--/----'
		// Intentar parseo seguro como fecha local
		const isoParts = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/)
		if (isoParts) {
			const [, y, m, d] = isoParts
			const dt = new Date(Number(y), Number(m) - 1, Number(d))
			return dt.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })
		}
		// Fallback: usar Date nativa pero fijando timezone UTC al formatear
		const d = new Date(fecha)
		return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', timeZone: 'UTC' as const })
	}

	const contratosOrdenados = useMemo(() => {
		if (!data) return []
		const items = Array.isArray(data.aumentosPorContrato) ? data.aumentosPorContrato : []
		// Ordenar por cantidad de aumentos descendente
		return [...items].sort((a, b) => b.aumentos.length - a.aumentos.length)
	}, [data])

	const totalAumentos = useMemo(() => {
		if (!data) return 0
		return data.aumentosPorContrato.reduce((sum, c) => sum + c.aumentos.length, 0)
	}, [data])

	const toggleExpanded = (contratoId: number) => {
		setExpandidos(prev => ({ ...prev, [contratoId]: !prev[contratoId] }))
	}

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
					<CalendarArrowUp className="h-12 w-12" />
					<div className="flex flex-col gap-0">
						<p className="text-2xl font-bold">Aumentos de alquileres</p>
						<p className="text-secondary">Historial de aumentos aplicados a los contratos de alquiler en los últimos meses.</p>
					</div>
				</div>

				{/* Control de filtro de meses */}
				<div className="mb-6 flex items-center gap-3">
					<label className="text-base font-medium">Últimos</label>
					<Select value={meses} onValueChange={setMeses}>
						<SelectTrigger className="w-fit font-bold items-center">
							<SelectValue placeholder="Meses" />
						</SelectTrigger>
						<SelectContent >
							<SelectItem value="3">3</SelectItem>
							<SelectItem value="6">6</SelectItem>
							<SelectItem value="12">12</SelectItem>
							<SelectItem value="24">24</SelectItem>
						</SelectContent>
					</Select>
					<label className="text-base font-medium">meses</label>
				</div>

				{/* Resumen */}
				<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
					<Card>
						<CardHeader className="pb-2 flex flex-col items-center">
							<CardTitle className="text-base font-light">Período desde</CardTitle>
							<CardDescription>
								<p className='text-xl  text-primary'>
									{loading ? <Skeleton className="h-5 w-24" /> : data?.periodoDesde || '--/----'}
								</p>
							</CardDescription>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2 flex flex-col items-center">
							<CardTitle className="text-base font-light">Período hasta</CardTitle>
							<CardDescription>
								<p className='text-xl text-primary'>
									{loading ? <Skeleton className="h-5 w-24" /> : data?.periodoHasta || '--/----'}
								</p>
							</CardDescription>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2 flex flex-col items-center">
							<CardTitle className="text-base font-light">Contratos con aumentos</CardTitle>
							<CardDescription>
								<p className='text-xl'>
									{loading ? <Skeleton className="h-5 w-24" /> : data ? `${data.aumentosPorContrato.length}` : '—'}
								</p>
							</CardDescription>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2 flex flex-col items-center">
							<CardTitle className="text-base font-light">Total aumentos aplicados</CardTitle>
							<CardDescription>
								<p className='text-xl'>
									{loading ? <Skeleton className="h-5 w-24" /> : `${totalAumentos}`}
								</p>
							</CardDescription>
						</CardHeader>
					</Card>
				</div>

				<div className="flex justify-between items-center mb-6">
					<p className="text-lg font-semibold">Listado de aumentos por contrato</p>
					{data && (
					  <ExportarAumentosPDF
					    periodoDesde={data.periodoDesde}
					    periodoHasta={data.periodoHasta}
					    contratos={contratosOrdenados}
					    disabled={loading || !!error}
					    totalAumentos={totalAumentos}
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

				{!loading && data && contratosOrdenados.length === 0 && (
					<p className="text-secondary">No hay aumentos registrados para el período seleccionado.</p>
				)}

				{/* Lista de contratos con aumentos */}
				<div className="grid grid-cols-1 gap-2">
					{contratosOrdenados.map(contrato => {
						const isExpanded = expandidos[contrato.contratoId]
						return (
							<Card key={contrato.contratoId} className="hover:shadow-sm transition-colors">
								<CardHeader className="cursor-pointer" onClick={() => toggleExpanded(contrato.contratoId)}>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<CardTitle className="text-base font-semibold flex flex-col sm:flex-row sm:items-center gap-1">
												<span className="text-foreground">{contrato.direccionInmueble}</span>
											</CardTitle>
											<CardDescription className="text-sm mt-1 flex flex-col sm:flex-row sm:gap-4">
												<span>Locador: {contrato.apellidoPropietario}, {contrato.nombrePropietario}</span>
												<span>Locatario: {contrato.apellidoInquilino}, {contrato.nombreInquilino}</span>
											</CardDescription>
										</div>
										<div className="flex items-center gap-3">
                                            <Badge variant="secondary" title='Cantidad de aumentos dentro del periodo seleccionado'>
                                                {contrato.aumentos.length} aumento{contrato.aumentos.length !== 1 ? 's' : ''}
                                            </Badge>
											<Button variant="ghost" size="sm">
												{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
											</Button>
										</div>
									</div>
								</CardHeader>

								{isExpanded && (
									<CardContent className="pt-0">
										<div className="space-y-3">
											<h4 className="text-sm font-semibold">Historial de porcentajes de aumentos:</h4>
											<div>
												<GraficoAumentosContrato contrato={contrato} />
											</div>
											<div className="grid gap-2">
												{contrato.aumentos.map(aumento => (
													<div key={aumento.aumentoId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/50 rounded-md">
														<div className="flex flex-col gap-1">
															<span className="text-sm font-medium">
																{formatoMesAnioLocal(aumento.fechaAumento)}
															</span>
															<span className="flex items-center text-base text-primary ">
																{formatoMoneda(aumento.montoAnterior)} <ArrowRight className="inline-block h-5 mx-4" /> {formatoMoneda(aumento.montoNuevo)}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<span className="text-sm font-semibold text-primary">
																+{aumento.porcentajeAumento.toFixed(2)}%
															</span>
														</div>
													</div>
												))}
											</div>
										</div>
									</CardContent>
								)}
							</Card>
						)
					})}
				</div>
			</main>
		</div>
	)
}
