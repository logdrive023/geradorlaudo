"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface PhotoUploaderProps {
  onUpload: (photos: { id: string; url: string; caption: string }[]) => void
}

export function PhotoUploader({ onUpload }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"))
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = () => {
    // Em uma aplicação real, você enviaria esses arquivos para seu serviço de armazenamento
    // Para este exemplo, criaremos URLs de objeto
    const uploadedPhotos = selectedFiles.map((file) => ({
      id: uuidv4(),
      url: URL.createObjectURL(file),
      caption: file.name.split(".")[0], // Usar o nome do arquivo como legenda inicial
    }))

    onUpload(uploadedPhotos)
    setSelectedFiles([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Fotos</CardTitle>
        <CardDescription>Arraste e solte ou selecione as fotos para o laudo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Arraste e solte suas fotos aqui ou</p>
          <Button type="button" variant="outline" onClick={handleUploadClick}>
            Selecionar Arquivos
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {selectedFiles.length} {selectedFiles.length === 1 ? "arquivo selecionado" : "arquivos selecionados"}
              </h3>
              <Button onClick={handleUpload} size="sm">
                Adicionar ao Laudo
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-md overflow-hidden bg-muted">
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt={file.name}
                      className="object-cover aspect-square w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs truncate mt-1">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
