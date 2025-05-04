"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ReportPreview } from "@/components/report-preview"
import { LocationImageUploader } from "@/components/location-image-uploader"
import { LogoUploader } from "@/components/logo-uploader"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface ExtrajudicialReportEditorProps {
  initialData?: any
  reportId?: string
  onReportDataChange?: (data: any) => void
}

export function ExtraJudicialReportEditor({
  initialData,
  reportId,
  onReportDataChange,
}: ExtrajudicialReportEditorProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [reportData, setReportData] = useState(
    initialData || {
      reference: "",
      process: "",
      parties: "",
      object: "",
      objective: "",
      methodology: "",
      technical: "",
      documentation: "",
      findings: "",
      conclusion: "",
      expert: "",
      registration: "",
      locationImage: "",
      logoImage: "",
    },
  )
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updatedData = {
      ...reportData,
      [name]: value,
    }
    setReportData(updatedData)

    // Notificar o componente pai sobre a mudança, se a função for fornecida
    if (onReportDataChange) {
      onReportDataChange(updatedData)
    }
  }

  const handleLocationImageUpload = (imageUrl: string) => {
    const updatedData = {
      ...reportData,
      locationImage: imageUrl,
    }
    setReportData(updatedData)

    // Notificar o componente pai sobre a mudança, se a função for fornecida
    if (onReportDataChange) {
      onReportDataChange(updatedData)
    }
  }

  const handleLogoUpload = (logoUrl: string) => {
    const updatedData = {
      ...reportData,
      logoImage: logoUrl,
    }
    setReportData(updatedData)

    // Notificar o componente pai sobre a mudança, se a função for fornecida
    if (onReportDataChange) {
      onReportDataChange(updatedData)
    }
  }

  const handleSave = () => {
    // Obter relatórios existentes do localStorage
    const existingReports = localStorage.getItem("reports")
    let reports = existingReports ? JSON.parse(existingReports) : []

    // Se estiver editando um relatório existente
    if (reportId) {
      reports = reports.map((report: any) => {
        if (report.id === reportId) {
          return {
            ...report,
            reportData,
          }
        }
        return report
      })
    } else {
      // Criar um novo relatório
      const newReport = {
        id: Date.now().toString(),
        title: `Laudo Extra Judicial: ${reportData.process || "Novo Laudo"}`,
        date: new Date().toLocaleDateString("pt-BR"),
        status: "Rascunho",
        type: "extrajudicial",
        reportData,
      }
      reports.push(newReport)
    }

    // Salvar no localStorage
    localStorage.setItem("reports", JSON.stringify(reports))

    // Mostrar toast de sucesso
    toast({
      title: reportId ? "Laudo atualizado" : "Laudo criado",
      description: reportId
        ? "O laudo foi atualizado com sucesso."
        : "O laudo foi criado com sucesso e salvo como rascunho.",
    })

    // Redirecionar para o dashboard
    router.push("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {reportId ? "Editar Laudo Extra Judicial" : "Novo Laudo Extra Judicial"}
          </h1>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Laudo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Informações do Laudo</CardTitle>
              <CardDescription>Preencha os dados do laudo extra judicial</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass tabs-list backdrop-blur-md border border-white/10">
                  <TabsTrigger value="general" className="tab-trigger">
                    Geral
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="tab-trigger">
                    Análise
                  </TabsTrigger>
                  <TabsTrigger value="conclusion" className="tab-trigger">
                    Conclusão
                  </TabsTrigger>
                  <TabsTrigger value="media" className="tab-trigger">
                    Mídia
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reference">Referência</Label>
                      <Input
                        id="reference"
                        name="reference"
                        placeholder="Ex: LEJ-2024-001"
                        value={reportData.reference}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="process">Processo</Label>
                      <Input
                        id="process"
                        name="process"
                        placeholder="Ex: 1234/2024"
                        value={reportData.process}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parties">Partes</Label>
                    <Input
                      id="parties"
                      name="parties"
                      placeholder="Nomes das partes envolvidas"
                      value={reportData.parties}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="object">Objeto</Label>
                    <Input
                      id="object"
                      name="object"
                      placeholder="Objeto da perícia"
                      value={reportData.object}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objective">Objetivo</Label>
                    <Textarea
                      id="objective"
                      name="objective"
                      placeholder="Descreva o objetivo da perícia"
                      value={reportData.objective}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="methodology">Metodologia</Label>
                    <Textarea
                      id="methodology"
                      name="methodology"
                      placeholder="Descreva a metodologia utilizada"
                      value={reportData.methodology}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="technical">Aspectos Técnicos</Label>
                    <Textarea
                      id="technical"
                      name="technical"
                      placeholder="Descreva os aspectos técnicos analisados"
                      value={reportData.technical}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentation">Documentação</Label>
                    <Textarea
                      id="documentation"
                      name="documentation"
                      placeholder="Descreva a documentação analisada"
                      value={reportData.documentation}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="findings">Constatações</Label>
                    <Textarea
                      id="findings"
                      name="findings"
                      placeholder="Descreva as constatações da perícia"
                      value={reportData.findings}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="conclusion" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="conclusion">Conclusão</Label>
                    <Textarea
                      id="conclusion"
                      name="conclusion"
                      placeholder="Descreva a conclusão da perícia"
                      value={reportData.conclusion}
                      onChange={handleInputChange}
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expert">Perito Responsável</Label>
                      <Input
                        id="expert"
                        name="expert"
                        placeholder="Nome do perito"
                        value={reportData.expert}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registration">Registro Profissional</Label>
                      <Input
                        id="registration"
                        name="registration"
                        placeholder="Número do registro"
                        value={reportData.registration}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LocationImageUploader
                      onImageUpload={handleLocationImageUpload}
                      currentImage={reportData.locationImage}
                    />
                    <LogoUploader onLogoUpload={handleLogoUpload} currentLogo={reportData.logoImage} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <ReportPreview reportData={reportData} reportType="extrajudicial" />
          </div>
        </div>
      </div>
    </div>
  )
}
