# Plano de Execução — SGO-Fuel · Aether IA

> **De: demo estática.** **Para: produto operando em pátios e postos parceiros, com backend, banco, IoT físico e IA em produção.**

Documento vivo. Cada seção foi escrita para virar issue/épico no GitHub Projects ou Linear sem retrabalho.

---

## 0. Sumário executivo

| Item | Decisão |
|------|---------|
| **MVP útil em produção** | 12 semanas (3 sprints de 4 semanas) |
| **Pátio piloto** | 1 base Marralog + 1 transportadora-cliente |
| **Postos parceiros piloto** | 3 a 5 postos em corredor logístico (BR-381 / BR-040) |
| **Frotas-alvo no piloto** | 30 a 80 placas |
| **Custo por bomba (hardware OPEX)** | R$ 1.180 (Pi 5 + câmera IR + SSR + modem) |
| **Custo de backend mensal (até 100 bombas)** | ~R$ 350 (Postgres gerenciado + Vercel + storage de vídeo S3) |
| **Equipe mínima MVP** | 1 PM/produto, 2 devs full-stack, 1 dev IoT/IA, 1 designer 50% |
| **App do motorista** | **PWA** (sem iOS/Android nativo na v1 — economiza ~R$ 25k e 4 semanas) |

### 0.1 ⚠️ Não confunda: pitch × orçamento

| Você vai falar com... | Use estes números |
|------|------|
| **Cliente final** (frotista comprando a solução) | Pitch comercial: **R$ 1.500/bomba** (setup) · **R$ 89/bomba/mês** (assinatura) · economia ~5–8% do consumo (R$ 23k/mês numa frota de 50k L) — esses são os números do site/`page.tsx` e do PDF que o sócio mandou |
| **Sócio / investidor / banco** (financiando o desenvolvimento) | Orçamento de produto: **R$ 159.640** para 12 semanas de desenvolvimento + 10 kits de protótipo + 3 meses de infra SaaS. É um **CAPEX único** que vira o ativo "produto pronto pra vender" |

Os R$ 1.500 do hardware são o **custo unitário operacional por cliente novo**. Eles não pagam o desenvolvimento — pagam só o material que vai junto com cada bomba ativada depois que o produto existir. O desenvolvimento do produto em si está na seção 14.

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

## 13. Roadmap por sprint (12 semanas para MVP)

### Sprint 1 (semanas 1–4): Fundação
- [ ] Setup Prisma + Postgres (Neon) + migrations iniciais
- [ ] Auth NextAuth multi-tenant
- [ ] CRUDs: tenant, user, driver, vehicle, yard, pump, tank
- [ ] Portal: substituir mocks por dados reais nas telas já existentes
- [ ] Importador SEFAZ (parser XML local; upload manual)
- [ ] Protótipo IoT no Pi (ALPR + relé GPIO ligando lâmpada de teste)
- [ ] CI/CD funcionando para web

### Sprint 2 (semanas 5–8): Loop fechado
- [ ] MQTT broker (HiveMQ Cloud) + bridge no backend
- [ ] Endpoints REST do device (handshake, authorize, event, anomaly)
- [ ] **PWA do motorista** — rota `/app` no mesmo Next.js: manifest, SW, onboarding OTP, check-in via QR
- [ ] Firmware Pi consumindo cota e autorizando
- [ ] Classificador anti-balde — primeira versão (precisão alvo 85%+)
- [ ] Portal: visualização ao vivo de eventos (SSE)
- [ ] Conciliação SEFAZ automática (cron mensal)

### Sprint 3 (semanas 9–12): Piloto operacional
- [ ] Smart POS app (Kotlin) MVP — cadastro de posto, transação NFC, comprovante
- [ ] Cota dinâmica v1 (regra + maps directions)
- [ ] Anti-balde v2 (treinada com dados reais coletados nas semanas 5–10)
- [ ] Storage de vídeo no R2 + thumbnails + signed URLs
- [ ] Auditoria completa + LGPD endpoints
- [ ] Observabilidade ligada
- [ ] **Instalação na 1ª bomba do pátio Marralog**
- [ ] **Onboarding do primeiro posto parceiro**

### Sprint 4+ (semanas 13+): Hardening
- Multi-bomba, múltiplos pátios
- Roteirização avançada
- Pagamento PIX para postos parceiros
- Telemetria veicular (Sascar/Cobli)
- **App nativo Android/iOS** (Expo) com Web NFC mais robusto, offline-first agressivo, deep-link com o POS — **só entra se o piloto provar tração**
- White-label para outras transportadoras

---

## 14. Equipe e estimativa de custo

> **Importante**: este é o **investimento único para construir o produto** (CAPEX de desenvolvimento), pago em 3 meses. Depois disso, cada cliente novo paga só o hardware dele (R$ 1.500/bomba) + assinatura mensal — quem vira o caixa pra cobrir e amortizar o desenvolvimento.

