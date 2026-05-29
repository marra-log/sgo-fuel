# Plano de Execução — SGO-Fuel · Aether IA

> **De: demo estática.** **Para: produto operando em pátios e postos parceiros, com backend, banco, IoT físico e IA em produção.**

Documento vivo. Cada seção foi escrita para virar issue/épico no GitHub Projects ou Linear sem retrabalho.

---

## 0. Sumário executivo — 2 fases, equipe = você + Claude

A construção é feita **por você + Claude (Anthropic)** dentro deste repo. **Sem equipe contratada, sem PJ, sem CLT.** Tudo o que é software (backend, banco, autenticação, telas funcionais, integrações leves) é executado primeiro e roda 100% em free tier. Só quando essa parte estiver provando valor é que entram os gastos de hardware, infra paga e integrações que cobram por uso.

### 🧪 FASE A — Software ativo, custo R$ 0/mês
Transformar o demo estático atual em **produto web funcional** rodando em free tier. Cliente consegue cadastrar empresa, motoristas, veículos, ver eventos sendo persistidos, gestor logando de verdade, PWA do motorista existindo.

| Item | Valor |
|------|-------|
| Equipe | Você + Claude (R$ 0) |
| Duração esperada | 3 a 6 semanas de trabalho pontual |
| Hospedagem | Vercel free + **Supabase free** (Postgres + Auth + Storage + Realtime numa conta só) |
| Custo total | **R$ 0/mês** enquanto não passar do free tier |
| Critério de "pronto" | Portal lê/grava banco real, login funciona, PWA do motorista existe, dados de demo viram dados persistidos |

### ⚙️ FASE B — Hardware em campo + SaaS pagos
**Só começa depois que a Fase A estiver pronta e validada com um cliente real.** Quando o sistema sai do navegador e começa a controlar bomba.

| Item | Valor |
|------|-------|
| Hardware piloto (10 bombas) | R$ 16.600 |
| MQTT broker (HiveMQ) | R$ 270/mês |
| Twilio (SMS de login do motorista) | R$ ~250/mês |
| Mapbox + Sentry + R2 + Modal | R$ ~575/mês |
| Upgrade Supabase ou migração pra Neon | R$ ~165/mês |
| **Total Fase B** | **~R$ 1.260/mês** recorrente + **R$ 16.600** único |

### 0.1 Os números do pitch comercial não mudam

Os **R$ 1.500/bomba** (setup) e a **economia de R$ 23k/mês numa frota 50k L** que aparecem no site `https://sgo-fuel.vercel.app` são **argumentos comerciais para o cliente final** — frotista que vai assinar. **Não são custos de desenvolvimento**. O cliente paga isso quando o produto já está pronto. Nosso custo de construção é tempo seu + Claude.

---

## 1. Objetivo & escopo

### 1.1 O que o MVP precisa fazer
1. **Cadastro** de empresa, motoristas, veículos, bombas e tanques.
2. **Autorização ativa** de cada abastecimento (pátio e posto parceiro) cruzando placa lida (ALPR) + motorista autenticado + cota dinâmica.
3. **Corte físico** em < 200 ms quando regra falhar (recipiente fora do padrão, placa divergente, cota excedida, fora do horário).
4. **Registro auditável** de cada evento (vídeo, fotos, KM, hora, GPS, fluxo elétrico do relé).
5. **Portal do Gestor** com KPIs, eventos, anomalias, conciliação SEFAZ e ranking.
6. **App do motorista** com cota, mapa, check-in e histórico.
7. **App Smart POS** rodando em PAX/Gertec para postos parceiros.
8. **Conciliação SEFAZ** automática (entrada XML × saída IoT).

### 1.2 O que fica fora do MVP (versão 1.x)
- Pagamento via PIX/cartão para postos parceiros (vai por reembolso/fatura na v1, integração PIX QR só na v2)
- Roteirização própria — usaremos API do Google Maps ou Mapbox; roteirização proprietária na v2
- ANTT/CIOT e cadeia logística completa (v2)
- Marketplace de postos (v3)

---

## 2. Arquitetura geral

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        SGO-Fuel — Visão de Topo                            │
└───────────────────────────────────────────────────────────────────────────┘

   [Pátio Interno]                              [Posto Parceiro]
   ┌──────────────┐                             ┌──────────────┐
   │ Bomba Diesel │                             │ Bomba do     │
   │              │                             │ Posto        │
   │  ┌────────┐  │                             └──────┬───────┘
   │  │ Relé   │  │                                    │
   │  │  SSR   │◄─┼──── liga/desliga                   │
   │  └────┬───┘  │                             ┌──────▼───────┐
   │       │      │                             │ PAX/Gertec   │
   │  ┌────▼───┐  │     ┌─────────┐             │ Smart POS    │
   │  │ Câmera │──┼────►│ Pi 5    │             │ (app Android)│
   │  │ ALPR   │  │     │ Edge    │             └──────┬───────┘
   │  └────────┘  │     │ Compute │                    │
   └──────────────┘     └────┬────┘                    │
                             │ mTLS+REST/MQTT          │
                             ▼                         │
                  ┌──────────────────────┐             │
                  │   API SGO-Fuel       │◄────────────┘
                  │   (Next.js + tRPC    │
                  │    + Fastify worker) │
                  └──────────┬───────────┘
                             │
            ┌────────────────┼────────────────┬──────────────┐
            ▼                ▼                ▼              ▼
      ┌──────────┐    ┌────────────┐   ┌──────────┐   ┌──────────┐
      │ Postgres │    │  S3/R2      │   │ Redis    │   │ Worker IA │
      │ (Prisma) │    │ (vídeo,foto)│   │ (fila,   │   │ (ALPR,    │
      └──────────┘    └────────────┘   │ cache)   │   │ classific.)│
                                       └──────────┘   └──────────┘

                  Portal Gestor (web)  ── App Motorista (Expo) ── Smart POS (Android)
