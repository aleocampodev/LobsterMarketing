# Implementation Plan: Nenufar Marketing Automation System

## 🎯 Overview

Sistema automatizado de marketing para Nenufar que integra generación de contenido con IA (OpenClaw) y automatización de workflows (n8n).

**Arquitectura:** Brain & Arms
- **Brain (OpenClaw):** Estrategia, copywriting, toma de decisiones (Oracle Cloud)
- **Arms (n8n):** Procesamiento de imagen, watermark, publicación (Google Cloud)

---

## 📚 Epics

### ✅ ip-001: Infrastructure Setup
**Archivo:** `ip-001-infrastructure.md`
**Estado:** Completado
**Objetivo:** Configurar infraestructura en la nube (Oracle Cloud, Google Cloud, Supabase, Upstash Redis)

**Componentes:**
- Oracle Cloud (Always Free Tier) - OpenClaw Server
- Google Cloud e2-micro - n8n con Queue Mode
- Supabase Cloud - PostgreSQL + Vector Store
- Upstash Redis - Message Broker

---

### ✅ ip-002: The Brain - OpenClaw Server
**Estado:** Completado
**Objetivo:** Construir la capa de inteligencia (Luna) que maneja estrategia y copywriting

**Sub-epics:**

#### ip-002.1: Environment and Connectivity
- [x] Instalar Python 3.10+ en Oracle ARM
- [x] Configurar `.env.production` con API keys
- [x] Implementar FastAPI con health check

#### ip-002.2: RAG Brain (Brand Memory)
- [x] Ejecutar SQL para tablas `brand_knowledge` y `brand_prompts`
- [x] Verificar acceso a archivos locales (`SOUL.md`, `IDENTITY.md`)
- [x] Integrar Luna con voz de marca

#### ip-002.3: Ingestion from Google Drive
- [x] Configurar "Watcher" en n8n para detectar nuevas fotos/videos
- [x] Recuperar metadata (nombre, fecha) y enviar thumbnail a Luna

#### ip-002.4: Visual Analysis and Generation
- [x] Enviar imagen a Gemini 1.5 Flash para extraer materiales, colores, técnicas
- [x] Búsqueda semántica en Supabase para recuperar "Poema Tejido"
- [x] Construir caption final + hashtags optimizados

#### ip-002.5: Control Interface (Telegram)
**Archivo:** `ip-002.5-telegram-interface.md`
- [x] Luna envía propuesta por Telegram (foto + caption)
- [x] Botones de acción: ✅ Aprobar | 🔄 Ajustar | ❌ Descartar
- [x] Multi-Agent System con 4 agentes especializados
- [x] Integración con n8n workflows

#### ✨ ip-002.6: Brand Assets & Content Resources (NUEVO)
**Archivo:** `ip-002.6-brand-assets.md`
- [x] Documentar banco de prompts (`RAG_PROMPTS.md`)
- [x] Especificar configuración de watermark
- [x] Definir specs de imagen por red social
- [x] Centralizar recursos de marca

---

### ✅ ip-003: The Arms - n8n Workflows
**Archivo:** `ip-003-n8n-workflows.md`
**Estado:** Completado
**Objetivo:** Automatizar tareas mecánicas de descarga, procesamiento y publicación

**Workflows Activos:**

#### ip-003.1: n8n Orchestrator - Redis Queue Delegation
**Workflow:** Luna Webhook Receiver (EPslgKTzkbLcxdrs)
- [x] Webhook receiver con validación HMAC
- [x] Redis Queue node para delegar procesamiento
- [x] Configurar WEBHOOK_SECRET
- [x] Activo en producción

#### ip-003.2: n8n Worker - Image Processing
**Workflow:** Luna Image Processor Worker (yGrcQFekZSnWUlDF)
- [x] Google Drive node: Descargar media
- [x] Resize: FB (1080x1080) / IG (1080x1350)
- [x] Watermark: Logo Nenufar esquina inferior-right, 15% opacidad
- [x] Activo en producción

#### ip-003.3: n8n Worker - Social Media Publishing
**Workflow:** Luna Social Publisher Worker (NlSGA3RcvMw6oC3h)
- [x] Webhook Trigger + Parse Publish Data
- [ ] **PENDIENTE:** Instagram Graph API node
- [ ] **PENDIENTE:** Facebook Graph API node
- [ ] **PENDIENTE:** Meta credentials configuration

#### ip-003.4: n8n Worker - Feedback and Logging
**Workflow:** Luna Feedback and Logging Worker (v7j1Dv1mgO5ZUgmG)
- [x] Log en Supabase (tabla `posts`)
- [x] Notificación Telegram con link al post
- [x] Activo en producción

---

### 🔄 Strategic Scheduling Workflows (NUEVOS)
**Estado:** Creados, pendientes de activar
**Objetivo:** Publicación estratégica basada en SOUL.md y engagement histórico

#### Luna Strategic Planner (JmdJ55BgH78SxrbA)
- Analiza tipo de contenido (social, educativo, niños, marca)
- Lee estrategia de 7 días de SOUL.md
- Calcula `scheduled_at` basado en hora óptima
- Envía post al Content Calendar

#### Luna Content Calendar (bqCJqrILwIEIdIeQ)
- Webhook: Recibe posts programados
- Guarda en Supabase `content_calendar`
- Schedule Trigger cada 5 minutos
- Busca posts debidos y dispara Publisher Worker

#### Luna Optimal Time Calculator (xThfzbv3U8NI0ncj)
- Analiza engagement últimos 30 días
- Calcula promedio likes + comments por día/hora
- Combina datos históricos con estrategia SOUL.md
- Retorna top 5 mejores horas

---

