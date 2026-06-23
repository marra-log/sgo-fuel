# Modelo de Pagamento — Máquina + Cartão Exclusivos

> Documento para o cliente. Cobre o modelo escolhido, como funciona, o passo a passo de implantação, o que é regulado (e o que **não** é), e a estimativa de custos.

---

## 0. Modelo escolhido

| Item | Decisão | Por quê |
|------|---------|---------|
| **Tipo de cartão** | **Private label fechado + identificação NFC/QR** | Cartão que só vale na rede/postos da empresa. Não passa por Visa/Master. **Não precisa de autorização do Banco Central** (uso restrito). Mais barato e rápido. |
| **Máquina** | **App próprio rodando em terminal de adquirente** (Pax/Gertec via Stone, Cielo ou PagSeguro) | Usa a estrutura de uma adquirente já existente para liquidar. Sem virar instituição de pagamento. |
| **Liquidação** | Fatura fechada por empresa-cliente (frota) + opção de débito via adquirente | A frota paga por fatura mensal; a transação no posto é registrada e conciliada. |

**Resumo em uma frase:** a empresa emite cartões próprios (fechados) que identificam motorista + cota; a maquininha (app da empresa em terminal homologado) valida cota/status/PIN e autoriza o abastecimento; a cobrança é consolidada por fatura. **Sem bandeira, sem Bacen, sem virar banco.**

---

## 1. Como funciona (arquitetura)

```
   Motorista                Maquininha (Pax/Gertec)              Backend SGO-Fuel
   ─────────                ───────────────────────              ────────────────
   Cartão NFC  ──aproxima──►  App SGO-Fuel POS                   API de autorização
   (private label)           1. lê número/UID do cartão  ──────►  - cartão existe? ativo?
                             2. envia cota + valor                - PIN confere?
                                                                  - cota do mês ok?
                             3. recebe APROVADO/NEGADO  ◄──────   - registra transação
                             4. imprime recibo                     - gera abastecimento
                             5. (se houver) libera a bomba
```

- **Cartão**: PVC com chip de proximidade (NFC/RFID Mifare) gravado com um UID. O número impresso (BIN fechado `7000…`) e o UID identificam o cartão. **Não armazena saldo no chip** — o saldo/cota vive no backend (mais seguro, permite bloquear na hora).
- **Maquininha**: terminal Android (Pax A920, Gertec, Sunmi) com o app da empresa instalado. Conectado por 4G/WiFi.
- **Backend**: o que já existe no SGO-Fuel — valida cota, status, PIN e registra a transação.

---

## 2. O que JÁ está pronto para validar (protótipo funcional)

Implementado e no ar — **sem custo, sem hardware**, dá pra demonstrar pro cliente hoje:

| Tela | O que faz |
|------|-----------|
| **`/cartoes`** | Emite cartões private label (número + NFC gerados), define cota mensal, PIN, vincula a motorista/veículo, bloqueia/cancela |
| **`/cartoes/[id]`** | Mostra cota usada × restante no mês + histórico de transações do cartão |
| **`/maquininha`** | **Terminal POS simulado**: digita/seleciona o cartão, litros, preço e PIN → valida (existe? ativo? cota? PIN?) → **APROVA ou NEGA** com recibo → registra a transação e gera o abastecimento |

Isso valida **toda a regra de negócio** do cartão e da máquina antes de gastar com hardware e adquirente. O que muda na produção é só a "casca": o app roda num terminal físico de verdade e lê a tag NFC real em vez de digitar o número.

> Banco: rode `supabase/cards.sql` no Supabase para criar as tabelas `fleet_cards` e `card_transactions` (RLS por empresa, igual ao resto).

---

## 3. Passo a passo até produção

### Fase 0 — Validação (AGORA, custo R$ 0)
- [x] Protótipo funcional de cartão + maquininha no app
- [ ] Cliente testa o fluxo: emitir cartão → passar na maquininha → ver aprovação/negação, cota e recibo
- [ ] Ajustar regras (cota por litro vs por R$, PIN obrigatório ou não, vínculo motorista×veículo)

### Fase 1 — Cartões físicos (2 a 3 semanas)
- [ ] Definir arte do cartão (logo da empresa, BIN fechado, numeração)
- [ ] Escolher tecnologia da tag: **NFC Mifare Classic 1K** (mais comum/barato) ou **NTAG**
- [ ] Pedir lote piloto numa gráfica de cartões (mínimo típico 100–500 unidades)
- [ ] Gravar os UIDs no sistema (importar lista da gráfica)

### Fase 2 — Maquininha (4 a 8 semanas)
- [ ] Abrir conta na adquirente (Stone / Cielo / PagSeguro / Rede) — gratuito
- [ ] Contratar/alugar os terminais Android (Pax A920 Pro, Gertec, Sunmi)
- [ ] Desenvolver o **app Android SGO-Fuel POS** (Kotlin) com:
  - leitura de NFC (a tag do cartão)
  - chamada à API de autorização (já existe a lógica)
  - impressão do recibo
  - integração com o SDK da adquirente (se for liquidar pagamento real)
- [ ] **Homologar o app** na adquirente (processo padrão, 2–6 semanas)
- [ ] Publicar o app na store interna da adquirente (Pax Store / Stone / etc.)

### Fase 3 — Piloto operacional (2 a 4 semanas)
- [ ] Instalar 1 terminal num posto/pátio
- [ ] Distribuir 30–50 cartões para a frota piloto
- [ ] Rodar 2 a 4 semanas, medir aprovação, fraude evitada, conciliação
- [ ] Ajustar e escalar

### Fase 4 — Escala
- Mais terminais, mais cartões
- Integração com a conciliação SEFAZ (já existe)
- App nativo, relatórios por cartão (já existe a base)