```

### 2.1 Pontos de contato
- **Totem IoT** (pátio): Raspberry Pi 5 + câmera 1080p IR + relé SSR 25A + modem 4G/WiFi
- **Smart POS** (posto parceiro): app Android nativo em PAX A920 Pro, Gertec, Sunmi
- **App do motorista**: **PWA** (Progressive Web App) servida pelo mesmo Next.js, com manifest + service worker + ícone instalável. Funciona em qualquer celular sem passar por App Store/Play Store
- **Portal do Gestor**: Next.js (já temos a casca pronta neste repo)

### 2.2 Onde fica hospedado o quê (resposta direta)

Tudo em **3 contas SaaS** (sem servidor próprio, sem VPS, sem mexer em Linux). Custo total da infra do MVP: ~**R$ 1.430/mês**.

| O quê | Onde | URL/conta | Custo mensal |
|------|------|-----------|--------------|
| **Site / Portal Gestor / API REST / API tRPC / PWA Motorista** | **Vercel** | já é onde está hoje: `marralog-s-projects/sgo-fuel` | US$ 20 (~R$ 110) |
| **Banco de dados (Postgres 16)** | **Neon** (recomendado) ou Supabase | conta nova `neon.tech` no e-mail da Marralog | US$ 30 (~R$ 165) |
| **Storage de vídeo/foto das anomalias** | **Cloudflare R2** | conta nova `cloudflare.com` | ~R$ 80 |
| **Fila/cache (Redis)** | **Upstash** | conta nova `upstash.com` | ~R$ 60 |
| **MQTT broker** (comunicação com os totens IoT no pátio) | **HiveMQ Cloud** | conta nova `hivemq.com` | US$ 49 (~R$ 270) |
| **SMS de login do motorista** | **Twilio** | conta nova `twilio.com` | ~R$ 250 (consumo) |
| **Mapas / distância da rota** | **Mapbox** (mais barato que Google) | conta nova `mapbox.com` | ~R$ 200 |
| **Treino de IA** (esporádico, só quando muda o modelo) | **Modal** (paga por minuto) | conta nova `modal.com` | ~R$ 150 |
| **Monitoramento de erro** | **Sentry** | conta nova `sentry.io` | US$ 26 (~R$ 145) |

**Por que dividido em vários SaaS?** Porque cada um é o melhor no que faz e tem free tier generoso. Não precisa "comprar tudo da Vercel" nem manter servidor próprio. Cada conta é só uma autenticação Google e um cartão de crédito.

**Plano B (super simplificado)**: se quiser **menos contas**, dá pra trocar Neon + Upstash + Cloudflare R2 + Sentry por **Supabase só** — que entrega Postgres + Auth + Storage + Realtime numa conta única. Fica em ~R$ 350/mês (mais caro por GB) mas é uma decisão a menos pra gerenciar. Recomendo Supabase pra começar e migrar peças pra Neon/R2 quando passar de 50 bombas ativas.

### 2.3 Já está parcialmente no ar
Hoje (29/05/26) **a Vercel já está hospedando** o portal + o esqueleto da PWA do motorista em `https://sgo-fuel.vercel.app`. Falta só conectar nas outras contas (Neon, R2, Upstash, HiveMQ) — cada uma adiciona um `process.env.XXX_URL` no painel da Vercel e segue. Nenhuma migração de hospedagem é necessária.

---

