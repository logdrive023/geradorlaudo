"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArrowLeft, FileText, Calculator, Scale } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function NewReportPage() {
  const [reportTitle, setReportTitle] = useState("")
  const [reportType, setReportType] = useState("cautelar")
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Se estiver carregando ou não tiver usuário, não renderizar o conteúdo
  if (isLoading || !user) {
    return null
  }

  const handleCreateReport = () => {
    // Criar um novo relatório com os dados básicos
    const newReport = {
      id: Date.now().toString(),
      title: reportTitle || getDefaultTitle(),
      date: new Date().toLocaleDateString("pt-BR"),
      status: "Rascunho",
      type: reportType,
      reportData: getDefaultReportData(),
      photos: [],
    }

    // Obter relatórios existentes ou inicializar array vazio
    const existingReports = JSON.parse(localStorage.getItem("reports") || "[]")

    // Adicionar o novo relatório
    existingReports.push(newReport)

    // Salvar de volta no localStorage
    localStorage.setItem("reports", JSON.stringify(existingReports))

    // Redirecionar para o editor com o ID do novo relatório
    router.push(`/editor/${newReport.id}`)
  }

  const getDefaultTitle = () => {
    switch (reportType) {
      case "cautelar":
        return "Nova Vistoria Cautelar"
      case "contabil":
        return "Novo Laudo Contábil"
      case "extrajudicial":
        return "Novo Laudo Extra Judicial"
      default:
        return "Novo Laudo"
    }
  }

  const getDefaultReportData = () => {
    // Dados padrão para cada tipo de laudo
    const commonData = {
      engineer: "Eng. Civil Osvaldo Luiz Oliveira da Silva",
      registration: "CREA: 5070574267",
      date: new Date().toLocaleDateString("pt-BR"),
    }

    switch (reportType) {
      case "cautelar":
        return {
          ...commonData,
          title: reportTitle || "Nova Vistoria Cautelar",
          address: "",
          occupant: "",
          inspector: "Engenheiro Osvaldo Luiz Oliveira da Silva",
          usage: "Residencial",
          age: "",
          buildingType: "Residencial",
          conservationState: "Regular",
          constructionStandard: "Convencional",
          observations: "",
          technicalInfo: "",
        }
      case "contabil":
        return {
          ...commonData,
          title: reportTitle || "Novo Laudo Contábil",
          company: "",
          cnpj: "",
          period: "",
          accountant: "",
          crc: "",
          financialSummary: "",
          technicalInfo: "",
        }
      case "extrajudicial":
        return {
          ...commonData,
          title: reportTitle || "Novo Laudo Extra Judicial",
          processNumber: "",
          court: "",
          plaintiff: "",
          defendant: "",
          object: "",
          technicalInfo: "",
        }
      default:
        return {
          ...commonData,
          title: reportTitle || "Novo Laudo",
          technicalInfo: "",
        }
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Criar novo laudo"
        text="Selecione o tipo de laudo que deseja criar"
        className="dashboard-header"
      >
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </DashboardHeader>

      <div className="grid gap-6">
        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-foreground">Informações básicas</CardTitle>
            <CardDescription className="text-muted-foreground">Defina o título e o tipo do seu laudo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">
                Título do laudo
              </Label>
              <Input
                id="title"
                placeholder={getDefaultTitle()}
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="bg-background/70 border-input text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                Se não for especificado, um título padrão será usado com base no tipo de laudo.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Tipo de laudo</Label>
              <RadioGroup value={reportType} onValueChange={setReportType} className="grid gap-4 pt-2">
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="cautelar" id="cautelar" className="border-input text-blue-600" />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="cautelar"
                      className="flex items-center gap-2 font-medium cursor-pointer text-foreground"
                    >
                      <FileText className="h-4 w-4 text-blue-600" />
                      Laudo Cautelar de Vizinhança
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Vistorias e análises de imóveis vizinhos a obras para documentar condições pré-existentes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="contabil" id="contabil" className="border-input text-purple-600" />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="contabil"
                      className="flex items-center gap-2 font-medium cursor-pointer text-foreground"
                    >
                      <Calculator className="h-4 w-4 text-purple-600" />
                      Laudo Contábil
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Análises contábeis e financeiras para avaliação de empresas e situações patrimoniais.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="extrajudicial" id="extrajudicial" className="border-input text-amber-600" />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="extrajudicial"
                      className="flex items-center gap-2 font-medium cursor-pointer text-foreground"
                    >
                      <Scale className="h-4 w-4 text-amber-600" />
                      Laudo Extra Judicial
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Laudos técnicos para processos extra judiciais, mediações e arbitragens.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleCreateReport}
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            Criar laudo e continuar
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}
