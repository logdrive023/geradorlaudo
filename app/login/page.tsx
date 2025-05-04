"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Sparkles, ArrowLeft } from "lucide-react"
import { useAuth, DEFAULT_USER } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState(DEFAULT_USER.email) // Pré-preenchido para facilitar o teste
  const [password, setPassword] = useState(DEFAULT_USER.password) // Pré-preenchido para facilitar o teste
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()
  const router = useRouter()

  // Adicionar um estado para rastrear quando o login está sendo processado
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Atualizar a função handleSubmit para melhor tratamento de erros
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const success = await login(email, password)

      if (!success) {
        setError("Email ou senha inválidos. Use as credenciais padrão mostradas abaixo.")
      }
      // O redirecionamento é feito dentro da função login
    } catch (err) {
      console.error("Erro de login:", err)
      setError("Ocorreu um erro ao fazer login. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função para lidar com o esquecimento de senha
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/forgot-password")
  }

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
            <h1 className="text-2xl font-semibold tracking-tight text-white text-glow">Entrar na sua conta</h1>
            <p className="text-sm text-blue-100 auth-subtitle">Digite seu e-mail e senha para acessar sua conta</p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/30">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white auth-label">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="nome@exemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white auth-label">
                    Senha
                  </Label>
                  <button
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline auth-link"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              {/* Atualizar o botão de login para mostrar o estado correto */}
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {isLoading || isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>

          <div className="text-center text-sm">
            <span className="text-blue-100/70">Não tem uma conta?</span>{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline auth-link"
            >
              Cadastre-se
            </Link>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4 credentials-box">
            <h3 className="font-medium mb-2 text-white credentials-title">Credenciais de Acesso Padrão</h3>
            <p className="text-sm mb-1 text-blue-100/70 credentials-text">
              <strong className="text-white">Email:</strong>{" "}
              <span className="credentials-value">{DEFAULT_USER.email}</span>
            </p>
            <p className="text-sm text-blue-100/70 credentials-text">
              <strong className="text-white">Senha:</strong>{" "}
              <span className="credentials-value">{DEFAULT_USER.password}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
