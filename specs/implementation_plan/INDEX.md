# Implementation Plan: Nenufar Marketing Automation System

## 🎯 Overview

Sistema automatizado de marketing para Nenufar que integra generación de contenido con IA y automatización de workflows, orquestado íntegramente en **n8n (n8n-First Architecture)**.

**Arquitectura:** n8n Orchestrator & Workers
- **Orchestrator (The Brain):** Luna Multi-Agent System v2 (Gemini 2.5 Flash) manejando estrategia, copywriting y aprobación via Telegram.
- **Workers (The Arms):** Sub-workflows especializados en procesamiento de imagen, publicación en Meta y logging.

---

## 📚 Epics

### ✅ ip-001: Infrastructure Setup
**Archivo:** `ip-001-infrastructure.md`
**Estado:** Completado
**Objetivo:** Configurar infraestructura en la nube (Google Cloud, Supabase, Upstash Redis)

---

### ✅ ip-002: The Brain - n8n Orchestrator
**Estado:** Completado (v2)
**Objetivo:** Migrar la inteligencia de Luna directamente a n8n como orquestador central.

**Sub-epics:**
- **ip-002.1:** Unified Agent v2 (Gemini 1.5 Flash) ✅
- **ip-002.2:** RAG Integration (Supabase Vector Store) ⏳ **EN PROGRESO**
- **ip-002.3:** Telegram Interface (Buttons/Voice) ✅
- **ip-002.5:** Multi-Agent System v2 ✅
- **ip-002.6:** Brand Assets & Content Resources ✅

**[MIGRADO]** ip-002-original: Oracle Cloud OpenClaw Brain - **Deprecado** en favor de arquitectura n8n-First.

---

### ✅ ip-003: The Arms - n8n Workers
**Archivo:** `ip-003-n8n-workflows.md`
**Estado:** En Optimización
**Objetivo:** Automatizar tareas mecánicas de descarga, procesamiento y publicación

**Sub-epics:**
- **ip-003.1:** Webhook Receiver & Redis Queue ✅
- **ip-003.2:** Image Processor (Sharp/Watermark) ⚠️ **PENDIENTE LÓGICA**
- **ip-003.3:** Social Media Publisher (Meta Graph API) ✅
- **ip-003.4:** Feedback and Logging (Supabase) ✅

---

### ⏳ ip-004: Integration Testing & Robustness
**Archivo:** `ip-004-integration-testing.md`
**Estado:** Pendiente
**Objetivo:** Implementar manejo de errores y validación de extremo a extremo.

---

### ⏳ ip-005: Production Launch
**Archivo:** `ip-005-production-launch.md`
**Estado:** Pendiente
**Objetivo:** Desplegar sistema en producción y monitorear performance.

---

## 📝 Historial de Cambios Arquitectónicos

**2026-04-27:** Migración completa a arquitectura n8n-First
- OpenClaw Brain (Oracle Cloud) → **Deprecado**
- Luna Multi-Agent System v2 (n8n + Gemini 1.5 Flash) → **Activo**
- Worker workflows especializados (Queue Mode con Upstash Redis) → **Activo**