## 3. Stack consolidada

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Front portal/gestor | Next.js 16 + Tailwind 4 + shadcn | Já implantado; ótimo SSR/CDN na Vercel |
| Backend API | Next.js Route Handlers + tRPC para CRUD; Fastify workers para webhooks/IoT | tRPC dá type-safety end-to-end; Fastify lida bem com long-poll e MQTT bridge |
| Banco | Postgres 16 (Neon ou Supabase) | Multi-tenant via RLS; serverless cabe no orçamento |
| ORM | Prisma | Tipagem + migrations confiáveis |
| Cache/fila | Upstash Redis | Serverless; webhooks idempotentes; rate-limit |
| Storage | Cloudflare R2 (S3-compatible) | Vídeo barato; sem egress |
| Auth gestor | NextAuth + email/senha + TOTP | Multi-tenant nativo |
| Auth motorista | OTP por SMS (Twilio) + biometria do device | Simples e seguro |
| App motorista | **PWA** (Next.js + Workbox SW + Web Manifest) | Sem App Store/Play Store. Instala direto pelo navegador, abre em tela cheia, push notification via Web Push API. Funciona offline básico (cache de cota e check-in pendente). Cabe na mesma stack do portal — 1 dev cobre tudo |
| Smart POS | Kotlin + Android nativo | SDK Pax/Gertec é Java/Kotlin |
| IoT/Edge | Python 3.12 + FastAPI local + OpenCV | Comunidade ALPR é Python; FastAPI é leve |
| ALPR | `OpenALPR` ou `ultralytics` (YOLO + OCR custom) | YOLO + TrOCR roda no Pi 5 a 8-12 fps |
| Classificador anti-balde | YOLOv8-n custom (transferência) | Treinado em ~2k frames |
| Mensageria IoT | MQTT (Mosquitto na nuvem, mosquitto-client no Pi) com TLS mútuo | Padrão indústria, recupera offline |
| Pagamentos (v2) | Stripe + PIX (Asaas ou Pagar.me) | Confiáveis no BR |
| Observabilidade | Sentry (front+back) + Better Stack logs + Vercel Analytics | Free tiers cobrem o piloto |
| CI/CD | GitHub Actions → Vercel (web) / Expo EAS (mobile) / GHCR (IoT image) | Já temos Vercel ligado |

---

## 4. Modelo de dados (Prisma)

Multi-tenant via coluna `tenantId` + Postgres Row-Level Security.

```prisma
model Tenant {
  id          String   @id @default(cuid())
  name        String
  cnpj        String   @unique
  plan        Plan     @default(STARTER)
  createdAt   DateTime @default(now())
  users       User[]
  vehicles    Vehicle[]
  drivers     Driver[]
  yards       Yard[]
  pumps       Pump[]
  tanks       Tank[]
  routes      Route[]
  fuelings    Fueling[]
  anomalies   Anomaly[]
}

enum Plan { STARTER PRO ENTERPRISE }

model User { // gestor do portal
  id         String   @id @default(cuid())
  tenantId   String
  tenant     Tenant   @relation(fields:[tenantId], references:[id])
  email      String
  passwordHash String
  totpSecret String?
  role       UserRole @default(MANAGER)
  createdAt  DateTime @default(now())
  @@unique([tenantId, email])
}
enum UserRole { OWNER MANAGER VIEWER }

model Driver {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  cpf         String
  phone       String
  cnh         String
  score       Int      @default(100)
  active      Boolean  @default(true)
  pinHash     String?  // PIN curto pro POS
  nfcTagUid   String?  // tag NFC opcional
  vehicles    Vehicle[] @relation("CurrentDriverVehicles")
  fuelings    Fueling[]
  @@index([tenantId])
}

model Vehicle {
  id              String   @id @default(cuid())
  tenantId        String
  plate           String   // BRA-2E19
  model           String
  fuelType        FuelType
  tankCapacityL   Int
  avgConsumption  Float    // km/L histórico
  currentOdometer Int
  currentDriverId String?
  currentDriver   Driver?  @relation("CurrentDriverVehicles", fields:[currentDriverId], references:[id])
  fuelings        Fueling[]
  @@unique([tenantId, plate])
  @@index([tenantId])
}
enum FuelType { DIESEL_S10 DIESEL_S500 ARLA32 GASOLINE ETHANOL }

model Yard {
  id        String  @id @default(cuid())
  tenantId  String
  name      String
  address   String
  lat       Float
  lng       Float
  pumps     Pump[]
  tanks     Tank[]
}

model Pump {
  id              String  @id @default(cuid())
  tenantId        String
  yardId          String?
  yard            Yard?   @relation(fields:[yardId], references:[id])
  partnerStationId String? // para postos parceiros (sem yardId)
  serialNumber    String  @unique     // SGOF-MRL-0014
  iotDeviceId     String  @unique     // hardware id
  deviceVersion   String
  status          PumpStatus @default(OFFLINE)
  lastHeartbeat   DateTime?
  tankId          String?
  tank            Tank?   @relation(fields:[tankId], references:[id])
  fuelings        Fueling[]
}
enum PumpStatus { ONLINE OFFLINE MAINTENANCE BLOCKED }

model Tank {
  id          String  @id @default(cuid())
  tenantId    String
  yardId      String
  yard        Yard    @relation(fields:[yardId], references:[id])
  name        String
  fuelType    FuelType
  capacityL   Int
  pumps       Pump[]
  invoices    FiscalInvoice[]
}

model FiscalInvoice { // XML SEFAZ
  id          String   @id @default(cuid())
  tenantId    String
  tankId      String
  tank        Tank     @relation(fields:[tankId], references:[id])
  accessKey   String   @unique // chave da NFe
  supplier    String
  volumeL     Float
  valueBRL    Float
  issuedAt    DateTime
  xmlBlobUrl  String
}

model Route {
  id          String   @id @default(cuid())
  tenantId    String
  code        String   // MRL-1184
  origin      String
  destination String
  distanceKm  Float
  fuelType    FuelType
  quotaL      Float    // cota dinâmica calculada
  validUntil  DateTime
  driverId    String?
  vehicleId   String?
  fuelings    Fueling[]
}

model Fueling {
  id            String   @id @default(cuid())
  tenantId      String
  pumpId        String
  pump          Pump     @relation(fields:[pumpId], references:[id])
  vehicleId     String
  vehicle       Vehicle  @relation(fields:[vehicleId], references:[id])
  driverId      String
  driver        Driver   @relation(fields:[driverId], references:[id])
  routeId       String?
  route         Route?   @relation(fields:[routeId], references:[id])
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  quotaL        Float
  deliveredL    Float?
  odometer      Int
  status        FuelingStatus
  authorizationId String  @unique   // idempotência
  alprPlate     String?  // placa lida na câmera
  alprConfidence Float?
  videoUrl      String?
  costBRL       Float?
}
enum FuelingStatus { AUTHORIZED IN_PROGRESS COMPLETED BLOCKED CANCELLED }

model Anomaly {
  id          String   @id @default(cuid())
  tenantId    String
  fuelingId   String?
  pumpId      String
  type        AnomalyType
  severity    AnomalySeverity
  videoUrl    String?
  snapshotUrl String?
  description String
  detectedAt  DateTime @default(now())
  resolvedAt  DateTime?
  resolvedBy  String?
}
enum AnomalyType {
  CONTAINER_PATTERN
  PLATE_MISMATCH
  QUOTA_EXCEEDED
  OFFHOURS
  TANK_DRAIN
  COMM_LOSS
}
enum AnomalySeverity { LOW MEDIUM HIGH CRITICAL }

model AuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  actorType ActorType // USER, DRIVER, DEVICE, SYSTEM
  actorId   String
  action    String
  target    String
  meta      Json
  createdAt DateTime @default(now())
}
enum ActorType { USER DRIVER DEVICE SYSTEM }
```

