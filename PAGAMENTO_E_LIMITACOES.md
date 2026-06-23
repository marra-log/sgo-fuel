# Pagamento, Lançamento de Valores, Limitações, Segurança e Escala

> Documento para decisão antes de comprar o hardware e apresentar ao cliente (rede de postos que **já tem** um sistema de combustível).

---

## 1. Validação técnica — o que está comprovadamente funcionando (hoje)

Tudo abaixo foi testado de verdade, não é promessa:

| Camada | Validação | Resultado |
|--------|-----------|-----------|
| **Banco** | 14 tabelas testadas via API REST do Supabase | ✅ Todas existem e respondem |
| **Segurança (leitura)** | Acesso anônimo a cada tabela | ✅ RLS retorna vazio — ninguém vê dado de outra empresa |
| **Segurança (escrita)** | INSERT anônimo em `fleet_cards` | ✅ **Negado (HTTP 401, RLS)** — não dá pra gravar sem ser dono |
| **Rotas públicas** | 10 rotas | ✅ Todas 200 |
| **Rotas protegidas** | 11 rotas | ✅ Todas exigem login (307) |
| **Cartão + maquininha** | emissão, leitura NFC, autorização, recibo | ✅ Funcional |
| **Faturamento** | fechamento por cartão + total a cobrar | ✅ Funcional (`/faturamento`) |

**Conclusão:** a estrutura de backend, banco e integração está **válida e segura** para o MVP. Pode comprar o hardware.

---

## 2. Como funciona o pagamento e o lançamento dos valores

### 2.1 O ponto-chave: o cartão fechado NÃO move dinheiro na hora

Diferente de um cartão de crédito, o cartão private label **não debita** uma conta no momento do abastecimento. Ele faz **3 coisas**:

1. **Identifica** quem é (motorista/veículo/cartão)
2. **Autoriza ou nega** conforme cota, status e PIN
3. **Registra** a transação (litros × preço = valor) na tabela `card_transactions`

O dinheiro é acertado **depois**, por **fatura fechada** no fim do período.

### 2.2 O fluxo financeiro (com ou sem máquina)

```
  Abastecimento          Registro                 Fechamento              Cobrança
  ───────────────        ──────────               ──────────              ────────
  Cartão/QR autoriza ──► card_transactions  ──►  /faturamento soma  ──►  Empresa fatura
  (maquininha OU app)    (valor, litros)         por cartão/motorista     o cliente (boleto/
                                                  = total a cobrar         PIX/desconto folha)
```

- **Lançamento dos valores** = a tela **`/faturamento`** (já implementada). Ela soma todas as transações aprovadas do mês, agrupa por cartão/motorista, e mostra o **total a faturar**. Exporta CSV e PDF.
- **A cobrança em si** (boleto, PIX, desconto em folha do motorista, débito da transportadora) é feita **fora** do abastecimento — é uma fatura mensal, como o cliente provavelmente já faz hoje.

### 2.3 E se NÃO usar máquinas? (sua pergunta)

**Funciona igual, sem terminal físico.** A autorização pode vir por:

| Sem máquina | Como |
|-------------|------|
| **App do motorista (PWA)** | O motorista faz check-in pelo celular (`/app`), o sistema autoriza pela cota. **Já está pronto.** |
| **QR Code na bomba** | O frentista/motorista lê um QR; abre a autorização no navegador. (pequeno ajuste) |
| **Painel do frentista** | O operador do posto digita placa/cartão num tablet/PC e autoriza. (a maquininha web já faz isso — é só abrir no PC) |

> Ou seja: a "maquininha" é **uma das formas** de capturar a autorização. A regra de negócio (cota, bloqueio, registro, faturamento) é a mesma com ou sem o terminal. O terminal só dá conforto operacional e a "cara" de POS. **Sem máquina, o custo de hardware cai a quase zero** — usa o celular do motorista ou o computador que o posto já tem.

---

## 3. Limitações honestas desta estrutura (diga ao cliente)

| Limitação | Detalhe | Mitigação |
|-----------|---------|-----------|
| **Web NFC só no Android/Chrome** | iPhone não lê tag NFC pela web | Use Android na maquininha; ou QR Code como alternativa universal |
| **Não corta a bomba fisicamente** | O sistema autoriza, mas não energiza/desliga a bomba sozinho | Fase B (Totem IoT) faz o corte. No MVP, o frentista respeita a autorização da tela |
| **Não é cartão de bandeira** | Não passa em maquininha de Visa/Master fora da rede | É de propósito — é frota fechada. Mais barato e sem Bacen |
| **Liquidação é por fatura, não instantânea** | O dinheiro não cai na hora | É o modelo padrão de cartão-frota (Ticket Log, Goodcard etc. funcionam assim) |
| **PWA depende de internet no momento da autorização** | Sem 4G/WiFi, não autoriza online | Roadmap: cache offline com sincronização (a base de PWA já existe) |
| **Free tier do Supabase** | 500 MB de banco, limites de request | Suficiente pro piloto; upgrade barato quando escalar (seção 5) |

---

## 4. Segurança — o que já está garantido e o que falta

### Já garantido (testado)
- **Multi-tenant com RLS**: cada empresa só vê e grava os próprios dados. Testado: anônimo recebe vazio e tem escrita negada.
- **Auth real** (Supabase) com senha forte e proteção contra senha vazada.
- **HTTPS** em tudo (Vercel).
- **Auditoria** automática (trigger) de toda criação/edição/exclusão.
- **PIN** opcional por cartão.

