import { FileText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ size = "md", text, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <FileText className={cn("animate-pulse text-primary", sizeClasses.lg)} />
            <Sparkles className="absolute -top-1 -right-1 text-blue-400 animate-bounce w-4 h-4" />
          </div>
          <div className="h-1.5 w-32 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient rounded-full"></div>
          </div>
          {text && <p className="text-white font-medium">{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="relative">
        <FileText className={cn("animate-pulse text-primary", sizeClasses[size])} />
        <Sparkles className="absolute -top-1 -right-1 text-blue-400 animate-bounce w-3 h-3" />
      </div>
      {text && <p className={cn("text-muted-foreground", textSizeClasses[size])}>{text}</p>}
    </div>
  )
}
