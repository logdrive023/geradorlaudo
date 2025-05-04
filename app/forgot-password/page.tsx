"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Sparkles, ArrowLeft, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      // Simulação de envio de email de recuperação
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsSubmitted(true)
    } catch (err) {
      console.error("Erro ao enviar email de recuperação:", err)
      setError("Ocorreu um erro ao enviar o email de recuperação. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
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
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para login
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
            <h1 className="text-2xl font-semibold tracking-tight text-white text-glow">Recuperar senha</h1>
            <p className="text-sm text-blue-100 auth-subtitle">
              Digite seu e-mail para receber instruções de recuperação de senha
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/30">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border border-white/10 bg-[#131b2e] p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Recuperar senha</h3>

            {isSubmitted ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
                <h2 className="text-xl font-medium text-white">Email enviado!</h2>
                <p className="text-blue-100/90">
                  Enviamos instruções para recuperar sua senha para o email informado. Verifique sua caixa de entrada.
                </p>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white mt-4"
                >
                  <Link href="/login">Voltar para login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white">
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
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                >
                  {isSubmitting ? "Enviando..." : "Enviar instruções"}
                </Button>
              </form>
            )}
          </div>

          <div className="text-center text-sm">
            <span className="text-blue-100/70">Lembrou sua senha?</span>{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
