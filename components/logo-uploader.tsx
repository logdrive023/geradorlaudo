"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, ImageIcon } from "lucide-react"
import Image from "next/image"

interface LogoUploaderProps {
  onLogoUpload: (logoUrl: string) => void
  currentLogo?: string
}

export function LogoUploader({ onLogoUpload, currentLogo }: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogo || null)
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.match("image.*")) {
      alert("Por favor, selecione uma imagem válida.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === "string") {
        // Redimensionar a imagem antes de salvar
        resizeImage(e.target.result, (resizedImage) => {
          setLogoUrl(resizedImage)
          onLogoUpload(resizedImage)
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const resizeImage = (dataUrl: string, callback: (resizedImage: string) => void) => {
    const img = new Image()
    img.onload = () => {
      // Definir dimensões máximas para o logo
      const MAX_WIDTH = 200
      const MAX_HEIGHT = 80

      let width = img.width
      let height = img.height

      // Calcular proporção para redimensionamento
      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width))
        width = MAX_WIDTH
      }

      if (height > MAX_HEIGHT) {
        width = Math.round(width * (MAX_HEIGHT / height))
        height = MAX_HEIGHT
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        callback(canvas.toDataURL("image/png"))
      } else {
        callback(dataUrl) // Fallback para a imagem original se não conseguir redimensionar
      }
    }
    img.src = dataUrl
  }

  const handleRemoveLogo = () => {
    setLogoUrl(null)
    onLogoUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="border border-dashed bg-background/50">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Logo da Empresa</div>
          <div className="text-xs text-muted-foreground">Faça upload do logo que aparecerá no cabeçalho do laudo</div>
        </div>

        {logoUrl ? (
          <div className="mt-4 relative">
            <div className="relative h-20 w-full flex items-center justify-center bg-muted/20 rounded-md overflow-hidden">
              <Image
                src={logoUrl || "/placeholder.svg"}
                alt="Logo da empresa"
                width={200}
                height={80}
                className="object-contain max-h-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                onClick={handleRemoveLogo}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover logo</span>
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`mt-4 flex flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center text-xs text-muted-foreground">
              <ImageIcon className="mb-2 h-8 w-8" />
              <div className="text-center">
                <p>Arraste e solte seu logo aqui ou</p>
                <p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    selecione um arquivo
                  </Button>
                </p>
              </div>
              <p className="mt-2 text-center text-[10px]">PNG, JPG ou GIF até 5MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
