# 📊 Estado Actual de Workflows n8n

**Fecha:** 2026-04-27
**Instancia:** https://n8n-stack-prod-dev.duckdns.org/
**Total workflows activos:** 5

## 🎯 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUNA MULTI-AGENT SYSTEM v2                  │
│                    (mKssn8hROxLNWWVH - ACTIVO)                  │
├─────────────────────────────────────────────────────────────────┤
│  Telegram Trigger → Switch → [Set Text/Download Voice]         │
│                                              ↓                   │
│                            Ultimate Assistant (Gemini 2.5 Flash) │
│                                              ↓                   │
│                            [Think + Calculator + Memory]         │
│                                              ↓                   │
│                                  Telegram Response               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LUNA WEBHOOK RECEIVER                         │
│                  (EPslgKTzkbLcxdrs - ACTIVO)                    │
├─────────────────────────────────────────────────────────────────┤
│  Recibe aprobaciones → Procesa → Distribuye a workers          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ IMAGE V2      │    │  PUBLISHER    │    │  FEEDBACK     │
│ (3JGieW6MB...) │    │ (dENMnial...)  │    │ (v7j1Dv1m...) │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ - Download    │    │ - Graph API   │    │ - Supabase    │
│ - Resize      │    │ - Instagram   │    │ - Telegram    │
│ - Watermark   │    │ - Facebook    │    │ - Logging     │
└───────────────┘    └───────────────┘    └───────────────┘
```

## 📋 Workflows Activos

### 1. Luna Multi-Agent System v2
**ID:** `mKssn8hROxLNWWVH`
**Estado:** ✅ Active
**Nodos:** 14
**Propósito:** Orquestador principal con interfaz Telegram

**Características:**
- Ultimate Assistant con eco-poetic voice (español colombiano)
- Google Gemini 2.5 Flash como LLM principal
- Think + Calculator tools
- Simple Memory (Buffer Window) para contexto conversacional
- Support para texto y voz (transcripción simplificada)

**Credenciales:**
- Google Generative AI (rsmfm7SxKkXhJrxp)
- Telegram API (Qnh5jmW5sNzjGjrY)

### 2. Luna Webhook Receiver
**ID:** `EPslgKTzkbLcxdrs`
**Estado:** ✅ Active
**Nodos:** 4
**Propósito:** Recibe aprobaciones de Luna y distribuye tasks

**Características:**
- Webhook trigger con validación de firma
- Redis Queue (Upstash)
- Distribuye tasks a workers

**Credenciales:**
- Upstash Redis Queue (0Kt51mAkW9dMB3aj)

### 3. Luna Image Processor Worker v2
**ID:** `3JGieW6MBlANnaud`
**Estado:** ✅ Active
**Nodos:** 5
**Propósito:** Procesa imágenes con marca de agua Nenufar

**Características:**
- Descarga media desde Google Drive
- Redimensiona (FB: 1080x1080, IG: 1080x1350)
- Aplica watermark Nenufar

**Credenciales:**
- Google Drive (IJGx4YEq7DBtHbZM)

### 4. Luna Social Publisher Worker
**ID:** `dENMnialkmtgKCo7`
**Estado:** ✅ Active
**Nodos:** 5
**Propósito:** Publica en Instagram y Facebook

**Características:**
- Facebook/Instagram Graph API
- Publica captions con hashtags
- Soporta múltiples plataformas

**Credenciales:**
- Facebook Graph API (Y0zhyBRQq2yAnA31)

### 5. Luna Feedback and Logging Worker
**ID:** `v7j1Dv1mgO5ZUgmG`
**Estado:** ✅ Active
**Nodos:** 3
**Propósito:** Logging en Supabase y notificaciones

**Características:**
- Registra execution en Supabase
- Envía notificaciones vía Telegram
- Track de analytics

**Credenciales:**
- Supabase (xX5CZKJLuLoSqfGG)
- Telegram API (Qnh5jmW5sNzjGjrY)

## 🗑️ Workflows Eliminados (Cleanup)

Los siguientes workflows fueron eliminados durante la migración:

| Workflow | ID | Razón |
|----------|-----|-------|
| Luna Multi-Agent System v1 | TasuK8cfPqa2ob8O | Reemplazado por v2 |
| Multi Agent System Benefits | mKssn8hROxLNWWVH | Template adaptado a v2 |
| Strategic Planner Agent | - | No necesario |
| Content Calendar Agent | - | No necesario |
| Optimal Time Calculator | - | No necesario |
| Nenufar Brand Agent | - | Integrado en Ultimate Assistant |
| Nenufar Content Agent | - | Integrado en Ultimate Assistant |
| Nenufar Approval Agent | - | Integrado en Ultimate Assistant |

## 🔧 Credenciales Configuradas

| Credencial | ID | Tipo | Uso |
|------------|-----|------|-----|
| Nenufar Facebook Graph API | Y0zhyBRQq2yAnA31 | facebookGraphApi | Social Publisher |
| Upstash Redis Queue | 0Kt51mAkW9dMB3aj | redis | Webhook Receiver |
| Google Generative AI | rsmfm7SxKkXhJrxp | googlePalmApi | Multi-Agent v2 |
| Telegram account | Qnh5jmW5sNzjGjrY | telegramApi | Multi-Agent v2, Feedback |
| Supabase account | xX5CZKJLuLoSqfGG | supabaseApi | Feedback Worker |
| Google Drive account | IJGx4YEq7DBtHbZM | googleDriveOAuth2Api | Image Processor v2 |
| Header Auth account | kKHR1K1b41LwCGBF | httpHeaderAuth | Webhooks |

## 📈 Métricas del Sistema

**Workflows:** 5 activos
**Nodos totales:** 31
**Credenciales:** 7 configuradas
**Conexiones:** 20+
**Triggers:** 2 (Telegram, Webhook)

## 🚀 Próximos Pasos

1. **Testing end-to-end:** Probar flujo completo desde Telegram hasta publicación
2. **Monitor 24h:** Observar comportamiento en producción
3. **Optimizar prompts:** Ajustar system messages si es necesario
4. **Añadir Analytics Agent:** Métricas de engagement (futuro)
5. **Implementar RAG:** Supabase para contexto de marca (futuro)

## 📝 Notas de Configuración

### Multi-Agent System v2
- **No requiere** OpenAI API (usa Google Generative AI)
- **No requiere** OpenRouter API (eliminado)
- **Soporta voz** pero transcripción está simplificada (sin Whisper)
- **Memory** por conversación con Buffer Window

### Workers
- Operan independientemente del sistema multi-agent
- Se activan vía webhook desde Webhook Receiver
- No necesitan triggers propios

---

**Última actualización:** 2026-04-27
**Estado:** ✅ Production ready
**Riesgo:** Bajo
