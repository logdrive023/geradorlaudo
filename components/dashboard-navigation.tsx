"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, Scale } from "lucide-react"

interface DashboardNavigationProps {
  navigateToType: (type: string) => void
}

export function DashboardNavigation({ navigateToType }: DashboardNavigationProps) {
  const searchParams = useSearchParams()
  const currentType = searchParams.get("type")

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`w-full justify-start ${currentType === "cautelar" ? "bg-muted" : ""}`}
        onClick={() => navigateToType("cautelar")}
      >
        <FileText className="mr-2 h-4 w-4 text-blue-500" />
        Laudos Cautelares
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`w-full justify-start ${currentType === "contabil" ? "bg-muted" : ""}`}
        onClick={() => navigateToType("contabil")}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4 text-purple-500" />
        Laudos Contábeis
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`w-full justify-start ${currentType === "extrajudicial" ? "bg-muted" : ""}`}
        onClick={() => navigateToType("extrajudicial")}
      >
        <Scale className="mr-2 h-4 w-4 text-amber-500" />
        Laudos Extra Judiciais
      </Button>
    </>
  )
}
