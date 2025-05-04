"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { LocationImageUploader } from "@/components/location-image-uploader"

interface LiveWordEditorProps {
  reportData: {
    title: string
    address: string
    occupant: string
    inspector: string
    usage: string
    age: string
    buildingType: string
    conservationState: string
    constructionStandard: string
    observations: string
    date: string
    technicalInfo: string
    engineer: string
    registration: string
    locationImage?: string
  }
  onReportDataChange: (reportData: LiveWordEditorProps["reportData"]) => void
}

export function LiveWordEditor({ reportData, onReportDataChange }: LiveWordEditorProps) {
  const [activeTab, setActiveTab] = useState("page1")
  const [localData, setLocalData] = useState(reportData)

  useEffect(() => {
    setLocalData(reportData)
  }, [reportData])

  const handleChange = (field: string, value: string) => {
    const newData = {
      ...localData,
      [field]: value,
    }
    setLocalData(newData)
    onReportDataChange(newData)
  }

  const handleLocationImageUpload = (imageUrl: string) => {
    handleChange("locationImage", imageUrl)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="page1">Página 1</TabsTrigger>
            <TabsTrigger value="page2">Página 2</TabsTrigger>
            <TabsTrigger value="page3">Página 3</TabsTrigger>
          </TabsList>

          <TabsContent value="page1" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título do Laudo</label>
              <Input value={localData.title} onChange={(e) => handleChange("title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Endereço</label>
              <Input value={localData.address} onChange={(e) => handleChange("address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagem de Localização</label>
              <div className="border rounded-md overflow-hidden bg-muted h-[200px]">
                <LocationImageUploader
                  currentImage={localData.locationImage || null}
                  onImageUpload={handleLocationImageUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Clique na área acima para fazer upload de uma imagem de localização do imóvel.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="page2" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ocupante / Telefone</label>
              <Input value={localData.occupant} onChange={(e) => handleChange("occupant", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Vistoriador</label>
              <Input value={localData.inspector} onChange={(e) => handleChange("inspector", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Uso do Imóvel</label>
                <Input value={localData.usage} onChange={(e) => handleChange("usage", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Idade real ou estimada</label>
                <Input value={localData.age} onChange={(e) => handleChange("age", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de edificação</label>
                <Input value={localData.buildingType} onChange={(e) => handleChange("buildingType", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado de conservação</label>
                <Input
                  value={localData.conservationState}
                  onChange={(e) => handleChange("conservationState", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Padrão construtivo</label>
              <Input
                value={localData.constructionStandard}
                onChange={(e) => handleChange("constructionStandard", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações gerais</label>
              <Input value={localData.observations} onChange={(e) => handleChange("observations", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data da Diligência</label>
              <Input value={localData.date} onChange={(e) => handleChange("date", e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="page3" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Informações técnicas</label>
              <Textarea
                value={localData.technicalInfo}
                onChange={(e) => handleChange("technicalInfo", e.target.value)}
                rows={12}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Engenheiro Responsável</label>
                <Input value={localData.engineer} onChange={(e) => handleChange("engineer", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Registro (CREA)</label>
                <Input value={localData.registration} onChange={(e) => handleChange("registration", e.target.value)} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Visualização em tempo real */}
      <div className="hidden lg:block">
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-white p-6 min-h-[500px] w-full word-page">
              {activeTab === "page1" && (
                <>
                  {/* Cabeçalho */}
                  <div className="text-center mb-4 pb-4 border-b">
                    <p className="text-xs mb-1">
                      Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386
                    </p>
                  </div>

                  {/* Título */}
                  <div className="text-center mb-8">
                    <h1 className="text-xl font-bold uppercase">{localData.title}</h1>
                  </div>

                  {/* Imagem de localização */}
                  <div className="flex-grow flex items-center justify-center">
                    <div className="w-full max-w-md aspect-video bg-gray-100 flex items-center justify-center">
                      {localData.locationImage ? (
                        <img
                          src={localData.locationImage || "/placeholder.svg"}
                          alt="Localização do imóvel"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <p className="text-gray-500">Imagem de Localização</p>
                      )}
                    </div>
                  </div>

                  {/* Legenda da imagem */}
                  <div className="text-center mt-4">
                    <p className="text-sm">Localização esquemática do imóvel</p>
                  </div>
                </>
              )}

              {activeTab === "page2" && (
                <>
                  {/* Cabeçalho */}
                  <div className="text-center mb-4 pb-4 border-b">
                    <p className="text-xs mb-1">
                      Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386
                    </p>
                  </div>

                  {/* Conteúdo */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Ficha com dados da construção e seus ocupantes:</h2>
                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">Ocupante / telefone:</span> {localData.occupant}
                      </p>
                      <p>
                        <span className="font-semibold">Vistoriador:</span> {localData.inspector}
                      </p>
                      <p>
                        <span className="font-semibold">Uso do Imóvel:</span> {localData.usage}
                      </p>
                      <p>
                        <span className="font-semibold">Idade real ou estimada / aparente:</span> {localData.age}
                      </p>
                      <p>
                        <span className="font-semibold">Tipo de edificação:</span> {localData.buildingType}
                      </p>
                      <p>
                        <span className="font-semibold">Estado de conservação:</span> {localData.conservationState}
                      </p>
                      <p>
                        <span className="font-semibold">Padrão construtivo:</span> {localData.constructionStandard}
                      </p>
                    </div>

                    <p className="mt-4">
                      <span className="font-semibold">Observações gerais:</span> {localData.observations}
                    </p>

                    <p className="mt-4">
                      <span className="font-semibold">Data da Diligência:</span> {localData.date}
                    </p>
                  </div>
                </>
              )}

              {activeTab === "page3" && (
                <>
                  {/* Cabeçalho */}
                  <div className="text-center mb-4 pb-4 border-b">
                    <p className="text-xs mb-1">
                      Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386
                    </p>
                  </div>

                  {/* Conteúdo */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Informações técnicas</h2>
                    <div className="whitespace-pre-line">{localData.technicalInfo}</div>
                  </div>

                  {/* Assinatura */}
                  <div className="mt-auto pt-8 text-center">
                    <p>{localData.engineer}</p>
                    <p>{localData.registration}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