### 4.1 Índices críticos
- `Fueling(tenantId, startedAt desc)` — dashboard / consultas recentes
- `Anomaly(tenantId, detectedAt desc, resolvedAt)` — fila de anomalias abertas
- `Vehicle(tenantId, plate)` — lookup pelo ALPR
- `Pump(iotDeviceId)` — handshake do dispositivo

---

## 5. Backend — superfície de API

Decisão: **tRPC** para todo CRUD/leitura usada pelo portal/app (type-safety); **REST + assinatura HMAC** para callbacks do dispositivo IoT (idiomático para C/Python embarcado); **MQTT** para telemetria contínua e estado da bomba.

### 5.1 Endpoints REST do dispositivo
| Método | Rota | O que faz |
|--------|------|-----------|
| POST | `/iot/handshake` | Registra device, troca chaves, retorna config |
| POST | `/iot/authorize` | Pede autorização (com plate, driver, photo) |
| POST | `/iot/heartbeat` | Cada 30s; status, temperatura, RSSI |
| POST | `/iot/event` | Evento iniciado/finalizado/abortado |
| POST | `/iot/anomaly` | Upload de vídeo + tipo + frame chave |
| GET  | `/iot/config/:deviceId` | Pulling de cota/whitelist quando offline |

Todos com `X-Device-Signature: HMAC-SHA256(secret, body)` e nonce anti-replay.

### 5.2 tRPC (portal + apps)
```ts
// rascunho
authRouter:
  - login / logout / refresh / requestPasswordReset
  - driver.requestOtp / driver.verifyOtp
tenantRouter:
  - me / settings.update
fleetRouter:
  - vehicle.list/.create/.update/.delete
  - driver.list/.create/.update/.deactivate
  - route.list/.create/.assignToVehicle/.computeQuota
yardRouter:
  - yard.list/.create/.update
  - pump.list/.create/.bindIot/.block/.unblock
  - tank.list/.create/.update
fuelingRouter:
  - list (filters: yard, plate, status, date)
  - byId
  - manualAuthorize (override de gestor)
  - cancel
anomalyRouter:
  - listOpen
  - byId
  - resolve (motivo, evidência)
  - notifyDriver
fiscalRouter:
  - invoice.list
  - invoice.importXml
  - tank.reconcileMonth (entrada XML × saída IoT)
reportRouter:
  - kpis.daily/.monthly
  - driver.ranking
  - vehicle.efficiency
```

### 5.3 MQTT topics
```
sgo/{tenantId}/pump/{pumpId}/status        ← Pi publica
sgo/{tenantId}/pump/{pumpId}/cmd           ← server publica (energizar/desligar)
sgo/{tenantId}/pump/{pumpId}/telemetry     ← Pi publica (litros, fluxo)
sgo/{tenantId}/pump/{pumpId}/alarm         ← Pi publica (anomalia detectada local)
```

---

## 6. Hardware IoT — BOM e firmware

