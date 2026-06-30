# PIX automático (recarga creditada sozinha)

Estrutura pronta. Falta só conectar uma conta de PSP e ligar 2 variáveis de
ambiente. Sem isso, a recarga por PIX continua funcionando no modo manual
(gera o QR e você clica em **Confirmar recarga**).

## Como funciona

```
RechargeForm ──► fn_create_pix_charge (cria cobrança PENDENTE com txid)
   QR PIX (mesmo txid) ──► cliente paga
        PSP (Asaas/Efí) ──► POST /api/webhooks/pix?secret=…
              fn_confirm_pix(txid) ──► credita saldo + marca PAID
```

- Tabela `pix_charges` e funções estão em [`supabase/pix.sql`](../supabase/pix.sql).
- Webhook: [`src/app/api/webhooks/pix/route.ts`](../src/app/api/webhooks/pix/route.ts).
- O webhook aceita os formatos comuns de Asaas, Efí/Gerencianet e Mercado Pago
  (campos `txid`/`externalReference` e status `PAID/CONFIRMED/RECEIVED`).

## Passos para ativar

1. **Rode o SQL**: `supabase/wallet.sql` (se ainda não) e depois `supabase/pix.sql`.
2. **Crie a conta no PSP** (recomendado: **Asaas** — PIX com webhook e conta grátis).
3. **No Vercel → Settings → Environment Variables**, adicione:
   - `SUPABASE_SERVICE_ROLE_KEY` = a *service_role key* do Supabase (Project Settings → API).
   - `PIX_WEBHOOK_SECRET` = uma senha qualquer forte (ex.: `sgo_pix_8f2k…`).
4. **No painel do PSP**, cadastre o webhook de pagamento apontando para:
   ```
   https://sgo-fuel.vercel.app/api/webhooks/pix?secret=SEU_PIX_WEBHOOK_SECRET
   ```
5. Pronto: quando o cliente pagar o QR, o saldo do cartão é creditado sozinho e
   aparece em **Recargas recentes**.

> Segurança: o `service_role` ignora RLS e é usado **só** no servidor
> (`src/lib/supabase/admin.ts`). Nunca exponha essa chave no front.

## Teste manual do webhook (sem PSP)

Crie uma cobrança PIX na tela de recarga (gera o `txid`) e simule a confirmação:

```bash
curl -X POST "https://sgo-fuel.vercel.app/api/webhooks/pix?secret=SEU_SEGREDO" \
  -H "Content-Type: application/json" \
  -d '{"txid":"O_TXID_DA_COBRANCA","status":"CONFIRMED"}'
```

O saldo deve subir automaticamente.
