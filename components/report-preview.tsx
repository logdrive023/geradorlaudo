"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Printer } from "lucide-react"
import Image from "next/image"

interface ReportPreviewProps {
  reportData: any
  reportType: string
}

export function ReportPreview({ reportData, reportType }: ReportPreviewProps) {
  const [activeTab, setActiveTab] = useState("preview")
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    const date = new Date()
    setCurrentDate(date.toLocaleDateString("pt-BR"))
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const renderCautelarReport = () => {
    return (
      <div className="word-page bg-white text-black p-8 rounded-md shadow-md">
        {/* Cabeçalho com Logo */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center">
            {reportData.logoImage ? (
              <Image
                src={reportData.logoImage || "/placeholder.svg"}
                alt="Logo da empresa"
                width={150}
                height={60}
                className="object-contain max-h-16"
              />
            ) : (
              <div className="w-[150px] h-[60px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                Logo não definido
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">LAUDO CAUTELAR DE VIZINHANÇA</p>
            <p className="text-xs">Data: {currentDate}</p>
            <p className="text-xs">Ref: {reportData.reference || "N/A"}</p>
          </div>
        </div>

        {/* Informações do Imóvel */}
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-4">LAUDO CAUTELAR DE VIZINHANÇA</h1>
          <h2 className="text-lg font-bold mb-2">1. IDENTIFICAÇÃO DO IMÓVEL</h2>
          <p>
            <strong>Endereço:</strong> {reportData.address || "N/A"}
          </p>
          <p>
            <strong>Proprietário:</strong> {reportData.owner || "N/A"}
          </p>
          <p>
            <strong>Tipo de Imóvel:</strong> {reportData.propertyType || "N/A"}
          </p>
        </div>

        {/* Objetivo */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">2. OBJETIVO</h2>
          <p>{reportData.objective || "Realizar vistoria cautelar para documentar o estado atual do imóvel."}</p>
        </div>

        {/* Metodologia */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">3. METODOLOGIA</h2>
          <p>
            {reportData.methodology ||
              "A vistoria foi realizada através de inspeção visual, com registro fotográfico detalhado de todos os ambientes e estruturas do imóvel."}
          </p>
        </div>

        {/* Vistoria */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">4. VISTORIA</h2>
          <h3 className="text-md font-bold mb-1">4.1. Estrutura</h3>
          <p>{reportData.structure || "Não foram identificadas anomalias estruturais significativas."}</p>

          <h3 className="text-md font-bold mb-1 mt-2">4.2. Revestimentos</h3>
          <p>{reportData.coatings || "Os revestimentos apresentam-se em bom estado de conservação."}</p>

          <h3 className="text-md font-bold mb-1 mt-2">4.3. Instalações</h3>
          <p>
            {reportData.installations ||
              "As instalações elétricas e hidráulicas foram testadas e encontram-se em funcionamento normal."}
          </p>
        </div>

        {/* Imagem de Localização */}
        {reportData.locationImage && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">5. LOCALIZAÇÃO</h2>
            <div className="border p-1 inline-block">
              <Image
                src={reportData.locationImage || "/placeholder.svg"}
                alt="Imagem de localização"
                width={500}
                height={300}
                className="object-cover"
              />
            </div>
            <p className="text-xs mt-1">Figura 1: Localização do imóvel vistoriado.</p>
          </div>
        )}

        {/* Conclusão */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">6. CONCLUSÃO</h2>
          <p>
            {reportData.conclusion ||
              "Com base na vistoria realizada, conclui-se que o imóvel encontra-se em bom estado de conservação, sem danos estruturais significativos."}
          </p>
        </div>

        {/* Assinatura */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center">
            <p className="mb-8">____________________________________</p>
            <p className="font-bold">{reportData.engineer || "Engenheiro Responsável"}</p>
            <p>{reportData.crea || "CREA 000000-D"}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderContabilReport = () => {
    return (
      <div className="word-page bg-white text-black p-8 rounded-md shadow-md">
        {/* Cabeçalho com Logo */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center">
            {reportData.logoImage ? (
              <Image
                src={reportData.logoImage || "/placeholder.svg"}
                alt="Logo da empresa"
                width={150}
                height={60}
                className="object-contain max-h-16"
              />
            ) : (
              <div className="w-[150px] h-[60px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                Logo não definido
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">LAUDO CONTÁBIL</p>
            <p className="text-xs">Data: {currentDate}</p>
            <p className="text-xs">Ref: {reportData.reference || "N/A"}</p>
          </div>
        </div>

        {/* Informações da Empresa */}
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-4">LAUDO CONTÁBIL</h1>
          <h2 className="text-lg font-bold mb-2">1. IDENTIFICAÇÃO DA EMPRESA</h2>
          <p>
            <strong>Empresa:</strong> {reportData.company || "N/A"}
          </p>
          <p>
            <strong>CNPJ:</strong> {reportData.cnpj || "N/A"}
          </p>
          <p>
            <strong>Endereço:</strong> {reportData.address || "N/A"}
          </p>
        </div>

        {/* Objetivo */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">2. OBJETIVO</h2>
          <p>{reportData.objective || "Realizar análise contábil para avaliação da situação financeira da empresa."}</p>
        </div>

        {/* Metodologia */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">3. METODOLOGIA</h2>
          <p>
            {reportData.methodology ||
              "A análise foi realizada com base nos documentos contábeis fornecidos pela empresa, incluindo balanços patrimoniais, demonstrações de resultados e livros fiscais."}
          </p>
        </div>

        {/* Análise */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">4. ANÁLISE CONTÁBIL</h2>
          <h3 className="text-md font-bold mb-1">4.1. Situação Patrimonial</h3>
          <p>{reportData.patrimony || "A empresa apresenta situação patrimonial estável."}</p>

          <h3 className="text-md font-bold mb-1 mt-2">4.2. Análise de Resultados</h3>
          <p>{reportData.results || "Os resultados operacionais mostram-se consistentes com o setor."}</p>

          <h3 className="text-md font-bold mb-1 mt-2">4.3. Indicadores Financeiros</h3>
          <p>
            {reportData.indicators ||
              "Os indicadores financeiros apontam para uma situação de liquidez adequada e endividamento controlado."}
          </p>
        </div>

        {/* Conclusão */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">5. CONCLUSÃO</h2>
          <p>
            {reportData.conclusion ||
              "Com base na análise realizada, conclui-se que a empresa apresenta situação contábil regular, com controles adequados e conformidade com as normas contábeis vigentes."}
          </p>
        </div>

        {/* Assinatura */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center">
            <p className="mb-8">____________________________________</p>
            <p className="font-bold">{reportData.accountant || "Contador Responsável"}</p>
            <p>{reportData.crc || "CRC 000000-O"}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderExtrajudicialReport = () => {
    return (
      <div className="word-page bg-white text-black p-8 rounded-md shadow-md">
        {/* Cabeçalho com Logo */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center">
            {reportData.logoImage ? (
              <Image
                src={reportData.logoImage || "/placeholder.svg"}
                alt="Logo da empresa"
                width={150}
                height={60}
                className="object-contain max-h-16"
              />
            ) : (
              <div className="w-[150px] h-[60px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                Logo não definido
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">LAUDO EXTRAJUDICIAL</p>
            <p className="text-xs">Data: {currentDate}</p>
            <p className="text-xs">Ref: {reportData.reference || "N/A"}</p>
          </div>
        </div>

        {/* Informações do Caso */}
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-4">LAUDO EXTRAJUDICIAL</h1>
          <h2 className="text-lg font-bold mb-2">1. IDENTIFICAÇÃO DO CASO</h2>
          <p>
            <strong>Processo:</strong> {reportData.process || "N/A"}
          </p>
          <p>
            <strong>Partes:</strong> {reportData.parties || "N/A"}
          </p>
          <p>
            <strong>Objeto:</strong> {reportData.object || "N/A"}
          </p>
        </div>

        {/* Objetivo */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">2. OBJETIVO</h2>
          <p>{reportData.objective || "Realizar perícia extrajudicial para avaliação técnica do objeto em questão."}</p>
        </div>

        {/* Metodologia */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">3. METODOLOGIA</h2>
          <p>
            {reportData.methodology ||
              "A perícia foi realizada através de análise documental, vistorias in loco e aplicação de métodos técnicos específicos para o caso."}
          </p>
        </div>

        {/* Análise */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">4. ANÁLISE TÉCNICA</h2>
          <h3 className="text-md font-bold mb-1">4.1. Aspectos Técnicos</h3>
          <p>{reportData.technical || "Os aspectos técnicos foram avaliados conforme normas aplicáveis."}</p>

          <h3 className="text-md font-bold mb-1 mt-2">4.2. Documentação</h3>
          <p>{reportData.documentation || "A documentação apresentada foi analisada e considerada suficiente."}</p>

          <h3 className="text-md font-bold mb-1 mt-2">4.3. Constatações</h3>
          <p>{reportData.findings || "Foram constatados os seguintes aspectos relevantes para o caso em análise..."}</p>
        </div>

        {/* Imagem de Localização */}
        {reportData.locationImage && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">5. DOCUMENTAÇÃO VISUAL</h2>
            <div className="border p-1 inline-block">
              <Image
                src={reportData.locationImage || "/placeholder.svg"}
                alt="Imagem relevante"
                width={500}
                height={300}
                className="object-cover"
              />
            </div>
            <p className="text-xs mt-1">Figura 1: Documentação visual relevante para o caso.</p>
          </div>
        )}

        {/* Conclusão */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">6. CONCLUSÃO</h2>
          <p>{reportData.conclusion || "Com base na análise técnica realizada, conclui-se que..."}</p>
        </div>

        {/* Assinatura */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center">
            <p className="mb-8">____________________________________</p>
            <p className="font-bold">{reportData.expert || "Perito Responsável"}</p>
            <p>{reportData.registration || "Registro Profissional 000000"}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderReport = () => {
    switch (reportType) {
      case "cautelar":
        return renderCautelarReport()
      case "contabil":
        return renderContabilReport()
      case "extrajudicial":
        return renderExtrajudicialReport()
      default:
        return renderCautelarReport()
    }
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="glass tabs-list backdrop-blur-md border border-white/10">
            <TabsTrigger value="preview" className="tab-trigger">
              Pré-visualização
            </TabsTrigger>
            <TabsTrigger value="print" className="tab-trigger">
              Impressão
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Exportar Word
            </Button>
          </div>
        </div>
        <TabsContent value="preview" className="mt-0">
          <div className="bg-gray-100 p-4 rounded-md">{renderReport()}</div>
        </TabsContent>
        <TabsContent value="print" className="mt-0">
          <div className="bg-gray-100 p-4 rounded-md">{renderReport()}</div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