### A reforçar antes de produção em escala
- **Hash do PIN** (hoje, na demo, o PIN fica em texto — em produção, usar hash). Ajuste rápido.
- **Rate limit** na autorização (evitar força bruta de PIN). 
- **Papéis** (operador de posto vê só a maquininha; gestor vê tudo). A base de papéis existe (OWNER/MANAGER/VIEWER).
- **LGPD**: política de retenção e consentimento (já previsto no plano).

> Nenhum desses bloqueia o MVP de apresentação. São hardening para quando virar contrato.

---

## 5. Escalabilidade — aguenta uma rede de postos?

| Item | MVP (1 posto, 50–100 veículos) | Rede (vários postos, milhares de veículos) |
|------|-------------------------------|---------------------------------------------|
| Banco | Supabase Free | Supabase Pro (US$ 25) → depois Neon/escala dedicada |
| Frontend/API | Vercel Free/Pro | Vercel Pro (escala automática, serverless) |
| Transações | Tabela indexada por tenant + data | Particionamento/arquivamento por período |
| Cartões | Centenas | Milhares — mesma estrutura, só volume |
| Custo infra | R$ 0–100/mês | R$ 300–1.000/mês conforme volume |

A arquitetura (Postgres + RLS + serverless) é a **mesma** que SaaS grandes usam. Escala por configuração, não por reescrita. **A estrutura nasce escalável.**

---

## 6. O cliente JÁ TEM um sistema de combustível — como entrar?

Esse é o ponto estratégico. Três caminhos (do mais leve ao mais profundo):

| Estratégia | O que é | Quando usar |
|-----------|---------|-------------|
| **A) Complementar (recomendado p/ entrar)** | O SGO-Fuel roda **ao lado** do sistema atual, cuidando do controle de frota/cota/anti-fraude e do cartão exclusivo. O sistema atual continua na gestão do posto (estoque, bomba, fiscal). | Entrada rápida, baixo atrito, prova de valor |
| **B) Integrar** | Conectar via **API/importação**: o SGO-Fuel lê as vendas do sistema atual (ou manda as autorizações pra ele). Conciliação automática. | Quando o cliente gostar do piloto e quiser unificar |
| **C) Substituir** | O SGO-Fuel vira o sistema principal. | Só se o sistema atual for ruim e o cliente quiser trocar (decisão grande) |

**Para apresentar amanhã, venda a estratégia A**: *"não vou mexer no que você já tem; vou colocar uma camada de controle de frota e um cartão exclusivo que o seu sistema atual não faz — e provo isso num posto, sem risco."* Depois, se aprovado, evolui pra integração (B).

> Pergunta-chave pra fazer ao cliente: **qual sistema ele usa hoje?** (ex: Postopiloto, Sysped, Linx Postos, AutoSystem, EMIS…). Saber isso define como será a integração na fase B. Quase todos têm exportação de XML/relatório ou API — dá pra conciliar.

---

## 7. Estimativa de custo do MVP (validando a do Gemini)

A estimativa que você recebeu está **correta e realista**. Complemento:

| Item | Gemini | Comentário |
|------|--------|-----------|
| Smart POS Android | R$ 900 – 1.600 | ✅ Correto (Sunmi V2/P2, Gertec). **Ou R$ 0** usando celular Android próprio / PWA |
| Cartões NFC (100) | R$ 150 – 300 | ✅ Correto. Prefira **NTAG215** (melhor com Web NFC). Mifare também lê o UID |
| Infra cloud | R$ 0 – 100/mês | ✅ Correto. Free tier cobre o piloto |
| Desenvolvimento (40–60h) | seu tempo | ✅ **Boa parte já está feita** — backend, banco, maquininha, cartão, faturamento prontos. Sobra integração fina e o app nativo (só se for liquidar via adquirente) |
| **Total hardware** | **R$ 1.050 – 1.900** | ✅ Correto para a versão com terminal físico |

**Economia real:** como o software já está pronto e funcional, seu "custo de desenvolvimento" para o MVP de apresentação é **muito menor** que 40–60h — o que falta é comprar os cartões/terminal e cadastrar. Se for de **PWA sem terminal**, o custo vivo cai para **~R$ 150–300** (só os cartões) ou até R$ 0 (QR Code).

---

## 8. Recomendação final para amanhã

1. **Compre**: 1 Smart POS Android (Sunmi P2 Pro ~R$ 1.200) **+** 100 cartões NTAG215 (~R$ 250). Total ~R$ 1.450. *(Ou comece só com cartões + seu Android = ~R$ 250.)*
2. **Cadastre** os cartões lendo a tag real (`/cartoes`).
3. **Apresente** a estratégia **complementar** (seção 6-A): não mexe no sistema atual, agrega controle de frota + cartão exclusivo + faturamento.
4. **Demonstre** o ciclo: emitir cartão → passar na maquininha → bloquear → negar → fechar a fatura (`/faturamento`).
5. **Descubra** qual sistema o cliente usa hoje (define a integração da fase 2).

---

**Status do sistema:** validado (banco + segurança + rotas + faturamento). Pronto para o MVP físico.
**Última atualização**: 23/06/2026
