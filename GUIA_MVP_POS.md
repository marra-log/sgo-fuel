# Guia do MVP POS — Cartão + Maquininha real para apresentar ao cliente

> Objetivo: ter **uma maquininha física lendo um cartão de verdade** para demonstrar ao cliente, gastando o mínimo e sem homologação de adquirente. Não é produção em escala — é um MVP único de validação/apresentação.

---

## 0. A grande decisão (e por que ela te economiza meses)

Existem 2 caminhos pra ter um POS:

| Caminho | Hardware | App | Prazo | Custo | Serve pra demo? |
|---------|----------|-----|-------|-------|------------------|
| **A) PWA + Web NFC (RECOMENDADO)** | Celular/tablet Android comum (que você já tem) ou um Sunmi | O que já está pronto no SGO-Fuel — roda no Chrome, lê NFC | **hoje** | **~R$ 0 a R$ 300** | ✅ Perfeito |
| B) App nativo + terminal de adquirente | Pax/Stone/Cielo travado | Kotlin homologado na adquirente | 2–4 meses | R$ 25–45k | Demora demais |

**Para apresentar ao cliente, vá de Caminho A.** A maquininha já é uma página web (`/maquininha`) que agora lê a tag NFC real pelo Chrome do Android. Você instala como app na tela inicial, aproxima o cartão, e ela autoriza/nega de verdade. Zero app nativo, zero homologação.

> O Caminho B (app nativo homologado) só vale **depois** que o cliente aprovar e você for pra produção com liquidação financeira. Está documentado em `MODELO_PAGAMENTO.md`.

---

## 1. O que comprar

### 1.1 A "máquina" (escolha uma)

| Opção | Onde | Preço | Observação |
|-------|------|-------|------------|
| **Seu próprio celular Android** | já tem | **R$ 0** | Precisa ter **NFC** e **Chrome**. Maioria dos Android de 2019+ tem. Caminho mais barato pra demo. |
| **Sunmi P2 / P2 Pro / V2 Pro** | Mercado Livre, Sunmi BR | R$ 900 – R$ 1.600 | Tem **cara de maquininha** (impressora térmica + NFC + Android aberto). Ideal pra impressionar o cliente. Você instala o Chrome e abre a PWA. |
| **Tablet Android barato + NFC** | — | R$ 700 – R$ 1.200 | Tela maior. Confira que o modelo tem NFC (nem todo tablet tem). |

> ⚠️ **iPhone não serve** para o Web NFC da maquininha (a Apple não libera a Web NFC API). Use Android. (No cartão do motorista — PWA `/app` — o iPhone funciona normal; a restrição é só a leitura NFC da maquininha.)

**Recomendação:** comece com **seu próprio Android** (R$ 0) pra validar hoje. Se for apresentar presencialmente e quiser efeito "maquininha de verdade", compre **1 Sunmi P2 Pro** (~R$ 1.200) com impressora.

### 1.2 Os cartões

| Item | Especificação | Onde | Preço |
|------|---------------|------|-------|
| **Cartão NFC** | **NTAG215** (ou NTAG213) PVC branco | Mercado Livre, AliExpress | R$ 2 – R$ 6 / un |
| Lote pra demo | 10 a 20 cartões | — | R$ 30 – R$ 120 |
| (opcional) Impressão personalizada | logo da empresa | gráfica de cartões | + R$ 1 – R$ 3 / un |

**Por que NTAG215**: é o chip NFC mais compatível com Web NFC (lê o UID na hora), barato e fácil de achar. Mifare Classic também funciona pra ler o UID, mas NTAG é mais garantido.

> Dica de busca no Mercado Livre: **"cartão NFC NTAG215 PVC branco"** ou **"tag NFC NTAG215 regravável"**. Compre uns 10–20 pra ter folga.

### 1.3 Resumo de custo do MVP

| Cenário | Custo |
|---------|-------|
| **Mínimo (seu Android + 10 cartões)** | **~R$ 50** |
| **Apresentável (Sunmi P2 Pro + 20 cartões personalizados)** | **~R$ 1.300** |
| Software / plataforma | **R$ 0** (já está pronto) |

---

## 2. Passo a passo de integração (30 minutos)

### Passo 1 — Preparar o banco (já feito ✅)
Você já rodou `supabase/cards.sql`. As tabelas `fleet_cards` e `card_transactions` existem.

### Passo 2 — Ligar o NFC no Android
- Configurações → **NFC** → ativar.
- Use o **Google Chrome** (não Samsung Internet, não Firefox — só o Chrome implementa Web NFC).

