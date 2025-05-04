"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Settings,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  Scale,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  // Salvar preferência do menu no localStorage
  useEffect(() => {
    const savedMenuState = localStorage.getItem("menuCollapsed")
    if (savedMenuState) {
      setMenuCollapsed(savedMenuState === "true")
    }
  }, [])

  const toggleMenu = () => {
    const newState = !menuCollapsed
    setMenuCollapsed(newState)
    localStorage.setItem("menuCollapsed", String(newState))
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
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
                <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/settings" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Tipos de Laudos</h4>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4 text-blue-500" />
                  Laudos Cautelares
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-purple-500" />
                  Laudos Contábeis
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Scale className="mr-2 h-4 w-4 text-amber-500" />
                  Laudos Extra Judiciais
                </Button>
              </div>
              <div className="pt-4">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar Desktop */}
        <aside
          className={cn(
            "hidden md:flex md:flex-col md:fixed md:inset-y-0 pt-16 transition-all duration-300 ease-in-out",
            menuCollapsed ? "md:w-16" : "md:w-64",
          )}
        >
          <nav className="flex-1 flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 space-y-6 relative">
            {/* Botão para colapsar o menu */}
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-3 top-4 h-6 w-6 rounded-full border border-border bg-background shadow-md"
              onClick={toggleMenu}
            >
              {menuCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            <div className="space-y-2">
              <h4 className={cn("text-sm font-medium text-muted-foreground", menuCollapsed && "sr-only")}>
                Menu Principal
              </h4>
              <div className="space-y-1">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("w-full", menuCollapsed ? "justify-center px-0" : "justify-start")}
                  >
                    <LayoutDashboard className={cn("h-4 w-4", !menuCollapsed && "mr-2")} />
                    {!menuCollapsed && <span>Dashboard</span>}
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("w-full", menuCollapsed ? "justify-center px-0" : "justify-start")}
                  >
                    <Settings className={cn("h-4 w-4", !menuCollapsed && "mr-2")} />
                    {!menuCollapsed && <span>Configurações</span>}
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("w-full", menuCollapsed ? "justify-center px-0" : "justify-start")}
                  >
                    <User className={cn("h-4 w-4", !menuCollapsed && "mr-2")} />
                    {!menuCollapsed && <span>Perfil</span>}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className={cn("text-sm font-medium text-muted-foreground", menuCollapsed && "sr-only")}>
                Tipos de Laudos
              </h4>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("w-full", menuCollapsed ? "justify-center px-0" : "justify-start")}
                >
                  <FileText className={cn("h-4 w-4 text-blue-500", !menuCollapsed && "mr-2")} />
                  {!menuCollapsed && <span>Laudos Cautelares</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("w-full", menuCollapsed ? "justify-center px-0" : "justify-start")}
                >
                  <FileSpreadsheet className={cn("h-4 w-4 text-purple-500", !menuCollapsed && "mr-2")} />
                  {!menuCollapsed && <span>Laudos Contábeis</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("w-full", menuCollapsed ? "justify-center px-0" : "justify-start")}
                >
                  <Scale className={cn("h-4 w-4 text-amber-500", !menuCollapsed && "mr-2")} />
                  {!menuCollapsed && <span>Laudos Extra Judiciais</span>}
                </Button>
              </div>
            </div>
            <div className="mt-auto">
              <Button
                variant="ghost"
                size="sm"
                className={cn("w-full", menuCollapsed ? "justify-center px-0" : "justify-start")}
                onClick={handleLogout}
              >
                <LogOut className={cn("h-4 w-4", !menuCollapsed && "mr-2")} />
                {!menuCollapsed && <span>Sair</span>}
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            menuCollapsed ? "md:pl-16" : "md:pl-64",
            className,
          )}
          {...props}
        >
          <div className="container mx-auto p-4 md:p-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
