import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/anomalias",
  "/conciliacao",
  "/ranking",
  "/cadastros",
  "/simular",
  "/diagnostico",
];

const PUBLIC_AUTH_ROUTES = ["/login", "/cadastro"];

/**
 * Casa o pathname com um prefixo de rota respeitando limites de segmento.
 * Evita que "/cadastros/empresa" seja confundido com a rota pública "/cadastro".
 */
function matchesRoute(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(base + "/");
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => matchesRoute(pathname, p));
  const isPublicAuth = PUBLIC_AUTH_ROUTES.some((p) => matchesRoute(pathname, p));

  // Redireciona não-autenticado em rota protegida → /login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Autenticado tentando entrar no /login → vai pro /dashboard
  if (isPublicAuth && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Matcher que ignora arquivos estáticos, imagens e a rota de API auth do Supabase.
     */
    "/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
