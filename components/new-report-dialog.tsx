"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Calculator, Scale } from "lucide-react"
import { useRouter } from "next/navigation"

interface NewReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewReportDialog({ open, onOpenChange }: NewReportDialogProps) {
  const [reportTitle, setReportTitle] = useState("")
  const [reportType, setReportType] = useState("cautelar")
  const router = useRouter()

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

    // Fechar o diálogo
    onOpenChange(false)

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

  const handleReportTypeChange = (value: string) => {
    setReportType(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-foreground">Criar novo laudo</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecione o tipo de laudo que deseja criar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              Título do laudo
            </Label>
            <Input
              id="title"
              placeholder={getDefaultTitle()}
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="bg-background/70 border-input text-foreground placeholder:text-muted-foreground transition-none"
            />
            <p className="text-sm text-muted-foreground">
              Se não for especificado, um título padrão será usado com base no tipo de laudo.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Tipo de laudo</Label>
            <div className="grid gap-4 pt-2">
              <div className="flex items-start space-x-3 space-y-0">
                <div className="flex items-center h-4 w-4">
                  <input
                    type="radio"
                    id="cautelar-dialog"
                    name="report-type"
                    value="cautelar"
                    checked={reportType === "cautelar"}
                    onChange={() => handleReportTypeChange("cautelar")}
                    className="h-4 w-4 text-blue-600 border-input focus:ring-blue-500"
                  />
                </div>
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="cautelar-dialog"
                    className="flex items-center gap-2 font-medium cursor-pointer text-foreground transition-none"
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
                <div className="flex items-center h-4 w-4">
                  <input
                    type="radio"
                    id="contabil-dialog"
                    name="report-type"
                    value="contabil"
                    checked={reportType === "contabil"}
                    onChange={() => handleReportTypeChange("contabil")}
                    className="h-4 w-4 text-purple-600 border-input focus:ring-purple-500"
                  />
                </div>
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="contabil-dialog"
                    className="flex items-center gap-2 font-medium cursor-pointer text-foreground transition-none"
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
                <div className="flex items-center h-4 w-4">
                  <input
                    type="radio"
                    id="extrajudicial-dialog"
                    name="report-type"
                    value="extrajudicial"
                    checked={reportType === "extrajudicial"}
                    onChange={() => handleReportTypeChange("extrajudicial")}
                    className="h-4 w-4 text-amber-600 border-input focus:ring-amber-500"
                  />
                </div>
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="extrajudicial-dialog"
                    className="flex items-center gap-2 font-medium cursor-pointer text-foreground transition-none"
                  >
                    <Scale className="h-4 w-4 text-amber-600" />
                    Laudo Extra Judicial
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Laudos técnicos para processos extra judiciais, mediações e arbitragens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateReport}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-colors duration-300"
          >
            Criar laudo e continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
