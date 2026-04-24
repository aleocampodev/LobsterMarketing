# N8N Skills instaladas en Factory Droid

## Skills Disponibles (7 Skills de n8n)

Estas skills están instaladas en `~/.factory/skills/` y se activan automáticamente cuando creas workflows de n8n.

### 1. n8n-mcp-tools-expert 🔧
**Activación**: Cuando buscas nodos, validas configuraciones, o usas herramientas MCP de n8n
**Capacidades**:
- Búsqueda de nodos (1,084+ nodos disponibles)
- Configuración y validación de nodos
- Gestión de workflows (crear, editar, activar)
- Gestión de credenciales y data tables
- Auditoría de seguridad

**Uso típico**:
```
"Busca nodos para Instagram Graph API"
"Valida esta configuración de webhook"
"Crea un workflow nuevo"
```

### 2. n8n-workflow-patterns 🏗️
**Activación**: Cuando diseñas la estructura de un workflow
**Capacidades**:
- 6 patrones core: Webhook, API, Database, AI, Scheduled, Batch
- Checklist de creación de workflows
- Patrones de flujo y datos
- +2,700 templates de referencia

**Uso típico**:
```
"Diseña un workflow para publicación en redes sociales"
"¿Qué patrón debo usar para integración con APIs?"
"Crea un workflow programado para reports diarios"
```

### 3. n8n-expression-syntax 📝
**Activación**: Cuando escribes expresiones n8n con {{}}
**Capacidades**:
- Variables: $json, $node, $now, $env
- **CRÍTICO**: Datos de webhook bajo `$json.body`
- Acceso anidado y arrays
- Sintaxis correcta de expresiones

**Uso típico**:
```
"¿Cómo accedo al email del webhook?"
"Referencia datos del nodo anterior"
"Escribe una expresión para formatear la fecha"
```

### 4. n8n-validation-expert ✅
**Activación**: Cuando validaciones fallan o necesitas corregir errores
**Capacidades**:
- Proceso iterativo de validación
- Perfiles: minimal, runtime, ai-friendly, strict
- Auto-sanitización de operadores
- Catálogo de errores y soluciones

**Uso típico**:
```
"¿Por qué falla la validación de este nodo?"
"Interpreta este error de n8n"
"¿Es este falso positivo o error real?"
```

### 5. n8n-node-configuration ⚙️
**Activación**: Cuando configuras parámetros de nodos
**Capacidades**:
- Dependencias de propiedades (displayOptions)
- Configuración por operación
- Niveles progresivos de descubrimiento
- Ediciones quirúrgicas con patchNodeField

**Uso típico**:
```
"Configura el nodo de Instagram Graph API"
"¿Qué campos requiero para la operación POST?"
"¿Por qué no aparece este campo en el nodo?"
```

### 6. n8n-code-javascript 💻
**Activación**: Cuando escribes JavaScript en nodos Code
**Capacidades**:
- Modos: All Items (95%) vs Each Item
- **CRÍTICO**: Webhook data bajo `$json.body`
- Built-ins: $helpers.httpRequest(), DateTime, $jmespath()
- 10 patrones de producción probados

**Uso típico**:
```
"Escribe un nodo Code para procesar las captions"
"Transforma los datos del producto para Instagram"
"Filtra hashtags duplicados con JavaScript"
```

### 7. n8n-code-python 🐍
**Activación**: Solo cuando explícitamente solicitas Python
**Capacidades**:
- **LIMITACIÓN**: No hay librerías externas (pandas, requests)
- Solo librería estándar: json, datetime, re, hashlib
- Sintaxis: _input, _json, _node (vs $ en JavaScript)
- **Recomendación**: Usar JavaScript para 95% de casos

**Uso típico**:
```
"Escribe este procesamiento en Python"
"Necesito estadísticas con el módulo statistics"
"¿Puedo usar regex de Python en n8n?"
```

---

## Integración con Nenufar 🌸

### Workflows Específicos para Nenufar

#### 1. Publicación en Instagram/Facebook
```
Skills recomendadas:
- n8n-workflow-patterns (Webhook Processing pattern)
- n8n-node-configuration (Graph API nodes)
- n8n-expression-syntax (mapear caption/hashtags)
```

