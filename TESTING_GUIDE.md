# 🧪 Guía de Testing - Nenufar Marketing Automation

## 🎯 Objetivo
Probar la implementación completa de:
- **Option A:** Marca de agua en imágenes
- **Option B:** Sistema RAG con Gemini embeddings

---

## 📋 Pre-requisitos

### 1. Configuración de Gemini API
Ya tienes las credenciales configuradas en n8n: **"Google Generative AI"**

### 2. Supabase
- URL: `https://your-project-id.supabase.co`
- Credenciales ya existentes: **"Supabase account"**

### 3. Google Drive
- Logo File ID: `1IqV6LcrVuZPl9iBdQCPjgro1WYhFB5UQ`
- Credenciales ya existentes: **"Google Drive account"**

---

## 🚀 PASO 1: Configurar Supabase Vector Store (5 minutos)

1. **Abre Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre SQL Editor**
   - Menú lateral → SQL Editor
   - Crea un nuevo query

3. **Ejecuta el script**
   ```bash
   # Copia el contenido de este archivo:
   scripts/setup-vector-store.sql
   ```
   
4. **Verifica la creación**
   ```sql
   -- Debe retornar 'brand_knowledge'
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'brand_knowledge';
   
   -- Verifica el índice
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'brand_knowledge';
   ```

**✅ Checklist Paso 1:**
- [ ] Tabla `brand_knowledge` creada
- [ ] Índice `brand_knowledge_embedding_idx` creado
- [ ] Función `match_brand_knowledge` creada
- [ ] Extension `vector` habilitada

---

## 🔥 PASO 2: Importar Workflows en n8n (3 minutos)

1. **Abre n8n**
   - URL: https://n8n-stack-prod-dev.duckdns.org
   - Login con tus credenciales

2. **Importa los workflows**
   ```
   workflows/luna-rag-knowledge-base.json
   workflows/luna-semantic-search.json
   ```

3. **Conecta las credenciales**
   - **Supabase account**: Ya existe
   - **Google Generative AI**: Ya existe

4. **Configura la API Key de Gemini**
   - En el nodo "Generate Embeddings", reemplaza:
     ```
     YOUR_GEMINI_API_KEY
     ```
   - Por tu API key real de Gemini
   - Puedes obtenerla en: https://makersuite.google.com/app/apikey

**✅ Checklist Paso 2:**
- [ ] Workflows importados correctamente
- [ ] Credenciales conectadas
- [ ] API Key de Gemini configurada

---

## 📊 PASO 3: Crear Embeddings (2 minutos)

1. **Abre el workflow** "Luna RAG Knowledge Base"

2. **Haz clic en** "Test Workflow" (▶️)

3. **Verifica la ejecución**
   - Debes ver 4 items procesados
   - Cada item representa un documento de marca

4. **Confirma en Supabase**
   ```sql
   SELECT id, metadata->>'type' as type, metadata->>'source' as source 
   FROM brand_knowledge;
   ```

   **Resultado esperado:**
   ```
   id                  | type            | source
   --------------------|-----------------|-----------------------
   brand-essence-001   | brand_essence   | specs/brand_essence.md
   soul-001            | soul            | SOUL.md
   product-catalog-001 | product_catalog | specs/product_catalog.md
   social-impact-001   | social_impact   | specs/social_impact.md
   ```

**✅ Checklist Paso 3:**
- [ ] 4 embeddings creados
- [ ] Registros visibles en Supabase
- [ ] Embeddings tienen 768 dimensiones

---

## 🔍 PASO 4: Probar Búsqueda Semántica (3 minutos)

1. **Activa el workflow** "Luna Semantic Search"
   - Toggle ON (esquina superior derecha)

2. **Copia el Webhook URL**
   - Haz clic en "Listen for Test Event"
   - Copia el URL generado

3. **Prueba con curl**
   ```bash
   curl -X POST https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search \
     -H "Content-Type: application/json" \
     -d '{
       "query": "¿Cuál es la misión social de Nenufar?",
       "top_k": 3
     }'
   ```

4. **Prueba con Postman** (si prefieres UI)
   - Method: POST
   - URL: [tu webhook URL]
   - Headers: Content-Type: application/json
   - Body (raw JSON):
     ```json
     {
       "query": "¿Cuáles son las palabras prohibidas en Nenufar?",
       "top_k": 2
     }
     ```

**Respuesta esperada:**
```json
{
  "query": "¿Cuál es la misión social de Nenufar?",
  "results": [
    {
      "rank": 1,
      "similarity": 0.95,
      "content": "## Core Mission\nWe train working head-of-household mothers...",
      "metadata": {"type": "social_impact"}
    },
    ...
  ],
  "total_results": 3
}
```

**✅ Checklist Paso 4:**
- [ ] Webhook responde correctamente
- [ ] Resultados son relevantes
- [ ] Similarity scores son razonables (> 0.7)

---

## 🖼️ PASO 5: Probar Marca de Agua (5 minutos)

1. **Verifica el workflow** "Luna Image Processor Worker v2"
   - Debe tener 7 nodos
   - Debe incluir "Download Nenufar Logo"

2. **Sube una imagen de prueba**
   - Ve a Google Drive
   - Sube una imagen (ej: `test-photo.jpg`)
   - Copia el File ID

