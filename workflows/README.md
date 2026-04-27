# 📁 Workflows n8n - Nenufar Marketing Automation

Esta carpeta contiene los 5 workflows activos que componen el sistema de automatización de marketing para Nenufar.

## 🎯 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUNA MULTI-AGENT SYSTEM v2                  │
│                    Interfaz Telegram con AI                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LUNA WEBHOOK RECEIVER                         │
│                  Recepciona aprobaciones                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ IMAGE V2      │    │  PUBLISHER    │    │  FEEDBACK     │
└───────────────┘    └───────────────┘    └───────────────┘
```

## 📋 Workflows

### 1. Luna Multi-Agent System v2
**Archivo:** `luna-multi-agent-v2.json`
**ID:** `mKssn8hROxLNWWVH`
**Propósito:** Orquestador principal con interfaz Telegram

**Características:**
- Ultimate Assistant con eco-poetic voice (español colombiano)
- Google Gemini 2.5 Flash como LLM
- Think + Calculator tools
- Simple Memory (Buffer Window)
- Support para texto y voz

**Credenciales:**
- Google Generative AI
- Telegram API

### 2. Luna Webhook Receiver
**Archivo:** `luna-webhook-receiver.json`
**ID:** `EPslgKTzkbLcxdrs`
**Propósito:** Recibe aprobaciones de Luna y distribuye tasks

**Características:**
- Webhook con validación HMAC
- Redis Queue (Upstash)
- Distribuye tasks a workers

**Credenciales:**
- Upstash Redis Queue

### 3. Luna Image Processor Worker v2
**Archivo:** `luna-image-processor-v2.json`
**ID:** `3JGieW6MBlANnaud`
**Propósito:** Procesa imágenes con marca de agua Nenufar

**Características:**
- Descarga desde Google Drive
- Redimensiona (FB: 1080x1080, IG: 1080x1350)
- Aplica watermark

**Credenciales:**
- Google Drive

### 4. Luna Social Publisher Worker
**Archivo:** `luna-social-publisher.json`
**ID:** `dENMnialkmtgKCo7`
**Propósito:** Publica en Instagram y Facebook

**Características:**
- Facebook/Instagram Graph API
- Publica captions con hashtags
- Soporte multi-plataforma

**Credenciales:**
- Facebook Graph API

### 5. Luna Feedback and Logging Worker
**Archivo:** `luna-feedback-logging.json`
**ID:** `v7j1Dv1mgO5ZUgmG`
**Propósito:** Logging en Supabase y notificaciones

**Características:**
- Registra execution en Supabase
- Envía notificaciones vía Telegram
- Track de analytics

**Credenciales:**
- Supabase
- Telegram API

## 🔧 Credenciales Requeridas

| Credencial | Tipo | Workflows que la usan |
|------------|------|----------------------|
| Google Generative AI | googlePalmApi | Multi-Agent v2 |
| Telegram API | telegramApi | Multi-Agent v2, Feedback |
| Upstash Redis Queue | redis | Webhook Receiver, Image V2, Publisher |
| Google Drive | googleDriveOAuth2Api | Image Processor v2 |
| Facebook Graph API | facebookGraphApi | Social Publisher |
| Supabase | supabaseApi | Feedback Worker |
| Header Auth | httpHeaderAuth | Webhooks |

## 📦 Instalación

Para importar estos workflows en tu instancia n8n:

1. Ve a n8n → Workflows → Import from File
2. Selecciona el archivo JSON correspondiente
3. Configura las credenciales necesarias
4. Activa el workflow

## ⚠️ Notas Importantes

- **Orden de activación:** Activar primero los workers (Webhook Receiver, Image Processor, Social Publisher, Feedback) y luego el Multi-Agent System
- **Variables de entorno:** Configurar `.env.production` con las credenciales correctas
- **Redis Queue:** Asegurarse de que Upstash Redis esté configurado correctamente
- **Webhook URLs:** Las URLs de webhook pueden variar según la configuración de tu instancia n8n

## 🚀 Testing

Para probar el sistema:

1. Envía un mensaje al bot de Telegram
2. Verifica que Ultimate Assistant responda en español colombiano
3. Prueba la generación de captions con eco-poetic voice
4. Verifica el flujo completo hasta publicación (si está configurado)

## 📈 Métricas

- **Total workflows:** 5
- **Total nodos:** 31
- **Credenciales:** 7
- **Conexiones:** 20+
- **Triggers:** 2 (Telegram, Webhook)

---

**Última actualización:** 2026-04-27
**Estado:** ✅ Production ready
