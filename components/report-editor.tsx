"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { LocationImageUploader } from "@/components/location-image-uploader"
import { LogoUploader } from "@/components/logo-uploader"

interface ReportEditorProps {
  reportData: any
  onReportDataChange: (data: any) => void
}

export function ReportEditor({ reportData, onReportDataChange }: ReportEditorProps) {
  // Usar estado local para garantir que as imagens sejam mantidas
  const [localReportData, setLocalReportData] = useState(reportData)

  // Sincronizar com props quando elas mudarem
  useEffect(() => {
    setLocalReportData(reportData)
  }, [reportData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updatedData = {
      ...localReportData,
      [name]: value,
    }
    setLocalReportData(updatedData)
    onReportDataChange(updatedData)
  }

  const handleLocationImageUpload = (imageUrl: string) => {
    console.log("Imagem de localização recebida:", imageUrl.substring(0, 50) + "...")
    const updatedData = {
      ...localReportData,
      locationImage: imageUrl,
    }
    setLocalReportData(updatedData)
    onReportDataChange(updatedData)
  }

  const handleLogoUpload = (logoUrl: string) => {
    console.log("Logo personalizado recebido:", logoUrl.substring(0, 50) + "...")
    const updatedData = {
      ...localReportData,
      logoImage: logoUrl,
    }
    setLocalReportData(updatedData)
    onReportDataChange(updatedData)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Laudo</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Título do laudo"
                  value={localReportData.title || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Endereço completo"
                  value={localReportData.address || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupant">Ocupante / Telefone</Label>
                <Input
                  id="occupant"
                  name="occupant"
                  placeholder="Nome e telefone do ocupante"
                  value={localReportData.occupant || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspector">Vistoriador</Label>
                <Input
                  id="inspector"
                  name="inspector"
                  placeholder="Nome do vistoriador"
                  value={localReportData.inspector || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usage">Uso do Imóvel</Label>
                <Input
                  id="usage"
                  name="usage"
                  placeholder="Residencial, comercial, etc."
                  value={localReportData.usage || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Idade real ou estimada / aparente</Label>
                <Input
                  id="age"
                  name="age"
                  placeholder="Idade do imóvel"
                  value={localReportData.age || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingType">Tipo de edificação</Label>
                <Input
                  id="buildingType"
                  name="buildingType"
                  placeholder="Casa, apartamento, etc."
                  value={localReportData.buildingType || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data da Diligência</Label>
                <Input
                  id="date"
                  name="date"
                  placeholder="DD/MM/AAAA"
                  value={localReportData.date || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="conservationState">Estado de conservação</Label>
                <Input
                  id="conservationState"
                  name="conservationState"
                  placeholder="Bom, regular, ruim, etc."
                  value={localReportData.conservationState || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="constructionStandard">Padrão construtivo</Label>
                <Input
                  id="constructionStandard"
                  name="constructionStandard"
                  placeholder="Alto, médio, baixo, etc."
                  value={localReportData.constructionStandard || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações gerais</Label>
                <Textarea
                  id="observations"
                  name="observations"
                  placeholder="Observações gerais sobre o imóvel"
                  value={localReportData.observations || ""}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="technicalInfo">Informações técnicas</Label>
                <Textarea
                  id="technicalInfo"
                  name="technicalInfo"
                  placeholder="Informações técnicas detalhadas"
                  value={localReportData.technicalInfo || ""}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineer">Engenheiro Responsável</Label>
                <Input
                  id="engineer"
                  name="engineer"
                  placeholder="Nome do engenheiro"
                  value={localReportData.engineer || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration">Registro Profissional</Label>
                <Input
                  id="registration"
                  name="registration"
                  placeholder="CREA, CAU, etc."
                  value={localReportData.registration || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Imagem de Localização</Label>
              <LocationImageUploader
                onImageUpload={handleLocationImageUpload}
                currentImage={localReportData.locationImage}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Logo Personalizada</Label>
              <LogoUploader onLogoUpload={handleLogoUpload} currentLogo={localReportData.logoImage} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
