import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Sparkles, ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0f172a] to-[#1e1e38]">
      {/* Header futurista */}
      <header className="header-futuristic sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 text-xl">
            <div className="relative">
              <FileText className="h-6 w-6 text-white opacity-80" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-blue-300" />
            </div>
            <span className="logo-futuristic">LaudoTech</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <FileText className="h-12 w-12 text-indigo-400" />
                <Sparkles className="h-5 w-5 absolute -top-1 -right-1 text-blue-300" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white text-glow">Criar uma conta</h1>
            <p className="text-sm text-blue-100/70">Preencha os dados abaixo para criar sua conta</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-white">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  type="text"
                  autoCapitalize="words"
                  autoComplete="name"
                  autoCorrect="off"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="nome@exemplo.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-white">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-white">
                  Confirmar senha
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                Criar conta
              </Button>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-blue-100/70">Já tem uma conta?</span>{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
