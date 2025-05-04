"use client"

import type React from "react"
import { Suspense } from "react"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"

// Componente separado para usar useSearchParams
import { DashboardNavigation } from "./dashboard-navigation"

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const navigateToType = (type: string) => {
    router.push(`/dashboard?type=${type}`)
    setSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-blue-500">
            <FileText className="h-5 w-5" />
            LaudoTech
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                Configurações
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </nav>
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{user?.name || "Engenheiro Demo"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <nav className="fixed top-16 left-0 bottom-0 w-3/4 border-r bg-background p-6 shadow-lg">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Navegação</h4>
                <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/settings" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Configurações
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Tipos de Laudos</h4>
                <Suspense fallback={null}>
                  <DashboardNavigation navigateToType={navigateToType} />
                </Suspense>
              </div>
              <div className="pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10"
                  onClick={() => {
                    logout()
                    router.push("/login")
                    setSidebarOpen(false)
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={cn("flex-1", className)} {...props}>
        <div className="container mx-auto p-4 md:p-6 space-y-6">{children}</div>
      </main>
    </div>
  )
}
