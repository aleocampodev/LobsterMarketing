# Telegram Commands for Luna - Nenufar Marketing

## User Commands (Manual Control)

### `/procesar [nombre_archivo]`
**Description:** Process a specific file from Google Drive
**Example:** `/procesar aretes-azul.png`
**Workflow:** 
1. Luna searches for file in Drive
2. Generates eco-poetic caption
3. Shows preview + asks for approval
4. Publishes after user approval

### `/listar`
**Description:** Show list of new/unprocessed files
**Example:** `/listar`
**Response:** Shows recent files with file IDs

### `/estado`
**Description:** Show system status and queue
**Example:** `/estado`
**Response:** 
- Pending files: 3
- Processing: 1
- Published today: 2
- System status: ✅ Active

### `/cancelar [task_id]`
**Description:** Cancel a processing task
**Example:** `/cancelar task_12345`
**Usage:** Stop current processing operation

### `/reintentar [file_id]`
**Description:** Retry a failed publication
**Example:** `/reintentar file_abc123`
**Usage:** Reprocess a file that failed previously

### `/calendario`
**Description:** Show content calendar for the week
**Example:** `/calendario`
**Response:** 
- Lunes: Tejiendo Caminos (pendiente)
- Martes: Poemas Tejidos (programado)
- etc.

### `/ayuda`
**Description:** Show help message with all commands
**Example:** `/ayuda`

## Admin Commands (System Control)

### `/monitoreo [on|off]`
**Description:** Enable/disable automatic Drive monitoring
**Example:** `/monitoreo on`
**Default:** off (manual control)

### `/fuerza [file_id]`
**Description:** Force process a file (skip duplicate check)
**Example:** `/fuerza file_xyz789`
**Warning:** Use only if you're sure file isn't duplicated

### `/limpiar [dias]`
**Description:** Clean old logs from database
**Example:** `/limpiar 30`
**Usage:** Delete monitoring logs older than X days

## Interactive Workflow

### 1. File Detection (Automatic)
```
🔔 **Nuevos archivos detectados**

📸 aretes-azul.png (2.3 MB)
📸 collar-rojo.jpg (1.8 MB)
📄 video-tejido.mp4 (15.2 MB)

¿Deseas procesar alguno de estos archivos?
Usa: /procesar [nombre del archivo]
```

### 2. Processing Request
```
👤 User: /procesar aretes-azul.png

🤖 Luna: "Procesando aretes-azul.png...
   
📝 **Caption Propuesto:**
   
Te invito a descubrir mis poemas tejidos...
   
[Full caption preview]
   
✅ Aprobar
🔄 Ajustar  
❌ Descartar"
```

### 3. Approval Workflow
```
👤 User: ✅ Aprobar

🤖 Luna: "¡Perfecto! Iniciando publicación...
   
✅ Procesando imagen con marca de agua
📤 Publicando en Facebook e Instagram
✅ ¡Publicado exitosamente!
   
📊 Estadísticas:
- Facebook: https://facebook.com/post/123
- Instagram: https://instagram.com/p/456"
```

## Error Handling

### File Not Found
```
❌ **Archivo no encontrado**
   
El archivo 'nombre-incorrecto.png' no existe en Google Drive.
   
Usa /listar para ver archivos disponibles.
```

### Already Processed
```
⚠️ **Archivo ya procesado**
   
Este archivo ya fue procesado el 2026-04-26 a las 15:30.
   
¿Deseas republicarlo? Usa /fuerza [file_id]
```

### Processing Error
```
❌ **Error en procesamiento**
   
No se pudo aplicar la marca de agua.
   
Error: Logo file not found
   
Usa /reintentar [file_id] para volver a intentar.
```

## Configuration Commands

### `/configurar`
**Description:** Configure system settings
**Options:**
- `plataformas`: facebook, instagram, both
- `horario`: optimal publishing times
- `filtro`: automatic file filtering

### `/estadisticas`
**Description:** Show performance statistics
**Metrics:**
- Posts published today
- Engagement rate
- Best performing times
- Top hashtags

## Security Features

1. **User Authentication:** Only authorized users can execute commands
2. **Confirmation Required:** Destructive operations require confirmation
3. **Audit Log:** All commands logged in database
4. **Rate Limiting:** Prevent spam/abuse

## Integration with n8n Workflows

All commands integrate with existing n8n workflows:
- `luna-multi-agent-v2.json` - Main command processing
- `luna-drive-monitor.json` - Automatic file detection
- `luna-image-processor-v2.json` - Image processing
- `luna-social-publisher.json` - Final publishing