3. **Envía una tarea a Redis**
   - Usa el workflow "Luna Webhook Receiver" o Redis CLI
   - Payload:
     ```json
     {
       "task_id": "test-watermark-001",
       "media_path": "TU_FILE_ID_AQUI",
       "caption": "Test de marca de agua Nenufar",
       "hashtags": ["#Nenufar", "#Test"],
       "platforms": ["instagram"]
     }
     ```

4. **Verifica el procesamiento**
   ```sql
   -- Revisa el estado
   SELECT file_name, status, watermark_applied, dimensions, error_message 
   FROM processed_files 
   WHERE task_id = 'test-watermark-001'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

5. **Descarga la imagen procesada**
   - Busca la imagen en Google Drive (si se guardó)
   - O revisa el output del nodo "Queue for Social Publisher"

**✅ Checklist Paso 5:**
- [ ] Workflow procesa la imagen
- [ ] Marca de agua visible (esquina inferior derecha)
- [ ] Dimensiones correctas (1080x1350 para IG)
- [ ] Status = 'published' en Supabase

---

## 🤖 PASO 6: Integración con Multi-Agent System (Opcional)

Este paso integra la búsqueda semántica en el sistema multi-agente:

1. **Abre** "Luna Multi-Agent System v2"

2. **Agrega un nodo HTTP Request**
   - Posición: Después de "Set 'Text'" (node cfea44af)
   - Conecta antes de "Google Gemini Chat Model"

3. **Configura el nodo:**
   - **Method:** POST
   - **URL:** https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search
   - **Body:**
     ```json
     {
       "query": "={{ $json.text }}",
       "top_k": 3
     }
     ```

4. **Actualiza el nodo "Google Gemini Chat Model"**
   - Agrega un "System Message" que incluya el contexto de RAG:
     ```
     Contexto de marca: {{ $json.results }}
     
     Eres Luna, la voz digital de Nenufar. Usa el contexto anterior para responder.
     ```

5. **Prueba por Telegram**
   - Envía un mensaje al bot de Telegram
   - Pregunta sobre la misión social de Nenufar
   - Verifica que la respuesta usa la información de la búsqueda semántica

**✅ Checklist Paso 6:**
- [ ] Búsqueda semántica integrada
- [ ] Respuestas del bot son más precisas
- [ ] Contexto de marca se usa correctamente

---

## 🐛 Troubleshooting

### Error: "Function not found"
**Solución:** Ejecuta `scripts/setup-vector-store.sql` en Supabase

### Error: "dimension mismatch"
**Solución:** Verifica que los embeddings tengan 768 dimensiones (Gemini)
```sql
SELECT array_length(embedding, 1) FROM brand_knowledge LIMIT 1;
```

### Error: "API key not valid"
**Solución:** Reemplaza `YOUR_GEMINI_API_KEY` con tu API key real

### Error: "Watermark not applied"
**Solución:** 
1. Verifica que el logo existe en Google Drive
2. Revisa los logs de ejecución del workflow
3. Prueba el nodo "Process Image" independientemente

### Búsqueda retorna resultados irrelevantes
**Solución:**
1. Aumenta el parámetro `top_k`
2. Mejora la calidad de los documentos fuente
3. Verifica que los embeddings se crearon correctamente

---

## 📝 Test Cases Sugeridos

### Test 1: Búsqueda de Misión Social
```bash
curl -X POST https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Qué hace Nenufar por las madres?", "top_k": 2}'
```
**Esperado:** Documento `social-impact-001` en #1

### Test 2: Búsqueda de Palabras Prohibidas
```bash
curl -X POST https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Qué palabras no debo usar?", "top_k": 2}'
```
**Esperado:** Documento `brand-essence-001` o `soul-001` en #1

### Test 3: Búsqueda de Productos
```bash
curl -X POST https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Qué materiales usan?", "top_k": 3}'
```
**Esperado:** Documento `product-catalog-001` en #1

### Test 4: Marca de Agua Instagram
```json
{
  "task_id": "test-ig-001",
  "media_path": "FILE_ID",
  "caption": "Test",
  "hashtags": ["#test"],
  "platforms": ["instagram"]
}
```
**Esperado:** Imagen 1080x1350 con watermark

### Test 5: Marca de Agua Facebook
```json
{
  "task_id": "test-fb-001",
  "media_path": "FILE_ID",
  "caption": "Test",
  "hashtags": ["#test"],
  "platforms": ["facebook"]
}
```
**Esperado:** Imagen 1080x1080 con watermark

---

## ✅ Checklist Final

Copia y marca cada elemento:

```
Supabase Setup:
□ Tabla brand_knowledge creada
□ Índice vectorial creado
□ Funciones RPC creadas
□ RLS policies configuradas

Embeddings:
□ 4 documentos embebidos
□ 768 dimensiones correctas
□ Datos visibles en Supabase

Búsqueda Semántica:
□ Webhook responde
□ Resultados relevantes
□ Similarity scores > 0.7
□ 3 test cases pasan

Marca de Agua:
□ Workflow tiene 7 nodos
□ Logo descargado correctamente
□ Imagen redimensionada
□ Watermark aplicado
□ Test IG y FB pasan

Integración:
□ Multi-Agent System usa RAG
□ Respuestas mejoran
□ Contexto de marca preservado
```

---

## 🎉 ¡Felicidades!

Si completaste todos los pasos, el sistema está listo para producción.

**Próximos pasos:**
1. Merge del PR #2
2. Deploy a producción
3. Monitoreo de errores
4. Recopilación de feedback

**¿Necesitas ayuda?** Revisa `specs/rag_integration_summary.md` para más detalles técnicos.
