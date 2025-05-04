"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ReportEditor } from "@/components/report-editor"
import { PhotoUploader } from "@/components/photo-uploader"
import { PhotoGrid } from "@/components/photo-grid"
import { ReportPreview } from "@/components/report-preview"
import { WordPreview } from "@/components/word-preview"
import { Save, FileDown, ArrowLeft, Camera, Edit, Eye, FileIcon } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ExportDialog } from "@/components/export-dialog"
import { ContabilReportEditor } from "@/components/contabil-report-editor"
import { ExtraJudicialReportEditor } from "@/components/extrajudicial-report-editor"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export default function EditorPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("editor")
  const [reportTitle, setReportTitle] = useState("")
  const [reportType, setReportType] = useState("cautelar")
  const [photos, setPhotos] = useState<{ id: string; url: string; caption: string }[]>([])
  const [reportData, setReportData] = useState({
    title: "",
    address: "",
    occupant: "",
    inspector: "",
    usage: "",
    age: "",
    buildingType: "",
    conservationState: "",
    constructionStandard: "",
    observations: "",
    date: "",
    technicalInfo: "",
    engineer: "",
    registration: "",
    // Campos para laudo contábil
    company: "",
    cnpj: "",
    period: "",
    accountant: "",
    crc: "",
    financialSummary: "",
    // Campos para laudo extra judicial
    processNumber: "",
    court: "",
    plaintiff: "",
    defendant: "",
    object: "",
  })

  const [showExportDialog, setShowExportDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Carregar dados do relatório se não for novo
  useEffect(() => {
    if (params.id !== "new") {
      const storedReports = localStorage.getItem("reports")
      if (storedReports) {
        try {
          const reports = JSON.parse(storedReports)
          const report = reports.find((r: any) => r.id === params.id)
          if (report) {
            setReportData(report.reportData || reportData)
            setReportTitle(report.title || reportTitle)
            setReportType(report.type || "cautelar")
            setPhotos(report.photos || [])
          }
        } catch (error) {
          console.error("Erro ao carregar relatório:", error)
        }
      }
    }
  }, [params.id])

  // Se estiver carregando ou não tiver usuário, não renderizar o conteúdo
  if (isLoading || !user) {
    return null
  }

  const isNewReport = params.id === "new"
  const reportId = isNewReport ? "novo" : params.id

  const handleSave = () => {
    // Save report logic would go here
    console.log("Saving report...")

    // Salvar no localStorage para demonstração
    const report = {
      id: reportId === "novo" ? Date.now().toString() : reportId,
      title: reportData.title,
      date: reportData.date || new Date().toLocaleDateString("pt-BR"),
      reportData,
      photos,
      type: reportType,
      status: "Rascunho",
    }

    // Obter relatórios existentes ou inicializar array vazio
    const existingReports = JSON.parse(localStorage.getItem("reports") || "[]")

    // Verificar se é um novo relatório ou atualização
    if (reportId === "novo") {
      existingReports.push(report)
    } else {
      const index = existingReports.findIndex((r: any) => r.id === reportId)
      if (index !== -1) {
        existingReports[index] = report
      } else {
        existingReports.push(report)
      }
    }

    // Salvar de volta no localStorage
    localStorage.setItem("reports", JSON.stringify(existingReports))

    // Redirecionar para o dashboard
    router.push("/dashboard")
  }

  const handlePhotoUpload = (newPhotos: { id: string; url: string; caption: string }[]) => {
    setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos])
  }

  const handleUpdateCaption = (id: string, caption: string) => {
    setPhotos((prevPhotos) => prevPhotos.map((photo) => (photo.id === id ? { ...photo, caption } : photo)))
  }

  const handleReorderPhotos = (reorderedPhotos: { id: string; url: string; caption: string }[]) => {
    setPhotos(reorderedPhotos)
  }

  const handleReportDataChange = (newData: typeof reportData) => {
    setReportData(newData)
    setReportTitle(newData.title)
  }

  // Determinar qual editor mostrar com base no tipo de laudo
  const renderEditor = () => {
    switch (reportType) {
      case "contabil":
        return <ContabilReportEditor reportData={reportData} onReportDataChange={handleReportDataChange} />
      case "extrajudicial":
        return <ExtraJudicialReportEditor reportData={reportData} onReportDataChange={handleReportDataChange} />
      default:
        return <ReportEditor reportData={reportData} onReportDataChange={handleReportDataChange} />
    }
  }

  // Modificar a função getReportTypeLabel para garantir que ela use o tipo correto do laudo
  const getReportTypeLabel = () => {
    switch (reportType) {
      case "cautelar":
        return "Cautelar de Vizinhança"
      case "contabil":
        return "Contábil"
      case "extrajudicial":
        return "Extra Judicial"
      default:
        return "Técnico"
    }
  }

  // Função para obter a classe do badge com base no tipo de laudo
  const getReportTypeBadgeClass = () => {
    switch (reportType) {
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

  // Função para obter a classe do botão com base no tipo de laudo
  const getButtonGradient = () => {
    switch (reportType) {
      case "cautelar":
        return "gradient-blue"
      case "contabil":
        return "gradient-purple"
      case "extrajudicial":
        return "gradient-amber"
      default:
        return "gradient-blue"
    }
  }

  // Função para obter o ícone do tipo de laudo
  const getReportTypeIcon = () => {
    switch (reportType) {
      case "cautelar":
        return <FileIcon className="h-4 w-4 text-blue-400" />
      case "contabil":
        return <FileIcon className="h-4 w-4 text-purple-400" />
      case "extrajudicial":
        return <FileIcon className="h-4 w-4 text-amber-400" />
      default:
        return <FileIcon className="h-4 w-4" />
    }
  }

  // Animação para entrada da página
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
  }

  // Modificar o JSX para exibir o badge com o tipo correto
  return (
    <DashboardShell>
      <motion.div initial="initial" animate="animate" variants={pageVariants}>
        <DashboardHeader heading={reportTitle || "Novo Laudo"} text={`ID: ${reportId}`}>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`mr-2 ${getReportTypeBadgeClass()} rounded-full px-3 py-1`}>
              <div className="flex items-center gap-1">
                {getReportTypeIcon()}
                <span>Laudo {getReportTypeLabel()}</span>
              </div>
            </Badge>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-border/50 hover:bg-secondary/80">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Button onClick={handleSave} size="sm" className={getButtonGradient()}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
            <Button
              onClick={() => setShowExportDialog(true)}
              variant="outline"
              size="sm"
              className="border-border/50 hover:bg-secondary/80"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </DashboardHeader>

        {/* Melhorar as abas para um visual mais premium */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 p-1 glass tabs-list backdrop-blur-md border border-white/10">
            <TabsTrigger
              value="editor"
              className="tab-trigger rounded-md data-[state=active]:bg-secondary data-[state=active]:shadow-md data-[state=active]:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editor de Texto
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              className="tab-trigger rounded-md data-[state=active]:bg-secondary data-[state=active]:shadow-md data-[state=active]:text-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              Fotos ({photos.length})
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="tab-trigger rounded-md data-[state=active]:bg-secondary data-[state=active]:shadow-md data-[state=active]:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Pré-visualização
            </TabsTrigger>
            <TabsTrigger
              value="word"
              className="tab-trigger rounded-md data-[state=active]:bg-secondary data-[state=active]:shadow-md data-[state=active]:text-white"
            >
              <FileIcon className="h-4 w-4 mr-2" />
              Visualização Word
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-6">
            <div className="glass p-6 rounded-lg">{renderEditor()}</div>
          </TabsContent>
          <TabsContent value="photos" className="mt-6">
            <div className="grid gap-6">
              <div className="glass p-6 rounded-lg">
                <PhotoUploader onUpload={handlePhotoUpload} />
              </div>
              <div className="glass p-6 rounded-lg">
                <PhotoGrid photos={photos} onUpdateCaption={handleUpdateCaption} onReorder={handleReorderPhotos} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="mt-6">
            <div className="glass p-6 rounded-lg">
              <ReportPreview reportData={reportData} photos={photos} reportType={reportType} />
            </div>
          </TabsContent>
          <TabsContent value="word" className="mt-6">
            <div className="glass p-6 rounded-lg">
              <WordPreview reportData={reportData} photos={photos} reportType={reportType} />
            </div>
          </TabsContent>
        </Tabs>

        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          reportData={reportData}
          photos={photos}
          reportType={reportType}
        />
      </motion.div>
    </DashboardShell>
  )
}
