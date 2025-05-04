"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send } from "lucide-react"

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const [status, setStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({
    type: null,
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulação de envio - em produção, substituir por uma chamada real à API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Limpar o formulário após envio bem-sucedido
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      })

      setStatus({
        type: "success",
        message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
      })

      // Limpar a mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setStatus({
          type: null,
          message: "",
        })
      }, 5000)
    } catch (error) {
      setStatus({
        type: "error",
        message: "Erro ao enviar mensagem. Por favor, tente novamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold mb-4 text-white">Envie uma mensagem</h3>

      {status.type && (
        <Alert variant={status.type === "error" ? "destructive" : "default"} className="bg-white/10 border-white/20">
          <AlertDescription className="text-white">{status.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="name" className="text-white">
          Nome completo
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Seu nome completo"
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email" className="text-white">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="seu.email@exemplo.com"
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone" className="text-white">
          Telefone
        </Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message" className="text-white">
          Mensagem
        </Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Como podemos ajudar?"
          rows={4}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          "Enviando..."
        ) : (
          <>
            Enviar mensagem
            <Send className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
