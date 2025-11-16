"use client";

import { FileText, FileUp, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface PasoCargaPdfProps {
	pdfFile: File | null;
	setPdfFile: (file: File | null) => void;
}

export default function PasoCargaPdf({ pdfFile, setPdfFile }: PasoCargaPdfProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] || null;
		if (f && f.type !== "application/pdf") {
			// limpiar si no es PDF
			alert("Por favor, seleccioná un archivo PDF válido.");
			setPdfFile(null);
			if (inputRef.current) inputRef.current.value = "";
			return;
		}
		setPdfFile(f);
	};

	const handleRemoveFile = () => {
		setPdfFile(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	return (
		<>
			<div className="flex items-center gap-2 mb-2">
				<FileText className="h-5 w-5" />
				<span className="font-semibold">Archivo del contrato (PDF)</span>
			</div>
			<p className="text-muted-foreground mb-2">
				Opcional, puedes cargarlo luego.
			</p>

			<div className="mt-4 space-y-4">
				<div className="grid gap-3 bg-muted/40 rounded-xl border border-border p-6">
					{!pdfFile ? (
						<label 
							htmlFor="pdf-upload" 
							className="flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/60 transition-colors rounded-lg p-8 border-2 border-dashed border-border"
						>
							<FileUp className="h-12 w-12 text-muted-foreground" />
							<div className="text-center">
								<p className="text-sm font-medium">Hacé clic para seleccionar un archivo</p>
								<p className="text-xs text-muted-foreground mt-1">o arrastrá y soltá el PDF aquí</p>
							</div>
							<input
								id="pdf-upload"
								ref={inputRef}
								type="file"
								accept="application/pdf"
								onChange={handleFileChange}
								className="hidden"
							/>
						</label>
					) : (
						<div className="flex items-center justify-between gap-4 p-4 bg-background rounded-lg border border-border">
							<div className="flex items-center gap-3">
								<FileText className="h-8 w-8 text-primary" />
								<div className="">
									<p className="font-medium">{pdfFile.name.slice(0, 50)}{pdfFile.name.length > 50 ? "..." : ""}</p>
									<p className="text-xs text-muted-foreground">
										{(pdfFile.size / 1024).toFixed(2)} KB
									</p>
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={handleRemoveFile}
								className="hover:bg-destructive/10 hover:text-destructive"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
				
				{pdfFile && (
					<p className="text-xs text-muted-foreground text-center">
						Archivo listo para cargar. Podés cambiarlo haciendo clic en el botón ✕
					</p>
				)}
			</div>
		</>
	);
}