#### 2. Procesamiento de Media con Marca de Agua
```
Skills recomendadas:
- n8n-code-javascript (procesamiento de imágenes)
- n8n-validation-expert (validar antes de publicar)
- n8n-mcp-tools-expert (gestión de archivos)
```

#### 3. Aprobaciones vía Telegram
```
Skills recomendadas:
- n8n-workflow-patterns (IF/Switch para aprobaciones)
- n8n-expression-syntax (referencias a datos de usuario)
- n8n-mcp-tools-expert (webhook responses)
```

### Reglas de AGENTS.md + n8n Skills

Cuando crees workflows para Nenufar, las skills seguirán automáticamente:

1. **Identidad de Luna** (AGENTS.md):
   - Lenguaje: Español (Colombia) 🇨🇴
   - Tono: Cálido, poético, profesional
   - Keywords: "Tejiendo esperanzas", "Poemas tejidos", etc.

2. **Proceso de Creación** (RAG_PROMPTS.md):
   - Recuperar contexto de Supabase
   - Generar propuesta con narrativa social
   - Respetar reglas de marca (no "barato", "oferta agresiva")

3. **Validación Técnica** (n8n-validation-expert):
   - Verificar configuración de Graph API
   - Validar expresiones de Instagram
   - Probar estructura de hashtags

---

## Ejemplo de Uso

### Prompt Típico para Crear Workflow

```
Crea un workflow de n8n para Nenufar que:

1. Reciba un webhook seguro desde Luna con:
   - task_id
   - media_path (Google Drive)
   - caption (generado por Luna con tono poético)
   - hashtags (mezcla de marca, nicho y tendencias)
   - platforms: ["instagram", "facebook"]

2. Procese la imagen:
   - Descargue desde Google Drive
   - Aplique marca de agua Nenufar
   - Optimice para redes sociales

3. Publique en Instagram y Facebook:
   - Use Graph API con credenciales configuradas
   - Incluya caption con emojis al final
   - Agregue hashtags estratégicos

4. Notifique vía Telegram:
   - Confirme publicación exitosa
   - Incluya URL del post
   - Registra en Supabase para analytics

Considera:
- Seguir reglas de AGENTS.md (tono Luna, español colombiano)
- Validar antes de desplegar (n8n-validation-expert)
- Manejar errores con reintentos (n8n-workflow-patterns)
- Usar expresiones correctas (n8n-expression-syntax)
```

### Skills que se Activarán Automáticamente

1. **n8n-mcp-tools-expert**: Para buscar nodos de Instagram/Facebook
2. **n8n-workflow-patterns**: Para identificar patrón Webhook → Social Media
3. **n8n-node-configuration**: Para configurar Graph API
4. **n8n-expression-syntax**: Para mapear caption/hashtags correctamente
5. **n8n-validation-expert**: Para validar antes de desplegar
6. **n8n-code-javascript**: Para procesamiento de media si es necesario

---

## Verificación de Instalación

Las skills están instaladas en:
```
~/.factory/skills/
├── n8n-code-javascript/
├── n8n-code-python/
├── n8n-expression-syntax/
├── n8n-mcp-tools-expert/
├── n8n-node-configuration/
├── n8n-validation-expert/
└── n8n-workflow-patterns/
```

### Verificar Disponibilidad
```bash
ls -la ~/.factory/skills/
```

### Contenido de Cada Skill
Cada skill contiene:
- **SKILL.md**: Archivo principal de activación
- **Documentación adicional**: Patrones, errores, ejemplos
- **Evaluaciones**: Casos de prueba para QA

---

## Próximos Pasos

1. **Probar las skills**: Crear un workflow simple de prueba
2. **Integrar con Luna**: Conectar OpenClaw con n8n vía webhook
3. **Validar reglas de marca**: Asegurar que captions sigan AGENTS.md
4. **Desplegar workflow**: Usar n8n-mcp tools para deploy a producción

---

## Referencias

- **Repositorio original**: https://github.com/czlonkowski/n8n-skills
- **Documentación n8n**: https://docs.n8n.io/
- **Instancia n8n**: https://n8n-stack-prod-dev.duckdns.org/
- **MCP Server n8n**: Instalado localmente en el proyecto

---

**Fecha de instalación**: 2026-04-23
**Versión de n8n**: 2.47.14
**Status**: ✅ Activo y listo para usar