### 14.1 Equipe MVP (12 semanas) — sem mobile nativo, PWA cabe na conta do full-stack

| Papel | Alocação | Custo/mês (PJ) | Total 3 meses |
|-------|----------|-----|----------------|
| PM / Produto | 50% | R$ 6.000 | R$ 9.000 |
| Tech lead full-stack (portal + PWA + tRPC + Prisma) | 100% | R$ 16.000 | R$ 48.000 |
| Dev full-stack (CRUDs + integrações SEFAZ/Maps + POS Android) | 100% | R$ 11.000 | R$ 33.000 |
| Dev IoT/IA (Python + visão computacional + firmware Pi) | 100% | R$ 14.000 | R$ 42.000 |
| Designer Product | 25% | R$ 9.000 | R$ 6.750 |
| **Subtotal pessoas** | | | **R$ 138.750** |

### 14.2 Infra MVP (3 meses) — todas as contas SaaS já mapeadas na seção 2.2

| Item | Onde fica | Custo/mês | 3 meses |
|------|-----------|-----------|---------|
| Vercel Pro (portal + PWA + API + funções) | `vercel.com/marralog-s-projects` (já temos) | R$ 110 | R$ 330 |
| Neon Postgres (banco principal) | conta nova `neon.tech` | R$ 165 | R$ 495 |
| Upstash Redis (fila + cache) | conta nova `upstash.com` | R$ 60 | R$ 180 |
| Cloudflare R2 (vídeo das anomalias) | conta nova `cloudflare.com` | R$ 80 | R$ 240 |
| HiveMQ Cloud (MQTT broker dos totens) | conta nova `hivemq.com` | R$ 270 | R$ 810 |
| Sentry Team (monitoramento de erro) | conta nova `sentry.io` | R$ 145 | R$ 435 |
| Twilio (SMS de login do motorista) | conta nova `twilio.com` | R$ 250 | R$ 750 |
| Mapbox (distância de rota) | conta nova `mapbox.com` | R$ 200 | R$ 600 |
| Modal (treino esporádico da IA) | conta nova `modal.com` | R$ 150 | R$ 450 |
| **Subtotal infra** | | **~R$ 1.430/mês** | **R$ 4.290** |

> No total são **8 contas SaaS novas + Vercel que já existe**. Cada uma é um cadastro Google + 1 cartão. Nenhum servidor próprio, nenhum administrador de banco, nenhum Linux pra zelar.

### 14.3 Hardware piloto (10 bombas)
- 10 kits × R$ 1.660 = **R$ 16.600**
  (Pi 5 + câmera IR + relé SSR + modem 4G + caixa IP65 + mão de obra elétrica)

### 14.4 Total estimado MVP

| Bloco | Valor |
|-------|-------|
| Equipe (12 semanas) | R$ 138.750 |
| Infra SaaS (3 meses) | R$ 4.290 |
| Hardware do piloto (10 bombas) | R$ 16.600 |
| **Total** | **R$ 159.640** |

Após o MVP, **custo operacional por cliente novo** é apenas:
- **R$ 1.500/bomba** (material que sai do bolso do cliente, não da Marralog)
- **R$ ~14/bomba/mês** de infra rateada (até 100 bombas; cai abaixo de R$ 6 acima de 500)
- Equipe técnica passa a operar como SaaS team (suporte + features novas) e não como time de desenvolvimento inicial

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

## 16. Próximos passos imediatos (esta semana)

1. **Definir piloto** — escolher 1 pátio Marralog + 2 postos parceiros + 30 placas elegíveis. Owner: PM.
2. **Criar projeto Neon** e rodar primeira migration do schema acima. Owner: Tech lead.
3. **Setup Prisma + auth + um CRUD ponta-a-ponta** (Drivers) substituindo o mock atual da tela `/dashboard`. Owner: Dev full-stack.
4. **Comprar 1 kit IoT** (Pi 5 + câmera + SSR + modem) para protótipo de bancada. Owner: Dev IoT.
5. **Coletar dataset inicial** de placas e bicos de bomba (filmar 1 dia inteiro no pátio existente). Owner: Dev IoT + operações.
6. **Aprovar orçamento** R$ 159,6k MVP (138,7k pessoas + 4,3k infra 3m + 16,6k hardware piloto). Owner: Sócios.

> Quando aprovado o item 6, o repo `sgo-fuel` recebe um PR criando os diretórios `/prisma`, `/src/server`, `/src/lib/auth` — e o demo estático começa a ler do Postgres uma tela por vez.

---

**Autor**: Equipe Aether IA · Marralog
**Última atualização**: 29/05/2026
**Versão do documento**: 1.0