### ⏳ ip-004: Integration Testing
**Archivo:** `ip-004-integration-testing.md`
**Estado:** Pendiente
**Objetivo:** Asegurar comunicación segura y confiable entre OpenClaw y n8n

**Tests:**
- [ ] Webhook signature validation
- [ ] Redis queue message delivery
- [ ] Image processing pipeline
- [ ] End-to-end publication flow
- [ ] Error handling and recovery

---

### ⏳ ip-005: Production Launch
**Archivo:** `ip-005-production-launch.md`
**Estado:** Pendiente
**Objetivo:** Desplegar sistema en producción y monitorear performance

**Checklist:**
- [ ] Configurar Meta Graph API credentials
- [ ] Crear tablas Supabase (`content_calendar`, `engagement_logs`)
- [ ] Activar strategic scheduling workflows
- [ ] Monitoreo de errores y logs
- [ ] Documentación de troubleshooting

---

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO (Aleja)                         │
│                   Google Drive + Telegram                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                              │
        ▼                                              ▼
┌──────────────────┐                      ┌─────────────────────┐
│  OPENCLAW BRAIN  │                      │   N8N ARMS          │
│  (Oracle Cloud)  │                      │  (Google Cloud)     │
│                  │                      │                     │
│  • Luna Agent    │──Webhook────────────▶│  • Image Processor  │
│  • Content Gen   │                      │  • Watermark        │
│  • Strategy      │                      │  • Publisher        │
│  • Approval      │                      │  • Logger           │
│                  │                      │                     │
│  Resources:      │                      │  Integrations:      │
│  • SOUL.md       │                      │  • Meta Graph API   │
│  • RAG_PROMPTS   │                      │  • Google Drive     │
│  • Brand Assets  │                      │  • Supabase         │
└──────────────────┘                      └─────────────────────┘
        │                                              │
        └──────────────────────┬──────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   SUPABASE          │
                    │   • Brand Memory    │
                    │   • Content Calendar│
                    │   • Analytics       │
                    └─────────────────────┘
```

---

## 📦 Brand Assets & Resources

### 📝 Banco de Prompts
**Ubicación:** `/RAG_PROMPTS.md`
- Datos técnicos (materiales, técnicas, precios)
- Narrativas de marca (icebreakers, social hooks)
- Estructura de captions
- Estrategia de hashtags

### 🎨 Voz de Marca
**Ubicación:** `/SOUL.md`
- Personalidad y tono de marca
- Estrategia de contenido 7 días
- Segmentos de audiencia
- Palabras aprobadas/prohibidas
- Simbología de colores

### 🖼️ Procesamiento de Imagen
**Especificaciones:** `ip-002.6-brand-assets.md`

| Plataforma | Dimensiones | Watermark | Estrategia |
|-----------|-------------|-----------|------------|
| **Facebook Feed** | 1080x1080 (square) | Bottom-right, 15% | Horarios pico (9am-11am, 7pm-9pm) |
| **Instagram Feed** | 1080x1350 (portrait 4:5) | Bottom-right, 15% | Horarios pico (igual FB) |
| **Instagram Stories** | 1080x1920 (vertical 9:16) | Animado, esquina | Ciclo 24h con recordatorios |
| **Reels** | 1080x1920 (vertical 9:16) | Sutil, no intrusivo | Audio trending + valor educativo |

---

## 📊 Estrategia de Contenido (7 Días)

| Día | Tema | Enfoque | Hora Sugerida |
|-----|------|---------|---------------|
| **Lunes** | Tejiendo Caminos | Historias de madres artesanas | 9:00 AM |
| **Martes** | Poemas Tejidos | Storytelling de pieza específica | 3:00 PM |
| **Miércoles** | Gajes del Oficio | Proceso de tejido/técnica | 12:00 PM |
| **Jueves** | Universo Infantil | Niños/accesorios minimalistas | 4:00 PM |
| **Viernes** | Naturaleza y Espíritu | Espiritualidad/literatura | 6:00 PM |
| **Sábado** | Cultura en Movimiento | Eventos en Cartagena | 11:00 AM |
| **Domingo** | Reflexión y Color | Significado de colores | 10:00 AM |

---

## 🎯 Progreso General

- **Completados:** ip-001 ✅, ip-002 ✅, ip-002.6 ✅, ip-003 ✅
- **En Progreso:** Strategic scheduling workflows (n8n)
- **Pendientes:** ip-004 (Integration Testing), ip-005 (Production Launch)
- **Progreso Total:** 65% (3/5 epics core + recursos de marca)

---

## 🚀 Próximos Pasos

1. **Configurar Meta Graph API** (Facebook/Instagram)
2. **Crear tablas en Supabase** (`content_calendar`, `engagement_logs`)
3. **Activar workflows estratégicos** (Strategic Planner, Content Calendar)
4. **Testing end-to-end** del flujo completo
5. **Documentar troubleshooting** y monitoreo

---

## 📁 Archivos Relacionados

### Plan de Implementación
- `ip-001-infrastructure.md` - Configuración de infraestructura
- `ip-002-openclaw-brain.md` - Sistema OpenClaw
- `ip-002.5-telegram-interface.md` - Interfaz Telegram y Multi-Agent
- `ip-002.6-brand-assets.md` - Recursos de marca y banco de prompts ✨
- `ip-003-n8n-workflows.md` - Workflows de automatización
- `ip-004-integration-testing.md` - Plan de testing
- `ip-005-production-launch.md` - Lanzamiento a producción

### Recursos de Marca
- `/SOUL.md` - Voz completa de marca y personalidad
- `/RAG_PROMPTS.md` - Datos técnicos y plantillas narrativas
- `specs/brand_essence.md` - ADN de marca y audiencia
- `specs/product_catalog.md` - Materiales, técnicas, precios
- `specs/social_impact.md` - Misión social y narrativa de impacto
