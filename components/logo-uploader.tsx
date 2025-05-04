"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"

interface LogoUploaderProps {
  currentLogo?: string
  onLogoUpload: (logoUrl: string) => void
}

export function LogoUploader({ currentLogo, onLogoUpload }: LogoUploaderProps) {
  const [logoUrl, setLogoUrl] = useState<string>(currentLogo || "")
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar com props externas
  useEffect(() => {
    if (currentLogo) {
      setLogoUrl(currentLogo)
    }
  }, [currentLogo])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    // Usar FileReader para ler o arquivo como URL de dados
    const reader = new FileReader()

    reader.onload = () => {
      // Verificar se o resultado é uma string
      if (typeof reader.result === "string") {
        const base64Url = reader.result
        console.log("Logo carregado com sucesso, tamanho:", base64Url.length)
        setLogoUrl(base64Url)

        // Garantir que o callback seja chamado com o URL correto
        onLogoUpload(base64Url)

        // Simular um pequeno atraso para mostrar o loading
        setTimeout(() => {
          setIsLoading(false)
        }, 500)
      }
    }

    reader.onerror = () => {
      console.error("Erro ao ler o arquivo")
      setIsLoading(false)
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        <label className="text-sm font-medium">Logo Personalizada</label>

        <div className="border rounded-md p-4 w-full max-w-xs bg-muted/20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner size="md" text="Carregando logo..." />
            </div>
          ) : logoUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="max-h-[150px] max-w-full object-contain" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLogoUrl("")
                  onLogoUpload("")
                }}
              >
                Remover Logo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-muted-foreground">Nenhuma logo adicionada</p>
              <label className="cursor-pointer">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    if (fileInputRef.current) {
                      fileInputRef.current.click()
                    }
                  }}
                >
                  Selecionar Logo
                </Button>
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
