"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, FileDown, Maximize2, Minimize2 } from "lucide-react"
import { ExportDialog } from "@/components/export-dialog"

// Modifique a interface WordPreviewProps para incluir valores padrão:
interface WordPreviewProps {
  reportData: any
  photos?: { id: string; url: string; caption: string }[]
  reportType: string
}

// E no início da função WordPreview, adicione:
export function WordPreview({ reportData, photos = [], reportType }: WordPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
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

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  // Renderizar a página apropriada com base no tipo de relatório
  const renderPage = () => {
    if (currentPage === 1) {
      return <PageOne reportData={reportData} />
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
    <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-background p-4" : ""}`}>
      <div className="flex justify-between items-center mb-4">
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
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
            {fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </Button>
          <Button onClick={() => setShowExportDialog(true)} variant="default" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div
        className={`mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden ${fullscreen ? "flex-1 overflow-auto" : ""}`}
      >
        <div className="mx-auto" style={{ width: "210mm", minHeight: "297mm" }}>
          {renderPage()}
        </div>
      </div>

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

function PageOne({ reportData }: { reportData: WordPreviewProps["reportData"] }) {
  return (
    <div className="p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Cabeçalho com Logo */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
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
        <h1 className="text-2xl font-bold uppercase">
          {reportData.title || "VISTORIA 3: RUA BENEDITO DOS SANTOS, 44 – PARQUE SÃO JORGE – SP"}
        </h1>
      </div>

      {/* Imagem de localização */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md flex items-center justify-center" style={{ height: "280px" }}>
          {reportData.locationImage ? (
            <img
              src={reportData.locationImage || "/placeholder.svg"}
              alt="Localização do imóvel"
              className="max-w-full max-h-full object-contain border border-gray-300 rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md text-gray-400 dark:text-gray-600 text-sm">
              Imagem de localização não disponível
            </div>
          )}
        </div>
      </div>

      {/* Legenda da imagem */}
      <div className="text-center mt-6">
        <p className="text-sm">Localização esquemática do imóvel</p>
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-300 dark:border-gray-700">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">1</p>
      </div>
    </div>
  )
}

function PageTwo({ reportData }: { reportData: WordPreviewProps["reportData"] }) {
  return (
    <div className="p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Cabeçalho com Logo */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
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
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
      </div>

      {/* Conteúdo */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Ficha com dados da construção e seus ocupantes:</h2>
        <div className="space-y-3">
          <p>
            <span className="font-semibold">Ocupante / telefone:</span> {reportData.occupant || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Vistoriador:</span> {reportData.inspector || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Uso do Imóvel:</span> {reportData.usage || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Idade real ou estimada / aparente:</span> {reportData.age || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Tipo de edificação:</span> {reportData.buildingType || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Estado de conservação:</span> {reportData.conservationState || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Padrão construtivo:</span> {reportData.constructionStandard || "N/A"}
          </p>
        </div>

        <p className="mt-6">
          <span className="font-semibold">Observações gerais:</span> {reportData.observations || "N/A"}
        </p>

        <p className="mt-6">
          <span className="font-semibold">Data da Diligência:</span> {reportData.date || "N/A"}
        </p>
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-300 dark:border-gray-700">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">2</p>
      </div>
    </div>
  )
}

function PageThree({ reportData }: { reportData: WordPreviewProps["reportData"] }) {
  return (
    <div className="p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Cabeçalho com Logo */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
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
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
      </div>

      {/* Conteúdo */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Informações técnicas</h2>
        <div className="whitespace-pre-line">
          {reportData.technicalInfo || "Nenhuma informação técnica disponível."}
        </div>
      </div>

      {/* Assinatura */}
      <div className="mt-auto pt-8 text-center">
        <p>{reportData.engineer || "Engenheiro Responsável"}</p>
        <p>{reportData.registration || "Registro Profissional"}</p>
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-4 pt-4 flex justify-between items-center border-t border-gray-300 dark:border-gray-700">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">3</p>
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
    <div className="p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Cabeçalho com Logo */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-[150px]"></div> {/* Espaço reservado para o logo */}
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
      </div>

      {/* Fotos e legendas */}
      <div className="flex-grow flex flex-col justify-between">
        {photos.length > 0 && (
          <div className="mb-6">
            {/* Legenda acima da foto (sem borda) */}
            <div className="text-center mb-2">
              <p className="text-sm">{photos[0].caption || "Sem legenda"}</p>
            </div>

            <div
              className="w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden rounded-md"
              style={{ height: "90mm" }}
            >
              {photos[0].url ? (
                <img
                  src={photos[0].url || "/placeholder.svg"}
                  alt="Foto do laudo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Imagem não disponível</p>
              )}
            </div>
          </div>
        )}

        {photos.length > 1 && (
          <div>
            {/* Legenda acima da foto (sem borda) */}
            <div className="text-center mb-2">
              <p className="text-sm">{photos[1].caption || "Sem legenda"}</p>
            </div>

            <div
              className="w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden rounded-md"
              style={{ height: "90mm" }}
            >
              {photos[1].url ? (
                <img
                  src={photos[1].url || "/placeholder.svg"}
                  alt="Foto do laudo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Imagem não disponível</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-300 dark:border-gray-700">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">{pageNumber}</p>
      </div>
    </div>
  )
}
