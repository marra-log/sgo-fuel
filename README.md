# SGO-Fuel · Aether IA

**Ecossistema Inteligente de Gestão de Abastecimento**
Hardware IoT de baixo custo + Visão Computacional para prevenção ativa de fraudes de combustível em frotas e pátios.

> **Fase A concluída** — produto web funcional com banco real (Supabase), auth, CRUDs, eventos persistidos, conciliação SEFAZ, ranking, PWA do motorista e auditoria. Tudo em free tier. Hardware/IoT (Fase B) entra depois.

## Telas — funcionais (lêem/escrevem o banco)

| Rota | Descrição | Auth |
|------|-----------|------|
| `/` | Pitch / landing (vitrine comercial) | público |
| `/login`, `/cadastro` | Auth de gestor (Supabase) | público |
| `/dashboard` | Portal do Gestor — KPIs, eventos, ranking reais | protegido |
| `/cadastros` | Hub: empresa, motoristas, veículos, pátios, tanques, bombas | protegido |
| `/simular` | Gera abastecimentos/anomalias reais (substitui o Totem até a Fase B) | protegido |
| `/anomalias` | Anomalias reais + resolver | protegido |
| `/conciliacao` | Upload de XML de NFe + cruzamento entrada × saída por tanque | protegido |
| `/ranking` | Ranking de motoristas calculado do banco | protegido |
| `/auditoria` | Trilha de auditoria (trigger automático no banco) | protegido |
| `/app` | **PWA do motorista** — cota, check-in, histórico (instalável) | login próprio |
| `/diagnostico` | Diagnóstico de sessão/empresa/RLS | protegido |

## Telas — vitrine comercial (estáticas)

| Rota | Descrição |
|------|-----------|
| `/totem` | Mockup do hardware IoT na bomba |
| `/pos` | Mockup do Smart POS (Pax / Gertec) |
| `/motorista` | Mockup-vitrine do app do motorista |

## Módulo de pagamento (cartão + maquininha)

Modelo private label fechado + identificação NFC, máquina como app em terminal de adquirente.
Plano completo (passo a passo + custos + regulatório): [`MODELO_PAGAMENTO.md`](./MODELO_PAGAMENTO.md).

| Rota | Descrição | Auth |
|------|-----------|------|
| `/cartoes` | Emitir/bloquear cartões de frota (cota mensal, PIN, vínculo) | protegido |
| `/cartoes/[id]` | Cota usada × restante + histórico de transações | protegido |
| `/maquininha` | Terminal POS simulado: valida cartão e autoriza/nega | protegido |

## Banco de dados

Schema em [`supabase/schema.sql`](./supabase/schema.sql) (rodar primeiro).
Auditoria automática em [`supabase/audit.sql`](./supabase/audit.sql) (rodar depois, opcional).
Cartão + transações em [`supabase/cards.sql`](./supabase/cards.sql) (rodar para o módulo de pagamento).
Multi-tenant isolado por Row-Level Security — cada empresa só enxerga seus dados.

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