### 6.1 Bill of Materials por bomba
| Item | Modelo sugerido | Preço (BR) |
|------|----------------|-----------|
| SBC | Raspberry Pi 5 4GB + dissipador + fonte | R$ 720 |
| Câmera | Módulo Pi cam 1080p NoIR + lente 6mm | R$ 180 |
| LED IR | Iluminador IR 850nm | R$ 35 |
| Relé SSR 25A | Fotek SSR-25DA + dissipador | R$ 85 |
| Modem 4G | USB Huawei E3372 + chip M2M | R$ 220 |
| Caixa IP65 | Plástica 200x150x90 com prensa-cabo | R$ 90 |
| Cabos / conectores / DIN | Diversos | R$ 50 |
| Mão de obra elétrica (1ª instalação) | Eletricista (1h) | R$ 280 |
| **Total por bomba** | | **R$ 1.660** |

> Volume com 20+ bombas baixa pra ~R$ 1.180/bomba (descontos OEM no relé e na câmera).

### 6.2 Firmware (Python no Pi)
- **Boot**: gera chave EC, faz handshake com `/iot/handshake`, salva token JWE.
- **Loop principal**:
  1. Câmera captura 8 fps quando há movimento (PIR ou diff óptico).
  2. ALPR roda local; placas com confiança > 0.85 entram numa fila.
  3. Ao receber comando `cmd/authorize-request` (vindo de NFC tap ou app), valida placa atual com a esperada.
  4. Se OK → energiza SSR via GPIO, publica `status=AUTHORIZED`.
  5. Classificador anti-balde roda em paralelo a cada 500ms; se confiança > 0.7 → corta SSR + publica `alarm`.
  6. Mede pulsos de fluxo (se houver sensor opcional no bocal) para gerar telemetria.
- **Modo offline**: cache 24h da whitelist; eventos vão pra SQLite local e fazem replay quando volta a rede.

### 6.3 Sensor opcional de fluxo
Se o pátio aceitar instalar, um **fluxômetro turbina** no bocal (R$ 220) elimina dependência da bomba reportar litragem. Pi conta pulsos via GPIO.

---

## 7. Visão Computacional / IA

### 7.1 ALPR (placa)
- **Modelo**: YOLOv8-nano detectando bbox da placa + TrOCR fine-tuned em placas BR (Mercosul + antigas).
- **Treinamento**: 5–10k crops de placas anotadas; data augmentation noturna e com sujeira.
- **Performance alvo**: 12 fps no Pi 5, precisão > 96% em placas a 0,5–3m com boa iluminação.

### 7.2 Classificador de recipiente (anti-balde/galão)
- **Modelo**: YOLOv8-nano com 4 classes: `tank_inlet`, `bucket`, `gallon`, `unknown`.
- **Dataset**: 2k frames reais (a coletar nas instalações do piloto) + 5k sintéticos gerados.
- **Ação**: confiança > 0.7 em `bucket`/`gallon`/`unknown` por 3 frames consecutivos → corte SSR.

### 7.3 Cota dinâmica
- **Entrada**: rota (origem, destino), perfil do veículo (consumo histórico km/L), carga, condição climática.
- **Cálculo MVP**: `cota = (distância × 1.07) / consumo_médio_24m + reserva_5%`.
- **V2**: regressão (XGBoost) treinada com histórico, ajustando por trecho/clima/peso.

### 7.4 Pipeline de treino
GitHub Action → roda no Modal/RunPod (GPU spot, R$ 0,80/h) → publica modelo no R2 → Pi puxa novo modelo no próximo `cmd/update-model`.

---

## 8. Integrações externas

| Integração | Por que | Como |
|-----------|---------|------|
| **SEFAZ NFe (XML)** | Conciliação fiscal automática de combustível | Webhook do contador OU MDe (Manifestação Destinatário) via API de empresas como Tecnospeed/eNotas |
| **Maps & roteirização** | Distância e tempo da rota para cota | Google Maps Directions ou Mapbox (R$ 0,03/req) |
| **SMS/OTP** | Login motorista | Twilio ou Zenvia |
| **WhatsApp Business** | Notificação ao motorista de bloqueio | Twilio WhatsApp ou Z-API |
| **Pagamento postos parceiros (v2)** | Liquidação automática | Stripe (cartão) + Asaas (PIX) |
| **ANP** | Validar TRR/posto parceiro | API pública ANP (preços + cadastro) |
| **Telemetria veicular (opcional)** | KM e localização sem digitação | Sascar / OnixSat / Cobli (todas têm API REST) |

---

## 9. App do motorista (PWA)

> **Decisão**: na v1 **não temos app nativo iOS/Android**. O motorista usa uma PWA — um site que se comporta como app. Em ~3s ele toca em "Adicionar à tela inicial" e fica um ícone no celular dele igualzinho a app de loja. Economiza ~R$ 25k de desenvolvimento e 4 semanas, sem perder a experiência. App nativo entra na v2 se o piloto provar tração.

