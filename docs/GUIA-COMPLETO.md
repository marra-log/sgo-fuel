# SGO-Fuel — Guia completo (executar e testar)

App: https://sgo-fuel.vercel.app · Repo: marra-log/sgo-fuel

---

## 1) O que foi feito (resumo)

**Cartão pré-pago private label (fechado)** — o cartão branco NFC é só identificador; a regra e o saldo ficam no banco.
- Carteira em R$ por cartão (`balance_brl`), débito **atômico no servidor** (`fn_authorize_card`).
- 3 terminais consumindo o **mesmo saldo**: **Smart POS** (`/maquininha`), **Totem IoT** (`/totem`, modo Cartão/NFC + modo IA/placa) e **celular** (app do motorista `/app`).
- **Recarga**: por cartão (`/cartoes/[id]`) ou central por cartão/motorista (`/cartoes/recarga`); manual ou PIX.
- **Estorno/ajuste** de saldo com motivo (nunca deixa negativo).
- **Regras de uso por cartão**: limite por abastecimento (L), limite diário (R$), dias da semana e janela de horário — validadas na autorização.
- **1 cartão por motorista** (trava) + nome impresso automático.
- **Bloqueio/desbloqueio** na hora na lista de cartões.
- **PIN com hash** (bcrypt) + **bloqueio por 5 tentativas** (15 min).
- **Comprovante** com saldo anterior/atual + botão **Imprimir**.

**Gestão**
- **Transações** (`/transacoes`): extrato com filtros (busca, status, período) + KPIs + CSV.
- **Alertas** (`/alertas` + sino no header): saldo baixo, bloqueados, negadas 48h.
- **Carteira da frota** no dashboard: saldo, recargas, debitado, cartões ativos.
- **Auditoria** cobre cartões e recargas (`/auditoria`).
- **Faturamento** mensal (`/faturamento`) + **Conciliação SEFAZ** (`/conciliacao`).
- Módulos **Multas** (`/multas`) e **Vistoria** (`/vistoria`).
- **PIX automático**: estrutura pronta (webhook) — falta só conectar um PSP.
- **APK** da POS e do Totem: links prontos em `/instalar`.
- Menu lateral (drawer) por categorias, tema claro/escuro, responsivo.

---

## 2) Passo a passo — EXECUTAR (Supabase)

No **Supabase → SQL Editor**, rode os arquivos da pasta `supabase/` **nesta ordem** (todos idempotentes; pode repetir):

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `schema.sql` | tabelas base, RLS, multi-tenant |
| 2 | `cards.sql` | cartões + transações |
| 3 | `wallet.sql` | **saldo** + recargas + débito atômico |
| 4 | `rules.sql` | regras de uso + estorno |
| 5 | `pin.sql` | PIN com hash + bloqueio por tentativas |
| 6 | `pix.sql` | PIX automático (opcional) |
| 7 | `audit.sql` | auditoria — **rode por último** |
| — | `seed.sql` | (opcional) dados fictícios de demonstração |

> Se pular o `wallet.sql`, a tela `/cartoes` quebra (usa `balance_brl`). Os terminais avisam "rode wallet.sql".

### Variáveis de ambiente (Vercel → Settings → Environment Variables)
- Já configuradas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Só para PIX automático** (quando ligar o Asaas/Efí): `SUPABASE_SERVICE_ROLE_KEY` e `PIX_WEBHOOK_SECRET`.

---

## 3) Passo a passo — TESTAR cada coisa

**Login/cadastro** → `/login`. Crie a empresa em `/cadastros/empresa` se ainda não existir.

**1. Emitir cartão (1 por motorista)**
- `/cartoes` → **Emitir cartão** → escolha um **motorista** (titular preenche sozinho).
- Em **Regras de uso**, opcional: limite por abastecimento, limite diário, dias, horário. PIN opcional.
- Salvar. Tente vincular o **mesmo motorista** em outro cartão → deve **bloquear**.

**2. Recarregar saldo**
- `/cartoes/recarga` → busque por motorista/placa/cartão → selecione → **Adicionar saldo** (ex.: R$ 1.000).
- Em PIX: **Gerar QR** (cria cobrança pendente) e **Confirmar recarga**.

**3. Smart POS (cartão)** → `/maquininha`
- Cole o número (ou aproxime a tag NFC no Android) → litros/preço/PIN → **Autorizar e debitar**.
- Veja o comprovante com **saldo anterior → atual** e **Imprimir**.

**4. Totem IoT** → `/totem`
- Aba **Cartão/NFC**: mesmo fluxo da POS (debita saldo). Aba **IA/Placa**: showcase ALPR.

**5. Celular (NFC)** → `/app`
- Escolha o motorista → painel **Cartão private label** mostra o saldo → **Abastecer com saldo** (confirma por NFC).

**6. Regras de uso (teste de recusa)**
- No cartão, defina limite por abastecimento = 50 L. Na POS, tente 100 L → **negado** com o motivo.
- Defina horário 6h–7h e teste fora dele → **negado**.

**7. PIN + bloqueio**
- Cartão com PIN. Na POS, erre o PIN 5x → cartão **bloqueia por 15 min** ("PIN incorreto (x/5)" e depois bloqueado).
- Acerte o PIN → reseta o contador.

**8. Estorno**
- `/cartoes/[id]` → **Estornar / ajustar saldo** → valor + motivo → confirma. Histórico mostra **− vermelho**.

**9. Bloquear/desbloquear**
- `/cartoes` → ícone 🚫/🔓 na coluna Status muda na hora.

**10. Transações** → `/transacoes`
- Filtre por status/período, busque, **exporte CSV**. KPIs no topo.

**11. Alertas** → sino no header / `/alertas`
- Deixe um cartão com saldo < R$100 ou bloqueado, ou gere uma recusa → aparece no sino e na lista.

**12. Dashboard** → `/dashboard`
- Bloco **Carteira da frota** (saldo, recargas, debitado, ativos).

**13. Auditoria** → `/auditoria`
- Recargas, estornos e bloqueios aparecem na trilha.

**14. APK (POS/Totem)** → `/instalar`
- Botão **Gerar APK** abre o PWABuilder com o app certo. Guia: `docs/APK-SMARTPOS-TOTEM.md`.

---

## 4) Pendências conhecidas (opcionais)
- **PIX automático**: conectar Asaas/Efí + as 2 env vars (ver `docs/PIX-AUTOMATICO.md`).
- **Impressão térmica** na bobina: fase APK nativo (SDK Sunmi/PAX). Hoje imprime pelo navegador.
- **Notificações externas** (WhatsApp/e-mail): hoje os alertas são in-app.
