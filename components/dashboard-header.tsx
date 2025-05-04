import type React from "react"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
  className?: string // Adicionado prop para classe
}

export function DashboardHeader({ heading, text, children, className }: DashboardHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 mb-8 ${className || ""}`}>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  )
}
