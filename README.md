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
Cobre backend (Next.js + tRPC + Prisma), Postgres multi-tenant, IoT em Raspberry Pi 5, ALPR + classificador anti-balde, app motorista (Expo), Smart POS (Kotlin), conciliação SEFAZ, segurança/LGPD, roadmap por sprint (12 semanas) e orçamento.