### 9.1 Por que PWA dá conta
| Recurso que normalmente justifica nativo | Como resolvemos via web |
|------------------------------------------|-------------------------|
| Ícone na home, abre em tela cheia | Web App Manifest + `display: standalone` |
| Funciona offline | Service Worker (Workbox) com cache da cota, foto, check-in pendente |
| Push notification | Web Push API (Chrome Android, Safari iOS 16.4+) |
| Câmera (QR Code) | `getUserMedia` + `BarcodeDetector` API |
| NFC tap | Web NFC API (Chrome Android — não tem no iOS, fallback pra QR) |
| GPS | Geolocation API |
| Vibração | Vibration API |
| Biometria | WebAuthn (passkey) |

### 9.2 Telas (mesma URL base, ex: `app.sgo-fuel.com`)
1. **Onboarding** (CPF + OTP SMS + selfie de validação)
2. **Home** com cota da viagem, próximo ponto autorizado, rota
3. **Check-in**: escaneia QR do totem (todos celulares) OU NFC tap no POS (Android)
4. **Status do abastecimento** (loading, autorizado, em andamento, concluído)
5. **Histórico** (abastecimentos passados, score, ranking)
6. **Perfil** (CNH, contato, configurações)

### 9.3 Push notifications
- Cota expirou
- Bomba autorizada (ir pra bomba)
- Bloqueio detectado
- Anomalia criada pelo gestor que precisa de resposta

Implementação: VAPID keys no backend + `Notification.requestPermission()` no primeiro check-in.

### 9.4 Como o motorista instala
1. Acessa `app.sgo-fuel.com` (subdomínio que já fica na Vercel, custo zero)
2. Faz login com OTP SMS
3. O navegador automaticamente sugere "Adicionar à tela inicial" depois de 30s de uso
4. Pronto — ícone vermelho com a logo no Android/iOS, sem passar por loja

---

## 10. Smart POS Android

Aplicativo nativo Kotlin distribuído via:
- **Pax / Pagseguro**: store interna (Pagseguro Store ou Pax Market)
- **Gertec / Sunmi**: APK direto ou via Sunmi Store

### 10.1 Fluxos
- Posto seleciona frota cadastrada → app exibe placas autorizadas
- Tag NFC do motorista (ou QR do app) destrava a transação
- App registra hodômetro, foto do veículo, placa lida na câmera traseira do POS
- Comprovante eletrônico assinado vai para o backend; uma cópia é impressa

---

## 11. Segurança & multi-tenant

- **Tenant isolation**: Postgres RLS com `current_setting('app.tenant_id')` em todas queries via Prisma middleware.
- **Auth gestor**: NextAuth + e-mail/senha (argon2id) + TOTP obrigatório no plano PRO+.
- **Auth motorista**: OTP por SMS no primeiro login + biometria do device + refresh token rotacionado a cada 7 dias.
- **Auth dispositivo IoT**: handshake mTLS (certificado por device emitido pelo backend) + HMAC do payload + nonce sequencial em Redis (anti-replay).
- **LGPD**:
  - Vídeos retidos por 90 dias por padrão (configurável por tenant)
  - Direito de exclusão / portabilidade implementado via endpoints `/api/lgpd/...`
  - DPA assinado com fornecedores (Vercel, Neon/Supabase, Cloudflare)
- **Auditoria**: tabela `AuditLog` recebe TODO comando privilegiado.
- **Backup**: PITR habilitado no Postgres (Neon faz isso nativo) + snapshot semanal pra R2.

---

## 12. DevOps / observabilidade

- **Repos**:
  - `marra-log/sgo-fuel` — web/portal **+ PWA do motorista** no mesmo Next.js (já temos)
  - `marra-log/sgo-fuel-pos` — Android Kotlin POS
  - `marra-log/sgo-fuel-edge` — firmware Pi (Python)
- **CI/CD**: GitHub Actions
  - Web/PWA → preview por PR + auto-deploy em `main` (Vercel) — **já funcionando**
  - POS Android → Gradle build + APK assinado em release; distribuição manual no Pax Market
  - Edge → build imagem Docker → GHCR; Pi puxa via `watchtower` em janela de manutenção
- **Observabilidade**:
  - Sentry no front e back
  - Better Stack centraliza logs
  - Vercel Analytics + Web Vitals
  - Pi reporta métricas via Telegraf → InfluxDB Cloud (free tier)
- **Status page**: Better Stack status page público em `status.sgo-fuel.com`

---

## 13. Roadmap das duas fases

Não é mais "sprint de equipe". É **bloco de trabalho** entre você e Claude. Cada bloco é uma sessão (ou um conjunto de sessões) onde a gente sai com algo funcionando.

### 🧪 FASE A — Software ativo no free tier (3 a 6 semanas)

**Bloco A1 · Banco e auth de verdade** (1 sessão grande ou 2 menores)
- Criar conta Supabase (free)
- Schema Prisma completo no banco
- Conectar Next.js → Supabase
- Tela de login do gestor + cadastro de empresa (tenant)
- Critério "pronto": você consegue criar uma conta nova de gestor, fazer login, e ver um dashboard vazio (sem mocks)

