import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, ImageIcon, Upload, Download, Mail, Phone, MapPin, Sparkles } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="header-futuristic sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 text-xl">
            <div className="relative">
              <FileText className="h-6 w-6 text-white opacity-80" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-blue-300" />
            </div>
            <span className="logo-futuristic">LaudoTech</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="btn-login">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button className="btn-register">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="hero-futuristic w-full py-16 md:py-24 lg:py-32">
          <div className="hero-grid"></div>
          <div className="container px-4 md:px-6 hero-content">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
                    Crie laudos técnicos <span className="text-gradient">profissionais</span> em minutos
                  </h1>
                  <p className="text-blue-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-medium">
                    Plataforma completa para engenheiros criarem, editarem e exportarem laudos técnicos com facilidade.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="btn-register gap-1.5">
                      Começar agora
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline" className="btn-login">
                      Ver demonstração
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[500px] aspect-video overflow-hidden rounded-xl bg-background/10 shadow-lg border border-white/10 backdrop-blur-sm">
                <img
                  src="/placeholder.svg?key=igohu"
                  alt="Interface futurista de laudo técnico"
                  width={800}
                  height={500}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-[#0f172a] to-[#1e1e38]">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white text-glow">
                  Recursos <span className="text-gradient">avançados</span>
                </h2>
                <p className="max-w-[700px] text-blue-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-medium">
                  Tudo o que você precisa para criar laudos técnicos profissionais
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="rounded-full bg-indigo-500/20 p-3">
                  <Upload className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Upload em massa</h3>
                <p className="text-center text-blue-100 font-medium">
                  Faça upload de mais de 100 fotos por laudo com facilidade
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="rounded-full bg-indigo-500/20 p-3">
                  <ImageIcon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Layout automático</h3>
                <p className="text-center text-blue-100 font-medium">
                  Organize suas fotos automaticamente com 2 por página
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="rounded-full bg-indigo-500/20 p-3">
                  <Download className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Exportação profissional</h3>
                <p className="text-center text-blue-100 font-medium">
                  Exporte seus laudos em PDF ou Word com layout profissional
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nova seção de contato */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-[#1e1e38] to-[#0f172a]">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white text-glow">
                  Entre em <span className="text-gradient">contato</span>
                </h2>
                <p className="max-w-[700px] text-blue-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-medium">
                  Estamos à disposição para ajudar com suas dúvidas e necessidades
                </p>
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              <div className="flex flex-col justify-center space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-indigo-500/20 p-3">
                    <Phone className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Telefone</h3>
                    <p className="text-blue-100 font-medium">(11) 97413-4386</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-indigo-500/20 p-3">
                    <Mail className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Email</h3>
                    <p className="text-blue-100 font-medium">contato@laudotech.com.br</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-indigo-500/20 p-3">
                    <MapPin className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Endereço</h3>
                    <p className="text-blue-100 font-medium">Rua Fernão Albernaz 332 - apto 14</p>
                    <p className="text-blue-100 font-medium">Vila Nova Savoia - São Paulo/SP</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm text-white shadow-lg">
                <div className="p-6">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 py-6 md:py-8 bg-[#0f172a]">
        <div className="container flex flex-col items-center justify-center gap-4 px-4 md:px-6 md:flex-row">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-100/80">© 2025 LaudoTech. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
