"use client"

import React from "react"
import { Loader2 } from "lucide-react"

interface LoaderProps {
  text?: string,
  tituloHeader?: string,
}

export default function LoadingSmall({ text = "Cargando...", }: LoaderProps) {
  return (
    <div className="flex flex-col">

      {/* Contenido centrado */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-25 sm:pt-28">
        {/* Spinner */}
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />

        {/* Texto */}
        <p className="text-lg text-muted-foreground font-medium">{text}</p>
      </div>
    </div>
  )
}
