# APK da Smart POS e do Totem IoT (TWA)

O SGO-Fuel é um PWA. Para instalar nas máquinas físicas (Smart POS Android e
Totem IoT) como **app nativo**, empacotamos o site num **APK TWA** (Trusted Web
Activity). Não há código novo — o APK só abre o site em tela cheia, com NFC e
impressora do aparelho disponíveis.

> Pré-requisito de hardware: usar **Smart POS / Totem com Android ABERTO
> (desbloqueado)** — Sunmi P2/V2 Pro, PAX A920, Gertec GPOS700. As travadas de
> adquirente (Cielo/Stone) só rodam o app da própria adquirente.

## O que já está pronto no projeto

- **Dois manifests PWA dedicados** (cada um vira um APK):
  - POS → [`/pos.webmanifest`](../public/pos.webmanifest) — abre em `/maquininha`.
  - Totem → [`/totem.webmanifest`](../public/totem.webmanifest) — abre em `/totem`.
- **Verificação de domínio** para o TWA abrir sem barra do navegador:
  [`/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json)
  (troque o `sha256_cert_fingerprints` pela impressão digital da sua chave).

## Caminho rápido (sem instalar nada) — PWABuilder

1. Acesse https://www.pwabuilder.com e informe a URL:
   - POS: `https://sgo-fuel.vercel.app/maquininha`
   - Totem: `https://sgo-fuel.vercel.app/totem`
2. Em **Manifest**, aponte para `/pos.webmanifest` (ou `/totem.webmanifest`).
3. Clique **Package For Stores → Android → Generate**.
4. Baixe o `.apk` (teste) ou `.aab` (loja) + o arquivo `assetlinks.json` gerado.
5. Copie o **SHA-256** do `assetlinks.json` gerado para o nosso
   [`public/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json),
   faça commit e deploy (assim o app abre em tela cheia, sem barra de URL).
6. Instale o `.apk` na máquina (ver “Instalar” abaixo).

## Caminho controlado — Bubblewrap (CLI)

```bash
npm i -g @bubblewrap/cli
# POS
bubblewrap init --manifest https://sgo-fuel.vercel.app/pos.webmanifest
bubblewrap build          # gera app-release-signed.apk + assetlinks
# Totem (em outra pasta)
bubblewrap init --manifest https://sgo-fuel.vercel.app/totem.webmanifest
bubblewrap build
```

Pegue o SHA-256 com:
```bash
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```
e cole no nosso `assetlinks.json`.

## Instalar na máquina

- Habilite **Fontes desconhecidas** (Configurações → Segurança).
- Copie o `.apk` por USB/cartão e toque para instalar, **ou**
  `adb install app-release-signed.apk`.
- Defina como **app de quiosque** (launcher) se a POS suportar, para abrir
  sozinho ao ligar.

## NFC e impressão

- **NFC**: o leitor contactless embutido lê o cartão branco por aproximação via
  **Web NFC** (Chrome/WebView Android). Já usado em POS, Totem e app do motorista.
- **Impressão térmica do comprovante**: o navegador não imprime direto na bobina.
  Para sair no papel, use o **SDK de impressora do fabricante** (Sunmi/PAX) num
  wrapper — fase seguinte. Hoje o comprovante aparece na tela e pode ser
  compartilhado/`window.print()`.

## Alternativa mais simples (sem APK)

Abrir o **Chrome do aparelho** na URL (`/maquininha` ou `/totem`) e usar
**“Adicionar à tela inicial”**. Vira um ícone com cara de app e o NFC funciona —
só não fica em tela 100% cheia como o APK.
