"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileDown, ChevronLeft, ChevronRight } from "lucide-react"
import { ExportDialog } from "@/components/export-dialog"

// Modifique a interface ReportPreviewProps para incluir valores padrão:
interface ReportPreviewProps {
  reportData: any
  photos?: { id: string; url: string; caption: string }[]
  reportType: string
}

// E no início da função ReportPreview, adicione:
export function ReportPreview({ reportData, photos = [], reportType }: ReportPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Calcular o número total de páginas com base no tipo de relatório e fotos
  const getTotalPages = () => {
    const basePages = 3 // Páginas básicas (capa, dados, conclusão)
    const photoPages = Math.ceil(photos.length / 2) // Páginas de fotos (2 por página)
    return basePages + photoPages
  }

  const totalPages = getTotalPages()

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  // Renderizar a página apropriada com base no tipo de relatório
  const renderPage = () => {
    if (currentPage === 1) {
      return <PageOne reportData={reportData} reportType={reportType} />
    } else if (currentPage === 2) {
      return <PageTwo reportData={reportData} />
    } else if (currentPage === 3) {
      return <PageThree reportData={reportData} />
    } else {
      // Calcular quais fotos mostrar com base na página atual
      const photoStartIndex = (currentPage - 4) * 2
      return <PhotoPage pageNumber={currentPage} photos={photos.slice(photoStartIndex, photoStartIndex + 2)} />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowExportDialog(true)} variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Card className="border dark:border-gray-800 shadow-sm overflow-hidden">
        <CardContent className="p-0">{renderPage()}</CardContent>
      </Card>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        reportData={reportData}
        photos={photos}
        reportType={reportType}
      />
    </div>
  )
}

function PageOne({ reportData, reportType }: { reportData: ReportPreviewProps["reportData"]; reportType: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-8 min-h-[842px] w-full flex flex-col">
      {/* Cabeçalho com Logo */}
      <div className="text-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {reportData.logoImage ? (
          <div className="max-w-[150px] max-h-[60px]">
            <img
              src={reportData.logoImage || "/placeholder.svg"}
              alt="Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="w-[150px]"></div> // Espaço reservado para o logo
        )}
        <p className="text-xs mb-1 text-gray-700 dark:text-gray-300">
          Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386
        </p>
      </div>

      {/* Título */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase text-gray-900 dark:text-white">
          {reportData.title || "VISTORIA 3: RUA BENEDITO DOS SANTOS, 44 – PARQUE SÃO JORGE – SP"}
        </h1>
      </div>

      {/* Imagem de localização */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md aspect-video bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
          {reportData.locationImage ? (
            <img
              src={reportData.locationImage || "/placeholder.svg"}
              alt="Localização do imóvel"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-400 dark:text-gray-600 text-sm">Imagem de localização não disponível</div>
          )}
        </div>
      </div>

      {/* Legenda da imagem */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-700 dark:text-gray-300">Localização esquemática do imóvel</p>
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-6 text-center">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <p className="text-xs font-medium">1</p>
        </div>
      </div>
    </div>
  )
}

function PageTwo({ reportData }: { reportData: ReportPreviewProps["reportData"] }) {
  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-8 min-h-[842px] w-full flex flex-col">
      {/* Cabeçalho com Logo */}
      <div className="text-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {reportData.logoImage ? (
          <div className="max-w-[150px] max-h-[60px]">
            <img
              src={reportData.logoImage || "/placeholder.svg"}
              alt="Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="w-[150px]"></div> // Espaço reservado para o logo
        )}
        <p className="text-xs mb-1 text-gray-700 dark:text-gray-300">
          Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386
        </p>
      </div>

      {/* Conteúdo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Ficha com dados da construção e seus ocupantes:
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold">Ocupante / telefone:</span>
            <span>{reportData.occupant || "N/A"}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold">Vistoriador:</span>
            <span>{reportData.inspector || "N/A"}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold">Uso do Imóvel:</span>
            <span>{reportData.usage || "N/A"}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold">Idade real ou estimada / aparente:</span>
            <span>{reportData.age || "N/A"}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold">Tipo de edificação:</span>
            <span>{reportData.buildingType || "N/A"}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold">Estado de conservação:</span>
            <span>{reportData.conservationState || "N/A"}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold">Padrão construtivo:</span>
            <span>{reportData.constructionStandard || "N/A"}</span>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-3">Observações gerais:</h3>
          <p>{reportData.observations || "Sem observações registradas."}</p>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2">
            <span className="font-bold">Data da Diligência:</span>
            <span>{reportData.date || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-6 text-center">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <p className="text-xs font-medium">2</p>
        </div>
      </div>
    </div>
  )
}

function PageThree({ reportData }: { reportData: ReportPreviewProps["reportData"] }) {
  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-8 min-h-[842px] w-full flex flex-col">
      {/* Cabeçalho com Logo */}
      <div className="text-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {reportData.logoImage ? (
          <div className="max-w-[150px] max-h-[60px]">
            <img
              src={reportData.logoImage || "/placeholder.svg"}
              alt="Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="w-[150px]"></div> // Espaço reservado para o logo
        )}
        <p className="text-xs mb-1 text-gray-700 dark:text-gray-300">
          Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386
        </p>
      </div>

      {/* Conteúdo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Informações técnicas</h2>

        <div className="whitespace-pre-line">
          {reportData.technicalInfo || "Nenhuma informação técnica disponível."}
        </div>
      </div>

      {/* Assinatura */}
      <div className="mt-auto pt-8 text-center">
        <p className="font-medium">{reportData.engineer || "Engenheiro Responsável"}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{reportData.registration || "Registro Profissional"}</p>
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-6 pt-4 text-center">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <p className="text-xs font-medium">3</p>
        </div>
      </div>
    </div>
  )
}

function PhotoPage({
  pageNumber,
  photos,
}: {
  pageNumber: number
  photos: { id: string; url: string; caption: string }[]
}) {
  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-8 min-h-[842px] w-full flex flex-col">
      {/* Cabeçalho */}
      <div className="text-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs mb-1 text-gray-700 dark:text-gray-300">
          Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386
        </p>
      </div>

      {/* Fotos e legendas */}
      <div className="flex-grow flex flex-col justify-between">
        {photos.length > 0 && (
          <div className="mb-6">
            {/* Legenda acima da foto */}
            <p className="mt-2 text-sm mb-3 text-center">{photos[0].caption || "Sem legenda"}</p>

            <div
              className="aspect-video w-full bg-white dark:bg-gray-800 flex items-center justify-center rounded-lg overflow-hidden"
              style={{ maxHeight: "280px" }}
            >
              {photos[0].url ? (
                <img
                  src={photos[0].url || "/placeholder.svg"}
                  alt="Foto do laudo"
                  className="max-h-full object-contain"
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Imagem não disponível</p>
              )}
            </div>
          </div>
        )}

        {photos.length > 1 && (
          <div>
            {/* Legenda acima da foto */}
            <p className="mt-2 text-sm mb-3 text-center">{photos[1].caption || "Sem legenda"}</p>

            <div
              className="aspect-video w-full bg-white dark:bg-gray-800 flex items-center justify-center rounded-lg overflow-hidden"
              style={{ maxHeight: "280px" }}
            >
              {photos[1].url ? (
                <img
                  src={photos[1].url || "/placeholder.svg"}
                  alt="Foto do laudo"
                  className="max-h-full object-contain"
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Imagem não disponível</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-6 text-center">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <p className="text-xs font-medium">{pageNumber}</p>
        </div>
      </div>
    </div>
  )
}