### Passo 3 — Abrir a maquininha
1. No Chrome do Android, acesse **https://sgo-fuel.vercel.app/login** e entre.
2. Vá em **https://sgo-fuel.vercel.app/maquininha**.
3. Menu do Chrome (⋮) → **Adicionar à tela inicial**. Vira um ícone tipo app.

### Passo 4 — Cadastrar os cartões (lendo a tag real)
1. Vá em **/cartoes → Emitir cartão**.
2. No campo **UID NFC**, toque em **"Ler tag física (NFC)"** e **aproxime o cartão** do verso do celular.
   - O UID real da tag é capturado automaticamente.
3. Defina **cota mensal** (ex: 1000 L), **PIN** (opcional), vincule a um **motorista/veículo** (opcional).
4. Salvar. Repita pra cada cartão.

> Cada cartão físico fica amarrado ao seu UID no banco. É isso que permite reconhecer a tag e bloquear na hora se for perdida.

### Passo 5 — Testar na maquininha
1. Em **/maquininha**, toque em **"Aproximar cartão (NFC)"** e encoste a tag.
   - Se cadastrada: aparece **"Cartão reconhecido: [titular]"** e o número é preenchido.
   - Se não cadastrada: mostra o UID lido (pra você cadastrar).
2. Informe **litros**, **R$/L** e **PIN** (se o cartão exigir).
3. Toque em **Autorizar**.
4. Veja o **recibo**: APROVADO (verde) ou NEGADO (vermelho com motivo).

### Passo 6 — Validar os cenários de negação (é o que impressiona o cliente)
| Teste | Como | Resultado esperado |
|-------|------|--------------------|
| Cartão OK | cota disponível, PIN certo | ✅ APROVADO + gera abastecimento |
| Cartão bloqueado | em /cartoes mude status → Bloqueado | ❌ "Cartão bloqueado" |
| Cota estourada | peça litros acima da cota do mês | ❌ "Cota mensal excedida" |
| PIN errado | digite PIN errado | ❌ "PIN incorreto" |
| Tag desconhecida | aproxime um cartão não cadastrado | ❌ "Cartão não reconhecido" |

---

## 3. Roteiro de apresentação ao cliente (5 minutos)

1. **Mostre o portal** (`/dashboard`) com gráficos e KPIs reais.
2. **Emita um cartão na hora** lendo a tag NFC na frente do cliente (`/cartoes`).
3. **Passe o cartão na maquininha** (`/maquininha`) → aprovado, com recibo.
4. **Bloqueie o cartão** no portal e passe de novo → **negado na hora**. (Esse é o "momento uau": controle em tempo real.)
5. **Estoure a cota** e mostre o bloqueio automático.
6. Abra o **relatório PDF** (`/relatorios`) e a **rede de postos** (`/postos`) pra mostrar a visão de gestão.

> Mensagem central pro cliente: *"cartão exclusivo da sua empresa, máquina que valida cota e fraude em tempo real, sem depender de cartão de bandeira nem de banco — e isso aqui já está funcionando."*

---

## 4. Limites honestos deste MVP (diga ao cliente)

| O que é real agora | O que é da Fase de produção |
|--------------------|------------------------------|
| Lê cartão NFC de verdade | App nativo homologado na adquirente (se for liquidar pagamento) |
| Valida cota, status, PIN | Corte físico da bomba (precisa do Totem IoT) |
| Registra transação + recibo | Impressão térmica no Sunmi (o navegador imprime; nativo imprime direto) |
| Gera abastecimento no portal | Integração com a bomba/ALPR (Fase B do plano) |

Nada disso impede a demo — é exatamente o recorte certo pra **validar o conceito e fechar o cliente** antes de investir em hardware caro.

---

## 5. Próximos passos

1. **Comprar** 10–20 cartões NTAG215 (~R$ 50). (Opcional: 1 Sunmi P2 Pro.)
2. **Ativar NFC** no Android + Chrome.
3. **Cadastrar** os cartões lendo as tags reais.
4. **Ensaiar** o roteiro da seção 3.
5. **Apresentar.** Quando o cliente aprovar, partimos pro app nativo + adquirente (custos em `MODELO_PAGAMENTO.md`).

---

**Status:** maquininha e cadastro já leem NFC real (Web NFC) — publicado em `/maquininha` e `/cartoes`.
**Última atualização**: 22/06/2026