**Bloco A2 · CRUDs principais via UI**
- Cadastro de motoristas (CPF, CNH, contato)
- Cadastro de veículos (placa, modelo, consumo)
- Cadastro de pátios e bombas (mesmo sem hardware ainda)
- Critério "pronto": cliente consegue cadastrar a frota dele inteira no portal

**Bloco A3 · Eventos e anomalias simulados, mas persistidos**
- Botão "simular abastecimento" que cria um registro `Fueling` real no banco
- Tela /dashboard lê eventos REAIS do banco
- Botão "simular anomalia" gera registro `Anomaly`
- Tela /anomalias lê anomalias REAIS
- Critério "pronto": apresentação ao cliente mostra dados que ele próprio criou, não mock

**Bloco A4 · Conciliação SEFAZ funcional**
- Upload manual de XML (NFe de combustível)
- Parser que extrai chave, volume, valor
- Tela /conciliacao mostra cruzamento real
- Critério "pronto": cliente sobe uma NFe sua, vê processada no portal

**Bloco A5 · Ranking e relatórios reais**
- Cálculo de km/L baseado em odômetro + litros dos `Fueling` persistidos
- Tela /ranking calcula em tempo real
- Critério "pronto": ranking se atualiza ao adicionar novos abastecimentos simulados

**Bloco A6 · PWA do motorista**
- Rota `/app` com manifest, ícone, service worker básico
- Onboarding email + senha (SMS fica pra Fase B)
- Tela de cota da viagem (atribuída pelo gestor)
- Botão "check-in" simulado (gera Fueling)
- Critério "pronto": motorista instala a PWA pelo navegador no celular dele e faz check-in

**Bloco A7 · Auditoria + multi-tenant blindado**
- Logs em todas as mutações
- RLS no Supabase pra isolar tenants
- Permissões por papel (OWNER, MANAGER, VIEWER)
- Critério "pronto": criar 2 contas de gestor de empresas diferentes e provar que uma não vê dados da outra

---

### ⚙️ FASE B — Hardware e SaaS pagos (só quando A estiver pronta)

**Bloco B1 · Protótipo IoT em bancada (1 kit)**
- Comprar 1 Pi 5 + câmera + SSR + lâmpada de teste
- Firmware Python: ALPR offline, GPIO acendendo a lâmpada quando placa autoriza
- Conta HiveMQ + bridge no backend
- Critério "pronto": fala "BRA-2E19" pra câmera, lâmpada acende

**Bloco B2 · Loop fechado fim-a-fim**
- Endpoints REST do device (handshake, authorize, event, anomaly)
- Portal recebe evento real do Pi e mostra no /dashboard
- PWA motorista solicita autorização, Pi recebe via MQTT, autoriza
- Critério "pronto": fluxo completo motorista→portal→Pi→bomba em bancada

**Bloco B3 · IA classificador anti-balde v1**
- Coletar 1.000 frames reais no pátio Marralog (1 dia de filmagem)
- Treinar YOLOv8-n no Modal (R$ 5 por treino)
- Deploy do modelo no Pi
- Critério "pronto": balde no enquadramento corta a bomba em < 1s

**Bloco B4 · Instalação no pátio piloto**
- Eletricista certificado, laudo, EPI
- 1 bomba primeiro, 24h de observação
- Smart POS Kotlin (MVP) pros postos parceiros
- Critério "pronto": primeira transação real autorizada e bloqueio real funcionando

**Bloco B5+ · Hardening**
- Multi-bomba, telemetria veicular, pagamento PIX, app nativo, white-label
- Tudo só se o piloto provar tração comercial

---

## 14. Custos reais nas duas fases

### 14.1 Fase A — Software em free tier (você + Claude)

**Equipe**: você + Claude. Custo R$ 0.

**Infra**: tudo no free tier dos SaaS, que cobre folgado o que precisamos pra rodar protótipo funcional com 1 cliente real.

| Item | Plano usado | Limite do free tier | O que cabe |
|------|-------------|---------------------|------------|
| **Vercel** (site + API) | Hobby (free) | 100 GB de banda/mês, deploys ilimitados | Domínio público + apps internos |
| **Supabase** (Postgres + Auth + Storage + Realtime) | Free | 500 MB de banco, 1 GB storage, 50k usuários ativos/mês, 2 GB transfer | Schema completo + auth real + bucket pra fotos pequenas |
| **GitHub** (repos privados) | Free | Ilimitado | `sgo-fuel` já existe |
| **Cloudflare** (DNS + e-mail) | Free | Domínio próprio (se comprar) | `sgo-fuel.com.br` apontando pra Vercel |
| **Domínio `.com.br`** (opcional) | Registro.br | R$ 40/ano (~R$ 3,30/mês) | Único custo possível da Fase A — e mesmo assim só se você quiser sair do `.vercel.app` |
| **Total recorrente** | | | **R$ 0 a R$ 3/mês** |

