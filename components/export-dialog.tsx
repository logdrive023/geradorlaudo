"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { exportToWord, exportToPDF } from "@/lib/export-utils"
import { FileDown, FileText, FileImage } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportData: any
  photos: { id: string; url: string; caption: string }[]
  reportType: string
}

export function ExportDialog({ open, onOpenChange, reportData, photos, reportType }: ExportDialogProps) {
  const [exportType, setExportType] = useState<"pdf" | "word">("pdf")
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [totalImages, setTotalImages] = useState(0)

  // Calcular o número total de imagens (fotos + logo + imagem de localização)
  useEffect(() => {
    let count = photos.length

    // Adicionar logo se existir
    if (reportData.logoImage && reportData.logoImage.length > 100) {
      count++
    }

    // Adicionar imagem de localização se existir
    if (reportData.locationImage && reportData.locationImage.length > 100) {
      count++
    }

    setTotalImages(count)
  }, [photos, reportData.logoImage, reportData.locationImage])

  // Função para lidar com a exportação
  const handleExport = async () => {
    setIsExporting(true)
    setProgress(0)
    setError(null)

    try {
      console.log("Iniciando exportação:", exportType)
      console.log("Dados do relatório:", reportData)
      console.log("Imagem de localização:", reportData.locationImage ? "Presente" : "Ausente")
      console.log("Logo personalizado:", reportData.logoImage ? "Presente" : "Ausente")
      console.log("Fotos:", photos.length)
      console.log("Total de imagens:", totalImages)

      if (exportType === "pdf") {
        await exportToPDF(reportData, photos, setProgress)
      } else {
        await exportToWord(reportData, photos, setProgress)
      }

      // Fechar o diálogo após a exportação bem-sucedida
      setTimeout(() => {
        setIsExporting(false)
        onOpenChange(false)
      }, 1000)
    } catch (err) {
      console.error("Erro na exportação:", err)
      setError(`Erro na exportação: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border/50 shadow-lg">
        <DialogHeader>
          <DialogTitle>Exportar Laudo</DialogTitle>
          <DialogDescription>Escolha o formato de exportação do seu laudo.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                exportType === "pdf" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
              }`}
              onClick={() => setExportType("pdf")}
            >
              <FileDown className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">PDF</span>
              <span className="text-xs text-muted-foreground mt-1">Documento para visualização</span>
            </div>

            <div
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                exportType === "word" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
              }`}
              onClick={() => setExportType("word")}
            >
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Word</span>
              <span className="text-xs text-muted-foreground mt-1">Documento editável</span>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <FileImage className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {totalImages} {totalImages === 1 ? "imagem anexada" : "imagens anexadas"}
              </span>
              {reportData.locationImage && (
                <span className="text-xs text-muted-foreground">(inclui imagem de localização)</span>
              )}
              {reportData.logoImage && (
                <span className="text-xs text-muted-foreground">(inclui logo personalizada)</span>
              )}
            </div>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {progress < 100 ? "Exportando..." : "Exportação concluída!"}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="border-border/50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={exportType === "pdf" ? "gradient-blue" : "gradient-purple"}
          >
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
