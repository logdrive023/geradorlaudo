"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Palette, Bell, Shield } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Configurações"
        text="Gerencie suas preferências e configurações da conta"
        className="dashboard-header"
      >
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </DashboardHeader>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 gap-4 bg-transparent">
          <TabsTrigger value="profile" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Palette className="mr-2 h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Shield className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-blue-500">Informações Pessoais</CardTitle>
              <CardDescription>Atualize suas informações pessoais e profissionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" defaultValue="Engenheiro Demo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="engenheiro@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profession">Profissão</Label>
                  <Input id="profession" defaultValue="Engenheiro Civil" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration">Registro profissional</Label>
                  <Input id="registration" defaultValue="CREA: 5070574267" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Salvar alterações
              </Button>
            </CardFooter>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-blue-500">Informações de Contato</CardTitle>
              <CardDescription>Atualize suas informações de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="(11) 98765-4321" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" defaultValue="Av. Paulista, 1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" defaultValue="São Paulo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" defaultValue="SP" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Salvar alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-blue-500">Tema</CardTitle>
              <CardDescription>Personalize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Modo escuro</Label>
                    <p className="text-sm text-muted-foreground">Ative o modo escuro para reduzir o cansaço visual</p>
                  </div>
                  <Switch id="dark-mode" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="high-contrast">Alto contraste</Label>
                    <p className="text-sm text-muted-foreground">Aumenta o contraste para melhor legibilidade</p>
                  </div>
                  <Switch id="high-contrast" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="animations">Animações</Label>
                    <p className="text-sm text-muted-foreground">Ativa ou desativa animações da interface</p>
                  </div>
                  <Switch id="animations" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-blue-500">Layout</CardTitle>
              <CardDescription>Personalize o layout do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-mode">Modo compacto</Label>
                    <p className="text-sm text-muted-foreground">Reduz o espaçamento entre elementos</p>
                  </div>
                  <Switch id="compact-mode" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sidebar">Barra lateral fixa</Label>
                    <p className="text-sm text-muted-foreground">Mantém a barra lateral sempre visível</p>
                  </div>
                  <Switch id="sidebar" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-blue-500">Preferências de Notificação</CardTitle>
              <CardDescription>Configure como deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notificações por email</Label>
                    <p className="text-sm text-muted-foreground">Receba atualizações sobre seus laudos por email</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Notificações push</Label>
                    <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
                  </div>
                  <Switch id="push-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="deadline-reminders">Lembretes de prazos</Label>
                    <p className="text-sm text-muted-foreground">Receba lembretes sobre prazos de entrega</p>
                  </div>
                  <Switch id="deadline-reminders" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-blue-500">Segurança da Conta</CardTitle>
              <CardDescription>Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha atual</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Atualizar senha
              </Button>
            </CardFooter>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-blue-500">Autenticação de dois fatores</CardTitle>
              <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor">Ativar autenticação de dois fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Proteja sua conta com um código adicional enviado ao seu celular
                    </p>
                  </div>
                  <Switch id="two-factor" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Configurar autenticação de dois fatores</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
