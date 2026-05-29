# SGO-Fuel · Aether IA

**Ecossistema Inteligente de Gestão de Abastecimento**
Hardware IoT de baixo custo + Visão Computacional para prevenção ativa de fraudes de combustível em frotas e pátios.

> Demonstração interativa do produto. Sem backend nesta fase — todas as telas usam dados simulados para apresentação ao cliente.

## Telas disponíveis

| Rota | Descrição |
|------|-----------|
| `/` | Pitch / landing com desafio, solução, comparativo e ROI |
| `/dashboard` | Portal do Gestor (KPIs, eventos, conciliação, ranking) |
| `/anomalias` | Alertas em vídeo dos bloqueios da IA |
| `/conciliacao` | Cruzamento XML SEFAZ × saída efetiva por tanque |
| `/ranking` | Ranking de motoristas por km/L e anomalias |
| `/totem` | Mockup do hardware IoT instalado na bomba |
| `/pos` | Mockup do Smart POS (Pax / Gertec) |
| `/motorista` | Mockup do app do motorista |

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript
- lucide-react

## Rodando local

```bash
npm install
npm run dev
```

Abrir em http://localhost:3000.

## Deploy

Projeto vinculado à Vercel como projeto **separado** do `ia-super-terminais`.
Cada push em `main` redeploya automaticamente em https://sgo-fuel.vercel.app.

## Plano de ativação real

Demo → produto: ver [`PLANO_EXECUCAO.md`](./PLANO_EXECUCAO.md).
Cobre backend (Next.js + Supabase), Postgres multi-tenant, IoT em Raspberry Pi 5, ALPR + classificador anti-balde, PWA motorista, Smart POS (Kotlin), conciliação SEFAZ, segurança/LGPD, roadmap em 2 fases e orçamento.

## Bloco A1 — Banco e auth ativos (concluído)

- Cliente Supabase (browser + server + middleware) configurado
- Auth real: `/login`, `/cadastro`, `/auth/logout`
- Rotas protegidas: `/dashboard`, `/anomalias`, `/conciliacao`, `/ranking`, `/cadastros`
- Schema completo em [`supabase/schema.sql`](./supabase/schema.sql) — multi-tenant, RLS, trigger que torna o criador OWNER
- `/cadastros/empresa` cria/edita o tenant
- Banner no dashboard mostra contadores reais do banco e link pra cadastros

### Como ativar do zero
1. Abrir o SQL Editor do Supabase: <https://supabase.com/dashboard/project/jozeyczhxdcfvtvumiph/sql/new>
2. Colar todo o conteúdo de `supabase/schema.sql` e clicar em **Run**
3. Em Authentication → URL Configuration, definir **Site URL** = `https://sgo-fuel.vercel.app` e adicionar `http://localhost:3000` em Additional Redirect URLs
4. (Opcional) Em Authentication → Email Auth, desligar "Confirm email" para teste mais rápido — pode ligar depois
5. Em `https://sgo-fuel.vercel.app/cadastro` criar a primeira conta

## Variáveis de ambiente

Em produção (já configuradas na Vercel via CLI):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Em local, copiar `.env.example` para `.env.local` e preencher os mesmos valores.
