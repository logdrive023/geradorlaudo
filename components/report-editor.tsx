"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ReportPreview } from "@/components/report-preview"
import { PhotoUploader } from "@/components/photo-uploader"
import { PhotoGrid } from "@/components/photo-grid"
import { LocationImageUploader } from "@/components/location-image-uploader"
import { LogoUploader } from "@/components/logo-uploader"
import { CautelarReportEditor } from "@/components/cautelar-report-editor"
import { ContabilReportEditor } from "@/components/contabil-report-editor"
import { ExtraJudicialReportEditor } from "@/components/extrajudicial-report-editor"
import { ArrowLeft, Save, FileText, Camera, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { WordPreview } from "@/components/word-preview"

interface ReportEditorProps {
  id?: string
}

export function ReportEditor({ id }: ReportEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("editor")
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
    date: new Date().toLocaleDateString("pt-BR"),
    technicalInfo: "",
    engineer: "",
    registration: "",
    locationImage: "",
    logoImage: "", // Novo campo para o logo personalizado
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

  // Carregar dados do relatório se estiver editando
  useEffect(() => {
    if (id && id !== "new") {
      const storedReports = localStorage.getItem("reports")
      if (storedReports) {
        try {
          const reports = JSON.parse(storedReports)
          const report = reports.find((r: any) => r.id === id)
          if (report) {
            setReportType(report.type || "cautelar")
            setReportData(report.reportData || reportData)
            setPhotos(report.photos || [])
          }
        } catch (error) {
          console.error("Erro ao carregar relatório:", error)
        }
      }
    }
  }, [id])

  const handleSave = () => {
    const newReport = {
      id: id === "new" ? Date.now().toString() : id,
      title: reportData.title || "Novo Laudo",
      date: reportData.date || new Date().toLocaleDateString("pt-BR"),
      status: "Concluído",
      type: reportType,
      reportData,
      photos,
    }

    const storedReports = localStorage.getItem("reports")
    let reports = []

    if (storedReports) {
      try {
        reports = JSON.parse(storedReports)
        // Se estiver editando, atualizar o relatório existente
        if (id && id !== "new") {
          reports = reports.map((report: any) => (report.id === id ? newReport : report))
        } else {
          // Se for novo, adicionar à lista
          reports.push(newReport)
        }
      } catch (error) {
        console.error("Erro ao processar relatórios:", error)
        reports = [newReport]
      }
    } else {
      reports = [newReport]
    }

    localStorage.setItem("reports", JSON.stringify(reports))
    toast({
      title: "Laudo salvo com sucesso",
      description: "Seu laudo foi salvo e está disponível no painel.",
    })

    // Redirecionar para o dashboard
    router.push("/dashboard")
  }

  const handlePhotoUpload = (photoUrl: string) => {
    const newPhoto = {
      id: Date.now().toString(),
      url: photoUrl,
      caption: "",
    }
    setPhotos([...photos, newPhoto])
  }

  const handlePhotoDelete = (photoId: string) => {
    setPhotos(photos.filter((photo) => photo.id !== photoId))
  }

  const handleCaptionChange = (photoId: string, caption: string) => {
    setPhotos(photos.map((photo) => (photo.id === photoId ? { ...photo, caption } : photo)))
  }

  const handleLocationImageUpload = (imageUrl: string) => {
    setReportData({ ...reportData, locationImage: imageUrl })
  }

  const handleLogoUpload = (logoUrl: string) => {
    setReportData({ ...reportData, logoImage: logoUrl })
  }

  const handleInputChange = (field: string, value: string) => {
    setReportData({ ...reportData, [field]: value })
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={id === "new" ? "Criar Novo Laudo" : "Editar Laudo"}
        text="Preencha os dados do laudo e visualize a pré-visualização"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </DashboardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center">
            <Camera className="mr-2 h-4 w-4" />
            Fotos
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            Pré-visualização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Laudo</CardTitle>
              <CardDescription>Selecione o tipo de laudo que deseja criar</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={reportType}
                onValueChange={(value) => setReportType(value)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cautelar" id="cautelar" />
                  <Label htmlFor="cautelar">Laudo Cautelar de Vizinhança</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contabil" id="contabil" />
                  <Label htmlFor="contabil">Laudo Contábil</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="extrajudicial" id="extrajudicial" />
                  <Label htmlFor="extrajudicial">Laudo Extra Judicial</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Preencha as informações básicas do laudo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Laudo</Label>
                <Input
                  id="title"
                  placeholder="Ex: Vistoria: Rua Exemplo, 123"
                  value={reportData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={
                    reportData.date
                      ? new Date(reportData.date.split("/").reverse().join("-")).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const date = new Date(e.target.value)
                    const formattedDate = date.toLocaleDateString("pt-BR")
                    handleInputChange("date", formattedDate)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineer">Engenheiro Responsável</Label>
                <Input
                  id="engineer"
                  placeholder="Nome do engenheiro responsável"
                  value={reportData.engineer}
                  onChange={(e) => handleInputChange("engineer", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration">Registro Profissional</Label>
                <Input
                  id="registration"
                  placeholder="CREA/CAU"
                  value={reportData.registration}
                  onChange={(e) => handleInputChange("registration", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="technicalInfo">Informações Técnicas e Conclusão</Label>
                <Textarea
                  id="technicalInfo"
                  placeholder="Descreva as informações técnicas e conclusão do laudo"
                  className="min-h-[150px]"
                  value={reportData.technicalInfo}
                  onChange={(e) => handleInputChange("technicalInfo", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Imagem de Localização</Label>
                  <LocationImageUploader
                    currentImage={reportData.locationImage}
                    onImageUpload={handleLocationImageUpload}
                    className="h-[200px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo da Empresa</Label>
                  <LogoUploader
                    currentLogo={reportData.logoImage}
                    onLogoUpload={handleLogoUpload}
                    className="h-[200px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {reportType === "cautelar" && (
            <CautelarReportEditor reportData={reportData} onDataChange={handleInputChange} />
          )}

          {reportType === "contabil" && (
            <ContabilReportEditor reportData={reportData} onDataChange={handleInputChange} />
          )}

          {reportType === "extrajudicial" && (
            <ExtraJudicialReportEditor reportData={reportData} onDataChange={handleInputChange} />
          )}
        </TabsContent>

        <TabsContent value="photos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fotos do Laudo</CardTitle>
              <CardDescription>Adicione fotos ao laudo e inclua legendas descritivas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PhotoUploader onPhotoUpload={handlePhotoUpload} />

              {photos.length > 0 && (
                <PhotoGrid photos={photos} onDelete={handlePhotoDelete} onCaptionChange={handleCaptionChange} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 mt-4">
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf">Visualização PDF</TabsTrigger>
              <TabsTrigger value="word">Visualização Word</TabsTrigger>
            </TabsList>
            <TabsContent value="pdf" className="mt-4">
              <ReportPreview reportData={reportData} photos={photos} reportType={reportType} />
            </TabsContent>
            <TabsContent value="word" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visualização do Documento Word</CardTitle>
                  <CardDescription>Visualize como ficará o documento Word</CardDescription>
                </CardHeader>
                <CardContent>
                  <WordPreview reportData={reportData} photos={photos} reportType={reportType} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
