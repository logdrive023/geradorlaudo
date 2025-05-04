"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LocationImageUploaderProps {
  currentImage: string | null
  onImageUpload: (imageUrl: string) => void
  className?: string
}

export function LocationImageUploader({ currentImage, onImageUpload, className = "" }: LocationImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage)
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
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        processFile(file)
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        // Redimensionar a imagem antes de salvá-la
        const img = new Image()
        img.onload = () => {
          // Criar um canvas para redimensionar a imagem
          const canvas = document.createElement("canvas")
          // Definir dimensões fixas para manter a consistência
          const maxWidth = 800
          const maxHeight = 600

          // Calcular as dimensões mantendo a proporção
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }

          canvas.width = width
          canvas.height = height

          // Desenhar a imagem redimensionada
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            // Converter para formato JPEG com qualidade 0.9 para reduzir o tamanho
            const imageUrl = canvas.toDataURL("image/jpeg", 0.9)
            setPreviewImage(imageUrl)
            onImageUpload(imageUrl)
          }
        }
        img.src = e.target.result as string
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewImage(null)
    onImageUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-label="Upload de imagem de localização"
      />

      {previewImage ? (
        <div className="relative w-full h-full">
          <img
            src={previewImage || "/placeholder.svg"}
            alt="Localização do imóvel"
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90 transition-colors"
            aria-label="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-md transition-colors cursor-pointer
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
            }`}
        >
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Camera className="h-10 w-10 mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Imagem de Localização</p>
            <p className="text-xs text-muted-foreground mb-2">Clique ou arraste uma imagem aqui</p>
            <Button type="button" variant="outline" size="sm" className="mt-2">
              <Upload className="h-3 w-3 mr-1" />
              Selecionar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
