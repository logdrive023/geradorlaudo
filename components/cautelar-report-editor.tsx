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

interface CautelarReportEditorProps {
  initialData?: any
  reportId?: string
}

export function CautelarReportEditor({ initialData, reportId }: CautelarReportEditorProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [reportData, setReportData] = useState(
    initialData || {
      reference: "",
      address: "",
      owner: "",
      propertyType: "",
      objective: "",
      methodology: "",
      structure: "",
      coatings: "",
      installations: "",
      conclusion: "",
      engineer: "",
      crea: "",
      locationImage: "",
      logoImage: "",
    },
  )
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setReportData((prev: any) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLocationImageUpload = (imageUrl: string) => {
    setReportData((prev: any) => ({
      ...prev,
      locationImage: imageUrl,
    }))
  }

  const handleLogoUpload = (logoUrl: string) => {
    setReportData((prev: any) => ({
      ...prev,
      logoImage: logoUrl,
    }))
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
        title: `Vistoria: ${reportData.address || "Novo Laudo"}`,
        date: new Date().toLocaleDateString("pt-BR"),
        status: "Rascunho",
        type: "cautelar",
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
            {reportId ? "Editar Laudo Cautelar" : "Novo Laudo Cautelar de Vizinhança"}
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
              <CardDescription>Preencha os dados do laudo cautelar de vizinhança</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass tabs-list backdrop-blur-md border border-white/10">
                  <TabsTrigger value="general" className="tab-trigger">
                    Geral
                  </TabsTrigger>
                  <TabsTrigger value="inspection" className="tab-trigger">
                    Vistoria
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
                        placeholder="Ex: LCV-2024-001"
                        value={reportData.reference}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Tipo de Imóvel</Label>
                      <Input
                        id="propertyType"
                        name="propertyType"
                        placeholder="Ex: Residencial, Comercial"
                        value={reportData.propertyType}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Rua, número, bairro, cidade, estado"
                      value={reportData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner">Proprietário</Label>
                    <Input
                      id="owner"
                      name="owner"
                      placeholder="Nome do proprietário"
                      value={reportData.owner}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objective">Objetivo</Label>
                    <Textarea
                      id="objective"
                      name="objective"
                      placeholder="Descreva o objetivo da vistoria"
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

                <TabsContent value="inspection" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="structure">Estrutura</Label>
                    <Textarea
                      id="structure"
                      name="structure"
                      placeholder="Descreva as condições estruturais"
                      value={reportData.structure}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coatings">Revestimentos</Label>
                    <Textarea
                      id="coatings"
                      name="coatings"
                      placeholder="Descreva as condições dos revestimentos"
                      value={reportData.coatings}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="installations">Instalações</Label>
                    <Textarea
                      id="installations"
                      name="installations"
                      placeholder="Descreva as condições das instalações"
                      value={reportData.installations}
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
                      placeholder="Descreva a conclusão da vistoria"
                      value={reportData.conclusion}
                      onChange={handleInputChange}
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="engineer">Engenheiro Responsável</Label>
                      <Input
                        id="engineer"
                        name="engineer"
                        placeholder="Nome do engenheiro"
                        value={reportData.engineer}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crea">CREA</Label>
                      <Input
                        id="crea"
                        name="crea"
                        placeholder="Número do CREA"
                        value={reportData.crea}
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
            <ReportPreview reportData={reportData} reportType="cautelar" />
          </div>
        </div>
      </div>
    </div>
  )
}
