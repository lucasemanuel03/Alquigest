"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ReactNode } from "react"

type Props = {
  href: string
  title: string
  description: string
  icon: ReactNode
  borderClass?: string
  hoverBorderClass?: string
  iconWrapperClass?: string
  disabled?: boolean
}

export default function CardPages({
  href,
  title,
  description,
  icon,
  borderClass = "border-2 border-secondary/20",
  hoverBorderClass = "hover:border-secondary",
  iconWrapperClass = "bg-secondary/10 group-hover:bg-secondary/20",
  disabled = false,
}: Props) {
  const content = (
    <Card className={`h-full transition-all duration-200 ${disabled ? '' : 'hover:shadow-lg'} ${borderClass} ${hoverBorderClass}`}>
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto mb-4 p-4 rounded-full w-fit transition-colors ${iconWrapperClass}`}>
          {icon}
        </div>
        <CardTitle className="text-2xl md:text-2xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  )

  if (disabled) {
    return (
      <div className="group lg:col-span-2" aria-disabled="true" role="group">
        {content}
      </div>
    )
  }

  return (
    <Link href={href} className="group lg:col-span-2">
      {content}
    </Link>
  )
}
