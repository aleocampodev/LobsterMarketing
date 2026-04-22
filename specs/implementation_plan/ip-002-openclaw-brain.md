# Epic ip-002: The Brain - OpenClaw Server

Goal: Build the intelligence layer (Luna) that handles strategy and copywriting via a standalone script (Telegram polling).

## Tasks
- [ ] **ip-002.1: Inicialización del Bot (OpenClaw)**
  - Configurar el entorno en la instancia de Oracle (Node.js o Python).
  - Configurar las variables de entorno (`.env`) para Supabase, Telegram Bot Token, Gemini API Key y la URL del Webhook de n8n.
  - Implementar la conexión básica con Telegram usando Long Polling.
- [ ] **ip-002.2: Lógica de Ingestión RAG (Memoria de Marca)**
  - Crear script para leer `specs/*.md` (Brand Essence, Social Impact, Product Catalog).
  - Usar Gemini (`text-embedding-004`) para vectorizar el contenido.
  - Almacenar los embeddings y metadatos en la tabla `brand_knowledge` de Supabase (`pgvector`).
- [ ] **ip-002.3: Recepción y Análisis Visual**
  - Configurar el bot de Telegram para recibir imágenes/videos de Aleja.
  - Enviar el medio a Gemini (`1.5 Flash`) para extraer contexto visual (técnicas, materiales, colores).
- [ ] **ip-002.4: Generación de Prompts (Persona Luna)**
  - Realizar Búsqueda Semántica en Supabase para recuperar directrices de tono y diseño.
  - Construir el "Prompt Maestro" siguiendo las reglas de `AGENTS.md` (eco poético, misión social).
  - Generar caption final, hashtags y hora óptima con Gemini.
- [ ] **ip-002.5: Flujo de Aprobación en Telegram**
  - Enviar propuesta a Aleja con botones Inline (Aprobar ✅ / Regenerar 🔄 / Cancelar ❌).
  - Manejar la aprobación del usuario.
- [ ] **ip-002.6: Webhook Trigger Seguro Hacia n8n**
  - Construir payload JSON y firmar con HMAC.
  - Enviar POST a `https://n8n-stack-prod-dev.duckdns.org/`.
