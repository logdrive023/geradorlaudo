"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Usuário padrão para acesso à plataforma
export const DEFAULT_USER = {
  id: "1",
  name: "Engenheiro Demo",
  email: "demo@laudotech.com",
  password: "senha123",
}

type User = {
  id: string
  name: string
  email: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar se o usuário está armazenado no localStorage
    const storedUser = localStorage.getItem("user")

    // Função para obter o valor de um cookie específico
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift()
      return undefined
    }

    // Verificar se existe um cookie de usuário
    const userCookie = getCookie("user")

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)

        // Garantir que o cookie também esteja definido
        if (!userCookie) {
          document.cookie = `user=${storedUser}; path=/; max-age=${60 * 60 * 24 * 7}`
        }
      } catch (error) {
        console.error("Erro ao analisar usuário do localStorage:", error)
        localStorage.removeItem("user")
      }
    } else if (userCookie) {
      try {
        const parsedUser = JSON.parse(userCookie)
        setUser(parsedUser)
        localStorage.setItem("user", userCookie)
      } catch (error) {
        console.error("Erro ao analisar usuário do cookie:", error)
        document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)

    // Simular um atraso de rede
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verificar se as credenciais correspondem ao usuário padrão
    if (email === DEFAULT_USER.email && password === DEFAULT_USER.password) {
      const loggedUser = {
        id: DEFAULT_USER.id,
        name: DEFAULT_USER.name,
        email: DEFAULT_USER.email,
      }

      // Armazenar o usuário no localStorage
      localStorage.setItem("user", JSON.stringify(loggedUser))

      // Definir um cookie para autenticação (usado pelo middleware)
      document.cookie = `user=${JSON.stringify(loggedUser)}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 dias

      setUser(loggedUser)
      setIsLoading(false)

      // Redirecionar para o dashboard
      router.push("/dashboard")
      return true
    }

    setIsLoading(false)
    return false
  }

  const logout = () => {
    localStorage.removeItem("user")
    // Remover o cookie definindo uma data de expiração no passado
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
