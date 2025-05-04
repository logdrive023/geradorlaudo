"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, FileDown, Maximize2, Minimize2 } from "lucide-react"
import { ExportDialog } from "@/components/export-dialog"

interface WordPreviewProps {
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
    locationImage?: string
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

export function WordPreview({ reportData, photos, reportType }: WordPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Calcular o número total de páginas com base no tipo de relatório e fotos
  const getTotalPages = () => {
    const basePages = 3 // Páginas básicas (capa, dados, conclusão)
    const photoPages = Math.ceil(photos.length / 2) // Páginas de fotos (2 por página)
    return Math.max(basePages, basePages + photoPages)
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
      return <PageOne reportData={reportData} reportType={reportType} />
    } else if (currentPage === 2) {
      if (reportType === "contabil") {
        return <ContabilPageTwo reportData={reportData} />
      } else if (reportType === "extrajudicial") {
        return <ExtraJudicialPageTwo reportData={reportData} />
      } else {
        return <CautelarPageTwo reportData={reportData} />
      }
    } else if (currentPage === 3) {
      return <PageThree reportData={reportData} reportType={reportType} />
    } else {
      return (
        <PhotoPage
          pageNumber={currentPage}
          photos={photos.slice((currentPage - 4) * 2, (currentPage - 4) * 2 + 2)}
          reportData={reportData}
        />
      )
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
          <Button
            onClick={() => setShowExportDialog(true)}
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div
        className={`mx-auto bg-white shadow-lg rounded-lg overflow-hidden ${fullscreen ? "flex-1 overflow-auto" : ""}`}
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

// Ajustar o componente PageOne para garantir que a imagem de localização tenha tamanho consistente

function PageOne({ reportData, reportType }: { reportData: WordPreviewProps["reportData"]; reportType: string }) {
  // Determinar as cores com base no tipo de relatório
  const getColors = () => {
    switch (reportType) {
      case "contabil":
        return {
          gradient: "from-white to-purple-50",
          border: "border-purple-200",
          text: "text-purple-700",
          borderLeft: "border-purple-500",
          badge: "bg-purple-100 text-purple-700",
        }
      case "extrajudicial":
        return {
          gradient: "from-white to-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          borderLeft: "border-amber-500",
          badge: "bg-amber-100 text-amber-700",
        }
      default:
        return {
          gradient: "from-white to-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          borderLeft: "border-blue-500",
          badge: "bg-blue-100 text-blue-700",
        }
    }
  }

  const colors = getColors()

  return (
    <div className={`bg-gradient-to-br ${colors.gradient} p-8 min-h-[297mm] w-[210mm] flex flex-col word-page`}>
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div className="w-32">
          <img src="/images/logo.png" alt="OSVALDOSILVA Engenharia Civil" className="w-full" />
        </div>
      </div>

      {/* Título */}
      <div className="text-center mb-8">
        <h1 className={`text-2xl font-bold ${colors.text}`}>{reportData.title}</h1>
        <div className={`mt-2 h-1 w-32 mx-auto ${colors.borderLeft} rounded-full`}></div>
      </div>

      {/* Imagem de localização ou conteúdo específico do tipo */}
      <div className="flex-grow flex items-center justify-center">
        {reportType === "cautelar" ? (
          <div className="w-full max-w-md flex items-center justify-center" style={{ height: "280px" }}>
            {reportData.locationImage ? (
              <img
                src={reportData.locationImage || "/placeholder.svg"}
                alt="Localização do imóvel"
                className="max-w-full max-h-full object-contain border border-gray-300 rounded-lg shadow-md"
              />
            ) : (
              <img
                src="/placeholder.svg?key=mwe0q"
                alt="Localização do imóvel"
                className="max-w-full max-h-full object-contain border border-gray-300 rounded-lg shadow-md"
              />
            )}
          </div>
        ) : reportType === "contabil" ? (
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-center text-purple-700">Análise Contábil</h2>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Empresa:</span>
              <span>{reportData.company || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">CNPJ:</span>
              <span>{reportData.cnpj || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Período:</span>
              <span>{reportData.period || "N/A"}</span>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-center text-amber-700">Processo Extra Judicial</h2>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Processo nº:</span>
              <span>{reportData.processNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Requerente:</span>
              <span>{reportData.plaintiff || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Requerido:</span>
              <span>{reportData.defendant || "N/A"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legenda da imagem ou data */}
      <div className="text-center mt-6">
        {reportType === "cautelar" ? (
          <p className="text-sm inline-block px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            Localização esquemática do imóvel
          </p>
        ) : (
          <p className="text-sm inline-block px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            Data: {reportData.date || new Date().toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-300">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">1</p>
      </div>
    </div>
  )
}

function CautelarPageTwo({ reportData }: { reportData: WordPreviewProps["reportData"] }) {
  return (
    <div className="bg-white p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Conteúdo */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-blue-700">Ficha com dados da construção e seus ocupantes:</h2>
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
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-300">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">2</p>
      </div>
    </div>
  )
}

function ContabilPageTwo({ reportData }: { reportData: WordPreviewProps["reportData"] }) {
  return (
    <div className="bg-white p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Conteúdo */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-purple-700">Dados da Empresa e Análise Financeira</h2>
        <div className="space-y-3">
          <p>
            <span className="font-semibold">Empresa:</span> {reportData.company || "N/A"}
          </p>
          <p>
            <span className="font-semibold">CNPJ:</span> {reportData.cnpj || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Período Analisado:</span> {reportData.period || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Contador Responsável:</span> {reportData.accountant || "N/A"}
          </p>
          <p>
            <span className="font-semibold">CRC:</span> {reportData.crc || "N/A"}
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-8 mb-4 text-purple-700">Resumo Financeiro</h3>
        <div className="whitespace-pre-line">
          {reportData.financialSummary || "Nenhuma informação financeira disponível."}
        </div>
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-300">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">2</p>
      </div>
    </div>
  )
}

function ExtraJudicialPageTwo({ reportData }: { reportData: WordPreviewProps["reportData"] }) {
  return (
    <div className="bg-white p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Conteúdo */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-amber-700">Informações do Processo</h2>
        <div className="space-y-3">
          <p>
            <span className="font-semibold">Número do Processo:</span> {reportData.processNumber || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Tribunal/Câmara:</span> {reportData.court || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Requerente:</span> {reportData.plaintiff || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Requerido:</span> {reportData.defendant || "N/A"}
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-8 mb-4 text-amber-700">Objeto da Perícia</h3>
        <div className="whitespace-pre-line">
          {reportData.object || "Nenhuma informação sobre o objeto da perícia disponível."}
        </div>
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-300">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">2</p>
      </div>
    </div>
  )
}

function PageThree({ reportData, reportType }: { reportData: WordPreviewProps["reportData"]; reportType: string }) {
  // Determinar as cores com base no tipo de relatório
  const getTextColor = () => {
    switch (reportType) {
      case "contabil":
        return "text-purple-700"
      case "extrajudicial":
        return "text-amber-700"
      default:
        return "text-blue-700"
    }
  }

  const textColor = getTextColor()

  return (
    <div className="bg-white p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Conteúdo */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${textColor}`}>Informações técnicas</h2>
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
      <div className="mt-4 pt-4 flex justify-between items-center border-t border-gray-300">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">3</p>
      </div>
    </div>
  )
}

function PhotoPage({
  pageNumber,
  photos,
  reportData,
}: {
  pageNumber: number
  photos: { id: string; url: string; caption: string }[]
  reportData: WordPreviewProps["reportData"]
}) {
  return (
    <div className="bg-white p-8 min-h-[297mm] w-[210mm] flex flex-col word-page">
      {/* Fotos e legendas */}
      <div className="flex-grow flex flex-col justify-between">
        {photos.length > 0 && (
          <div className="mb-6">
            {/* Legenda acima da foto (sem borda) */}
            <div className="text-center mb-2">
              <p className="text-sm">{photos[0].caption || "Sem legenda"}</p>
            </div>

            <div
              className="w-full bg-gray-100 flex items-center justify-center overflow-hidden rounded-md"
              style={{ height: "90mm" }}
            >
              {photos[0].url ? (
                <img
                  src={photos[0].url || "/placeholder.svg"}
                  alt="Foto do laudo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-gray-500">Imagem não disponível</p>
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
              className="w-full bg-gray-100 flex items-center justify-center overflow-hidden rounded-md"
              style={{ height: "90mm" }}
            >
              {photos[1].url ? (
                <img
                  src={photos[1].url || "/placeholder.svg"}
                  alt="Foto do laudo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-gray-500">Imagem não disponível</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé com número da página */}
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-300">
        <p className="text-xs">Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386</p>
        <p className="text-xs">{pageNumber}</p>
      </div>
    </div>
  )
}
