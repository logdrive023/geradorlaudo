"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"

interface ProfessionalLoadingProps {
  message?: string
  duration?: number
  onComplete?: () => void
}

export function ProfessionalLoading({
  message = "Carregando...",
  duration = 1500,
  onComplete,
}: ProfessionalLoadingProps) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const startTime = Date.now()
    const endTime = startTime + duration

    const updateProgress = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const newProgress = Math.min(Math.floor((elapsed / duration) * 100), 100)

      setProgress(newProgress)

      if (now < endTime) {
        requestAnimationFrame(updateProgress)
      } else {
        // Adicionar um pequeno atraso antes de chamar onComplete
        setTimeout(() => {
          setVisible(false)
          if (onComplete) {
            setTimeout(onComplete, 300) // Dar tempo para a animação de fade-out
          }
        }, 200)
      }
    }

    requestAnimationFrame(updateProgress)

    return () => {
      // Cleanup
    }
  }, [duration, onComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center fade-in">
      <div className="bg-card border rounded-lg shadow-lg p-6 max-w-md w-full mx-4 scale-in">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="loading-spinner"></div>
          </div>

          <h3 className="text-lg font-medium text-center">{message}</h3>

          <Progress value={progress} className="h-2" />

          <p className="text-sm text-muted-foreground text-center">
            {progress < 100 ? "Por favor, aguarde..." : "Concluído!"}
          </p>
        </div>
      </div>
    </div>
  )
}