---

## 4. Regulatório — o que você precisa saber

| Pergunta | Resposta |
|----------|----------|
| Precisa de autorização do Banco Central? | **Não**, para cartão private label de **uso fechado/restrito** (só na própria rede/frota). É instrumento de pagamento de aceitação restrita. |
| Vira "arranjo de pagamento" regulado? | Só se o volume e o número de participantes ultrapassarem os limites do Bacen (arranjos de aceitação restrita têm isenção até certos limites). No piloto/frota, fica de fora. |
| Precisa de PCI-DSS? | **Não**, enquanto não processar cartão de bandeira (Visa/Master). Cartão fechado próprio não cai em PCI. |
| E se quiser virar bandeirado depois? | Aí sim entra emissor/BIN sponsor, BaaS, PCI e homologação — outro projeto, bem mais caro (ver seção 6). |
| Nota fiscal do combustível? | Continua sendo emitida pelo posto normalmente; a conciliação SEFAZ já cruza isso. |

> **Importante**: confirme com o contador/jurídico da empresa o enquadramento fiscal do "vale combustível" fechado. O modelo técnico não exige Bacen, mas o tratamento contábil (crédito pra frota) é decisão da empresa.

---

## 5. Estimativa de custos — modelo escolhido (private label + app em adquirente)

### 5.1 Setup único (desenvolvimento + primeira leva)

| Item | Faixa | Observação |
|------|-------|------------|
| App Android SGO-Fuel POS (Kotlin) com NFC + impressão + integração adquirente | **R$ 25.000 – R$ 45.000** | Maior custo. A lógica de autorização já existe no backend; é a "casca" do terminal |
| Homologação do app na adquirente | **R$ 0 – R$ 3.000** | Geralmente gratuito; algumas cobram taxa de certificação |
| Arte + setup gráfico do cartão | **R$ 300 – R$ 800** | Uma vez |
| Lote piloto de 100 cartões NFC personalizados | **R$ 400 – R$ 1.500** | R$ 4 a R$ 15/cartão conforme chip e acabamento |
| **Subtotal setup** | **~R$ 26.000 – R$ 50.000** | A maior parte é o app POS |

### 5.2 Recorrente (mensal)

| Item | Faixa | Observação |
|------|-------|------------|
| Aluguel do terminal (por máquina) | **R$ 0 – R$ 120/mês** | Stone/PagSeguro frequentemente cedem; ou compra única R$ 800–1.500 |
| MDR / taxa por transação (se liquidar via adquirente) | **0,5% – 2%** por transação | Em modelo de fatura fechada, pode ser **R$ 0** (sem adquirente no meio) |
| Plataforma SGO-Fuel (backend, cota, auditoria) | **já incluída** | Roda no que já existe |
| **Recorrente típico (1 terminal, fatura fechada)** | **~R$ 0 – R$ 120/mês** | Sobe conforme nº de terminais |

### 5.3 Custo por unidade ao escalar

| Item | Valor |
|------|-------|
| Cartão NFC private label (lote) | **R$ 4 – R$ 15** / cartão |
| Terminal adicional | **R$ 800 – R$ 1.500** (compra) ou R$ 90/mês (aluguel) |
| Transação | **R$ 0** (fatura fechada) ou **0,5–2%** (via adquirente) |

### 5.4 Cenário-base de PILOTO

| Bloco | Valor |
|-------|-------|
| Protótipo funcional (já entregue) | **R$ 0** |
| App POS Android (dev) | R$ 25.000 – R$ 45.000 |
| 1 terminal (compra) | R$ 1.200 |
| 50 cartões NFC personalizados | R$ 500 |
| Setup gráfico | R$ 500 |
| **Total piloto** | **~R$ 27.000 – R$ 47.000** únicos + ~R$ 0–120/mês |

> Quase todo o investimento está no **app POS**. Se a empresa aceitar começar **sem liquidação financeira pela maquininha** (a máquina só autoriza e registra; a cobrança vai por fatura mensal), dá pra reduzir o escopo do app e **encostar o custo de dev na faixa de baixo** (R$ 20–25k), porque some a integração com o SDK de pagamento da adquirente.

---

## 6. Comparativo: por que NÃO ir de bandeirado agora

| | Private label fechado (escolhido) | Bandeirado (Visa/Master) |
|---|---|---|
| Autorização Bacen | Não exige | Exige (emissor/BIN sponsor) |
| PCI-DSS | Não | Sim |
| Prazo | Semanas | 6 a 12 meses |
| Custo de entrada | ~R$ 27–47k | R$ 150k – R$ 500k+ |
| Aceito fora da rede | Não (e não precisa, é frota) | Sim |
| Risco/complexidade | Baixo | Alto |

O cartão fechado entrega **exatamente** o que a frota precisa (controle de cota, anti-fraude, conciliação) sem o peso regulatório. Bandeirado só faz sentido se um dia o produto virar meio de pagamento aberto para terceiros — outro projeto.

---

## 7. Próximos passos imediatos

1. **Cliente testa** o protótipo: `/cartoes` → emitir → `/maquininha` → passar o cartão → ver aprovação/negação. (custo R$ 0)
2. **Decidir**: a maquininha vai **liquidar pagamento** (precisa SDK da adquirente, app mais caro) ou só **autorizar + faturar** (app mais simples, mais barato)?
3. **Aprovar orçamento** do app POS (faixa R$ 20–45k conforme item 2).
4. **Escolher adquirente** (Stone / Cielo / PagSeguro) e pedir o lote piloto de cartões.

---

**Autor**: Equipe Aether IA · Marralog
**Última atualização**: 22/06/2026
**Status do protótipo**: funcional e publicado (`/cartoes`, `/maquininha`)
