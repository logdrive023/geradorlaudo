"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, FileIcon as FilePdf, Check, AlertCircle } from "lucide-react"
import { exportToWord, exportToPDF } from "@/lib/export-utils"

// Atualizar o componente ExportDialog para aceitar o tipo de relatório
interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportData: {
    title: string
    address?: string
    occupant?: string
    inspector?: string
    usage?: string
    age?: string
    buildingType?: string
    conservationState?: string
    constructionStandard?: string
    observations?: string
    date: string
    technicalInfo: string
    engineer: string
    registration: string
    // Campos para laudo contábil
    company?: string
    cnpj?: string
    period?: string
    accountant?: string
    crc?: string
    financialSummary?: string
    // Campos para laudo extra judicial
    processNumber?: string
    court?: string
    plaintiff?: string
    defendant?: string
    object?: string
    [key: string]: string | undefined
  }
  photos: { id: string; url: string; caption: string }[]
  reportType: string
}

export function ExportDialog({ open, onOpenChange, reportData, photos, reportType }: ExportDialogProps) {
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<"word" | "pdf" | null>(null)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Melhorar o tratamento de erros na função handleExport
  const handleExport = async (type: "word" | "pdf") => {
    setExporting(true)
    setExportType(type)
    setProgress(0)
    setSuccess(false)
    setError(null)

    try {
      if (type === "word") {
        await exportToWord(reportData, photos, setProgress)
      } else {
        await exportToPDF(reportData, photos, setProgress)
      }

      setSuccess(true)
    } catch (err) {
      console.error(`Erro ao exportar para ${type}:`, err)
      let errorMessage = `Ocorreu um erro ao exportar para ${type === "word" ? "Word" : "PDF"}.`

      // Adicionar detalhes do erro se disponíveis
      if (err instanceof Error) {
        errorMessage += ` Detalhes: ${err.message}`
      }

      setError(errorMessage + " Por favor, tente novamente.")
    } finally {
      // Manter o diálogo aberto para mostrar o resultado
      setTimeout(() => {
        if (!error) {
          onOpenChange(false)
          setExporting(false)
          setExportType(null)
          setProgress(0)
          setSuccess(false)
        }
      }, 2000)
    }
  }

  const handleClose = () => {
    if (!exporting) {
      onOpenChange(false)
      setExportType(null)
      setProgress(0)
      setSuccess(false)
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Laudo</DialogTitle>
          <DialogDescription>Escolha o formato para exportar seu laudo técnico.</DialogDescription>
        </DialogHeader>

        {!exporting && !success && !error && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => handleExport("word")}
              className="flex flex-col items-center justify-center h-32 p-4"
              variant="outline"
            >
              <FileText className="h-12 w-12 mb-2 text-blue-500" />
              <span>Microsoft Word (.docx)</span>
            </Button>

            <Button
              onClick={() => handleExport("pdf")}
              className="flex flex-col items-center justify-center h-32 p-4"
              variant="outline"
            >
              <FilePdf className="h-12 w-12 mb-2 text-red-500" />
              <span>Adobe PDF (.pdf)</span>
            </Button>
          </div>
        )}

        {exporting && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center">
              {exportType === "word" ? (
                <FileText className="h-16 w-16 text-blue-500 animate-pulse" />
              ) : (
                <FilePdf className="h-16 w-16 text-red-500 animate-pulse" />
              )}
            </div>

            <p className="text-center font-medium">
              Exportando para {exportType === "word" ? "Microsoft Word" : "PDF"}...
            </p>

            <Progress value={progress} className="h-2" />

            <p className="text-center text-sm text-muted-foreground">
              {progress < 30 && "Preparando documento..."}
              {progress >= 30 && progress < 70 && "Processando imagens..."}
              {progress >= 70 && progress < 90 && "Finalizando documento..."}
              {progress >= 90 && "Concluindo exportação..."}
            </p>
          </div>
        )}

        {success && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <p className="text-center font-medium">Exportação concluída com sucesso!</p>

            <p className="text-center text-sm text-muted-foreground">O arquivo foi baixado para o seu computador.</p>
          </div>
        )}

        {error && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <p className="text-center font-medium">Erro na exportação</p>

            <p className="text-center text-sm text-muted-foreground">{error}</p>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setError(null)
                  setExporting(false)
                  setExportType(null)
                }}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
