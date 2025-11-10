"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ReactNode } from "react"

type Props = {
  href: string
  title: string
  description: string
  icon: ReactNode
  disabled?: boolean
}

export default function CardPagesSecundarias({ href, title, description, icon, disabled = false }: Props) {
  const content = (
    <Card className={`h-full transition-all duration-200 ${disabled ? '' : 'hover:shadow-lg'} border border-border/60 hover:border-primary/40`}>
      <CardHeader className="text-center pb-3">
        <div className={`mx-auto mb-3 p-3 rounded-full w-fit bg-muted/40 ${disabled ? '' : 'group-hover:bg-muted/60'} transition-colors`}>{icon}</div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm leading-snug">{description}</CardDescription>
      </CardHeader>
    </Card>
  )

  if (disabled) return <div className="group" aria-disabled="true">{content}</div>
  return (
    <Link href={href} className="group">
      {content}
    </Link>
  )
}