> **Resultado da Fase A**: cliente abre `sgo-fuel.com.br` (ou `sgo-fuel.vercel.app`), cria conta, cadastra empresa, motoristas e veículos, vê eventos simulados sendo gravados em Postgres real. O sistema **inteiro** funciona — só não tem hardware físico cortando bomba ainda. Pra demo comercial e para o cliente acreditar no produto, isso é suficiente.

### 14.2 Fase B — Só quando ativar hardware em campo

Aqui entra o custo. **Só começa quando Fase A estiver pronta E você tiver assinado o piloto com um frotista**, porque o custo passa a fazer sentido (o piloto paga uma parte; o resto é investimento no produto).

| Item | Quando entra | Custo |
|------|-------------|-------|
| 10 kits IoT (Pi 5 + câmera + SSR + modem + instalação) | Antes da instalação no pátio piloto | **R$ 16.600** (único) |
| HiveMQ Cloud Starter (MQTT) | Quando primeiro totem for ligado | R$ 270/mês |
| Twilio (SMS de login) | Quando 1º motorista for cadastrado | R$ ~250/mês (varia com consumo) |
| Upgrade Supabase Pro **ou** migrar pra Neon | Quando passar de 500 MB de banco ou 1 GB de storage | R$ 165/mês |
| Cloudflare R2 (vídeo) | Quando começar a guardar vídeo das anomalias | R$ 80/mês |
| Sentry Team | Quando o sistema sair de protótipo pra produção | R$ 145/mês |
| Mapbox | Quando cálculo de cota dinâmica entrar em uso | R$ 200/mês |
| Modal (treino IA esporádico) | Quando re-treinar o modelo anti-balde | R$ 150/mês média |
| **Total Fase B** | | **~R$ 1.260/mês** + **R$ 16.600** único |

### 14.3 Quando cada item é dispensável

| Item | Pode adiar até... |
|------|--------------------|
| HiveMQ | Quando tiver mais de 1 totem instalado |
| Twilio | Pode começar com login email/senha; SMS entra na v1.1 |
| R2 | Pode usar Supabase Storage até bater limite |
| Sentry | Pode começar com `console.error` no Vercel logs |
| Mapbox | Pode começar com cota fixa por rota cadastrada manualmente |
| Modal | Só quando precisar re-treinar; até lá usa modelo pré-treinado |

> Na prática, dá pra ir só com **Supabase Pro (R$ 165) + HiveMQ (R$ 270) + Twilio (R$ 250) = R$ 685/mês** e adicionar o resto conforme escalar.

---

## 15. Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| ALPR falha em placas sujas/escuras | Média | Alta | Iluminador IR + fallback pra confirmação manual via POS/app |
| Eletricista da concessionária recusar instalação | Baixa | Alta | Laudo elétrico assinado + relé certificado; instalação supervisionada |
| Falsos positivos do anti-balde irritam motorista | Alta | Média | Threshold ajustável por bomba; gestor revisa em 24h; aprendizado contínuo |
| Conexão 4G cai no pátio | Média | Média | Modo offline com cache 24h + replay; WiFi backup |
| Posto parceiro não aceita instalar app | Média | Alta | Comissão 0,5% sobre litragem como incentivo + suporte 24/7 piloto |
| LGPD: vídeo do motorista | Média | Alta | DPA + consentimento na admissão + retenção limitada |
| Variação cambial em hardware importado | Média | Baixa | Pi 5 nacional via Curto Circuito; lock-in 30 dias |

---

## 16. Próximos passos imediatos — começam HOJE, sem custo

Como **não tem equipe contratada** e **não vamos comprar hardware ainda**, a partida da Fase A acontece neste repo, com sessões comigo.

### Os 3 passos pra você fazer (5 minutos, gratuito)
1. **Criar conta gratuita no Supabase**: `https://supabase.com/dashboard` → Sign up com o e-mail `aetherai.agentes@gmail.com` ou `transportes.marralog@gmail.com` → criar projeto `sgo-fuel` na região `South America (São Paulo)` → me passar a `Project URL` e a `anon key` (estão em Settings → API).
2. **Confirmar nome do tenant inicial**: vai ser "Marralog Transportes"? (pode ser qualquer coisa, é só pra primeira conta de exemplo).
3. **Decidir domínio**: quer registrar `sgo-fuel.com.br` (R$ 40/ano no Registro.br) ou seguir em `sgo-fuel.vercel.app` por enquanto?

### Os passos que eu (Claude) faço assim que você responder
1. Adiciono Prisma ao repo com o schema completo (`prisma/schema.prisma`)
2. Crio `/src/lib/db.ts` apontando pro Supabase
3. Implemento auth (login do gestor) usando Supabase Auth
4. Crio página `/login` e `/cadastro`
5. Transformo `/dashboard` numa tela que **lê dados reais** (vazios no início, mas reais)
6. Faço deploy, validamos que abre o login e dá pra criar conta

Aí entramos no **Bloco A2** e começamos a substituir os mocks tela por tela.

**Custo até esse ponto: R$ 0.**

---

**Autor**: Equipe Aether IA · Marralog
**Última atualização**: 29/05/2026
**Versão do documento**: 1.0
