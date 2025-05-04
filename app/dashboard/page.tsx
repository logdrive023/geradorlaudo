"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Search, Copy, MoreHorizontal, Filter, Calendar, Clock, CheckCircle } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { NewReportDialog } from "@/components/new-report-dialog"

interface Report {
  id: string
  title: string
  date: string
  status?: string
  reportData?: any
  photos?: any[]
  type: string
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [reports, setReports] = useState<Report[]>([])
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [showNewReportDialog, setShowNewReportDialog] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Verificar se há um tipo de laudo na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const typeParam = params.get("type")
    if (typeParam && ["cautelar", "contabil", "extrajudicial", "todos"].includes(typeParam)) {
      setActiveTab(typeParam)
    }
  }, [])

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // Carregar relatórios do localStorage
    const storedReports = localStorage.getItem("reports")
    if (storedReports) {
      try {
        const parsedReports = JSON.parse(storedReports)
        setReports(parsedReports)
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error)
      }
    }
  }, [])

  // Se estiver carregando ou não tiver usuário, não renderizar o conteúdo
  if (isLoading || !user) {
    return null
  }

  const handleDeleteReport = (id: string) => {
    const updatedReports = reports.filter((report) => report.id !== id)
    setReports(updatedReports)
    localStorage.setItem("reports", JSON.stringify(updatedReports))
    setMessage("Laudo excluído com sucesso!")

    // Limpar mensagem após 3 segundos
    setTimeout(() => {
      setMessage("")
    }, 3000)
  }

  const handleDuplicateReport = (report: Report) => {
    const newReport = {
      ...report,
      id: Date.now().toString(),
      title: `${report.title} (Cópia)`,
      date: new Date().toLocaleDateString("pt-BR"),
    }

    const updatedReports = [...reports, newReport]
    setReports(updatedReports)
    localStorage.setItem("reports", JSON.stringify(updatedReports))
    setMessage("Laudo duplicado com sucesso!")

    // Limpar mensagem após 3 segundos
    setTimeout(() => {
      setMessage("")
    }, 3000)
  }

  // Se não houver relatórios, mostrar dados de exemplo
  const defaultReports: Report[] =
    reports.length > 0
      ? reports
      : [
          {
            id: "1",
            title: "Vistoria: Rua Benedito dos Santos, 44",
            date: "05/07/2024",
            status: "Concluído",
            type: "cautelar",
          },
          {
            id: "2",
            title: "Vistoria: Av. Paulista, 1000",
            date: "01/07/2024",
            status: "Rascunho",
            type: "cautelar",
          },
          {
            id: "3",
            title: "Vistoria: Rua Augusta, 500",
            date: "28/06/2024",
            status: "Concluído",
            type: "cautelar",
          },
          {
            id: "4",
            title: "Análise Contábil: Empresa XYZ Ltda",
            date: "15/06/2024",
            status: "Concluído",
            type: "contabil",
          },
          {
            id: "5",
            title: "Análise Contábil: Empresa ABC S.A.",
            date: "10/06/2024",
            status: "Rascunho",
            type: "contabil",
          },
          {
            id: "6",
            title: "Laudo Extra Judicial: Processo nº 1234/2024",
            date: "05/06/2024",
            status: "Concluído",
            type: "extrajudicial",
          },
          {
            id: "7",
            title: "Laudo Extra Judicial: Caso Imobiliário",
            date: "01/06/2024",
            status: "Rascunho",
            type: "extrajudicial",
          },
        ]

  // Filtrar relatórios por tipo (aba) e status
  const filteredReports = defaultReports
    .filter((report) => (activeTab === "todos" ? true : report.type === activeTab))
    .filter((report) => (statusFilter === "todos" ? true : report.status?.toLowerCase() === statusFilter.toLowerCase()))
    .filter((report) => report.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // Função para obter o título da aba atual
  const getActiveTabTitle = () => {
    switch (activeTab) {
      case "cautelar":
        return "Laudos Cautelares de Vizinhança"
      case "contabil":
        return "Laudos Contábeis"
      case "extrajudicial":
        return "Laudos Extra Judiciais"
      default:
        return "Todos os Laudos"
    }
  }

  // Função para obter a descrição da aba atual
  const getActiveTabDescription = () => {
    switch (activeTab) {
      case "cautelar":
        return "Vistorias e análises de imóveis vizinhos a obras"
      case "contabil":
        return "Análises contábeis e financeiras"
      case "extrajudicial":
        return "Laudos para processos extra judiciais"
      default:
        return "Crie, visualize e gerencie seus laudos técnicos"
    }
  }

  // Função para obter a classe do badge com base no tipo de laudo
  const getReportTypeBadgeClass = (type: string) => {
    switch (type) {
      case "cautelar":
        return "badge-cautelar"
      case "contabil":
        return "badge-contabil"
      case "extrajudicial":
        return "badge-extrajudicial"
      default:
        return ""
    }
  }

  // Função para obter o ícone do tipo de laudo
  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "cautelar":
        return <FileText className="h-3.5 w-3.5 text-blue-400" />
      case "contabil":
        return <FileText className="h-3.5 w-3.5 text-purple-400" />
      case "extrajudicial":
        return <FileText className="h-3.5 w-3.5 text-amber-400" />
      default:
        return <FileText className="h-3.5 w-3.5" />
    }
  }

  // Função para obter a classe do botão com base no tipo de laudo
  const getButtonClass = (type: string) => {
    switch (type) {
      case "cautelar":
        return "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
      case "contabil":
        return "text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50"
      case "extrajudicial":
        return "text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50"
      default:
        return "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950/50"
    }
  }

  // Animação para os cards
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={<span className="logo-laudotech">{getActiveTabTitle()}</span>}
        text={getActiveTabDescription()}
        className="dashboard-header"
      >
        <Button
          className="gradient-blue hover:opacity-90 transition-opacity"
          onClick={() => setShowNewReportDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Laudo
        </Button>
      </DashboardHeader>

      {message && (
        <Alert className="glass border-green-500/30 text-green-400">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Abas com visual melhorado para modo claro */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        {/* Corrigir as classes das abas no modo escuro */}
        <TabsList className="grid w-full grid-cols-4 p-1 bg-gray-100 dark:glass tabs-list dark:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg">
          <TabsTrigger
            value="todos"
            className="tab-trigger rounded-md text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:shadow-md data-[state=active]:text-white dark:text-gray-300 dark:data-[state=active]:bg-blue-600"
          >
            Todos
          </TabsTrigger>
          <TabsTrigger
            value="cautelar"
            className="tab-trigger rounded-md text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:shadow-md data-[state=active]:text-white dark:text-gray-300 dark:data-[state=active]:bg-blue-600"
          >
            Cautelar de Vizinhança
          </TabsTrigger>
          <TabsTrigger
            value="contabil"
            className="tab-trigger rounded-md text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:shadow-md data-[state=active]:text-white dark:text-gray-300 dark:data-[state=active]:bg-purple-600"
          >
            Contábil
          </TabsTrigger>
          <TabsTrigger
            value="extrajudicial"
            className="tab-trigger rounded-md text-gray-700 data-[state=active]:bg-amber-600 data-[state=active]:shadow-md data-[state=active]:text-white dark:text-gray-300 dark:data-[state=active]:bg-amber-600"
          >
            Extra Judicial
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Barra de pesquisa com visual melhorado para modo claro */}
      <div className="grid gap-4 mb-6">
        {/* Corrigir a barra de pesquisa no modo escuro */}
        <div className="flex items-center gap-4 flex-wrap bg-gray-100 dark:bg-background/30 p-4 rounded-lg dark:backdrop-blur-md border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white dark:bg-background/50 rounded-md px-3 py-1 border border-gray-200 dark:border-white/10">
            <Search className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            <Input
              placeholder="Buscar laudos..."
              className="max-w-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-background/50 rounded-md px-3 py-1 border border-gray-200 dark:border-white/10">
            <Filter className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-background/80 dark:backdrop-blur-md border border-gray-200 dark:border-white/10">
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="concluído">Concluído</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        /* Corrigir o card vazio no modo escuro */
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-background/30 rounded-lg border border-gray-200 dark:border-white/10">
          <FileText className="h-16 w-16 text-gray-400 dark:text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhum laudo encontrado</h3>
          <p className="text-gray-500 dark:text-muted-foreground mb-6 max-w-md">
            Não encontramos laudos que correspondam aos seus critérios de busca.
          </p>
          <Button
            className="gradient-blue hover:opacity-90 transition-opacity"
            onClick={() => setShowNewReportDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar novo laudo
          </Button>
        </div>
      ) : (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredReports.map((report) => (
            <motion.div key={report.id} variants={item}>
              {/* Cards com visual melhorado para modo claro */}
              {/* Corrigir os cards no modo escuro */}
              <Card className="bg-white dark:bg-background/30 overflow-hidden border border-gray-200 dark:border-white/10 dark:backdrop-blur-md">
                <CardHeader className="pb-2 relative">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base card-title">{report.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Opções</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white dark:glass dark:backdrop-blur-md border border-gray-200 dark:border-white/10"
                      >
                        <DropdownMenuItem>
                          <Link href={`/editor/${report.id}`} className="flex w-full">
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateReport(report)}>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteReport(report.id)}>
                          <span className="text-red-500 dark:text-red-400">Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{report.date}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`ml-2 ${getReportTypeBadgeClass(report.type)} rounded-full px-2.5 py-0.5 text-xs font-medium`}
                    >
                      <div className="flex items-center gap-1">
                        {getReportTypeIcon(report.type)}
                        <span>
                          {report.type === "cautelar"
                            ? "Cautelar"
                            : report.type === "contabil"
                              ? "Contábil"
                              : "Extra Judicial"}
                        </span>
                      </div>
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`status-dot ${report.status === "Concluído" ? "completed" : "draft"}`}></div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-muted-foreground">
                      <Clock className="h-3 w-3 text-gray-500 dark:text-muted-foreground" />
                      <span className="text-gray-500 dark:text-muted-foreground">{report.status || "Concluído"}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <div className="flex gap-2 w-full">
                    <Link href={`/editor/${report.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className={`w-full ${getButtonClass(report.type)} btn-open`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Abrir
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateReport(report)}
                      className="text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground btn-duplicate"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal para criar novo laudo */}
      <NewReportDialog open={showNewReportDialog} onOpenChange={setShowNewReportDialog} />
    </DashboardShell>
  )
}
