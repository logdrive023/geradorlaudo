"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface LocationImageUploaderProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string
}

export function LocationImageUploader({ onImageUpload, currentImage }: LocationImageUploaderProps) {
  const [image, setImage] = useState<string | null>(currentImage || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar com props quando elas mudarem
  useEffect(() => {
    if (currentImage) {
      setImage(currentImage)
    }
  }, [currentImage])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setImage(imageUrl)
      onImageUpload(imageUrl)
      setIsUploading(false)
    }
    reader.onerror = () => {
      console.error("Erro ao ler o arquivo")
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImage(null)
    onImageUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-label="Upload de imagem de localização"
      />

      {image ? (
        <div className="relative rounded-md overflow-hidden border border-border">
          <div className="relative aspect-video w-full">
            <Image
              src={image || "/placeholder.svg"}
              alt="Imagem de localização"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remover imagem</span>
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover:bg-secondary/10 transition-colors"
          onClick={handleButtonClick}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Clique para fazer upload da imagem de localização</p>
            <p className="text-xs text-muted-foreground">Suporta JPG, PNG, GIF até 10MB</p>
          </div>
        </div>
      )}

      {isUploading && <p className="text-sm text-muted-foreground">Carregando imagem...</p>}
    </div>
  )
}
