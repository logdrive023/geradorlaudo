"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface LogoUploaderProps {
  onLogoUpload: (logoUrl: string) => void
  currentLogo?: string
}

export function LogoUploader({ onLogoUpload, currentLogo }: LogoUploaderProps) {
  const [logo, setLogo] = useState<string | null>(currentLogo || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar com props quando elas mudarem
  useEffect(() => {
    if (currentLogo) {
      setLogo(currentLogo)
    }
  }, [currentLogo])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string
      setLogo(logoUrl)
      onLogoUpload(logoUrl)
      setIsUploading(false)
    }
    reader.onerror = () => {
      console.error("Erro ao ler o arquivo")
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogo(null)
    onLogoUpload("")
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
        aria-label="Upload de logo personalizada"
      />

      {logo ? (
        <div className="relative rounded-md overflow-hidden border border-border">
          <div className="relative aspect-video w-full">
            <Image
              src={logo || "/placeholder.svg"}
              alt="Logo personalizada"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleRemoveLogo}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remover logo</span>
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover:bg-secondary/10 transition-colors"
          onClick={handleButtonClick}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Clique para fazer upload da logo personalizada</p>
            <p className="text-xs text-muted-foreground">Suporta JPG, PNG, GIF até 10MB</p>
          </div>
        </div>
      )}

      {isUploading && <p className="text-sm text-muted-foreground">Carregando logo...</p>}
    </div>
  )
}
