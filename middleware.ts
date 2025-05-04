import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Definir quais caminhos são públicos (não requerem autenticação)
  const isPublicPath = path === "/login" || path === "/register" || path === "/"

  // Verificar se o usuário está autenticado - verificar o cookie 'user'
  const isAuthenticated = request.cookies.has("user")

  // Redirecionar usuários não autenticados para o login
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirecionar usuários autenticados para o dashboard se tentarem acessar login/registro
  if (isPublicPath && isAuthenticated && path !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configurar em quais caminhos o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts, /images (static files)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!api|_next|fonts|images|favicon.ico|sitemap.xml).*)",
  ],
}
