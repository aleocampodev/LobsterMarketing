# Telegram Commands for Luna - Nenufar Marketing
Version: v1.1

## User Commands (Manual Control)

### `/process [file_name]`
**Description:** Process a specific file from Google Drive.
**Example:** `/process earrings-blue.png`
**Workflow:** 
1. Luna searches for the file in Drive.
2. Generates an eco-poetic caption using RAG.
3. Shows a preview + asks for approval.
4. Publishes after user approval.

### `/list`
**Description:** Show a list of new/unprocessed files in the monitored Drive folder.
**Example:** `/list`
**Response:** Lists recent files with their respective file IDs.

### `/status`
**Description:** Show system health and task queue status.
**Example:** `/status`
**Response:** 
- Pending files: 3
- Processing: 1
- Published today: 2
- System status: ✅ Active

### `/cancel [task_id]`
**Description:** Cancel a running or queued processing task.
**Example:** `/cancel task_12345`

### `/retry [file_id]`
**Description:** Reprocess a file that previously failed to publish.
**Example:** `/retry file_abc123`

### `/calendar`
**Description:** Show the content strategy and scheduled posts for the week.
**Example:** `/calendar`
**Response:** 
- Monday: Tejiendo Caminos (Pending)
- Tuesday: Poemas Tejidos (Scheduled)
- etc.

### `/help`
**Description:** Show a help message with the complete list of available commands.
**Example:** `/help`

---

## Admin Commands (System Control)

### `/monitor [on|off]`
**Description:** Enable or disable automatic Google Drive monitoring (Heartbeat).
**Example:** `/monitor on`
**Default:** off (Manual control mode).

### `/force [file_id]`
**Description:** Force-process a file, skipping duplicate checks in the database.
**Example:** `/force file_xyz789`

### `/cleanup [days]`
**Description:** Delete monitoring and processing logs older than X days to optimize storage.
**Example:** `/cleanup 30`

---

## Interactive Workflow Examples

### 1. File Detection (Automatic Notification)
```
🔔 **Nuevos archivos detectados**

📸 aretes-azul.png (2.3 MB)
📸 collar-rojo.jpg (1.8 MB)
📄 video-tejido.mp4 (15.2 MB)

¿Deseas procesar alguno de estos archivos?
Usa: /process [nombre del archivo]
```

### 2. Processing Request & Approval
```
👤 User: /process aretes-azul.png

🤖 Luna: "Procesando aretes-azul.png...
   
📝 **Caption Propuesto:**
   
Te invito a descubrir mis poemas tejidos...
   
[Full caption preview]
   
✅ Aprobar | 🔄 Ajustar | ❌ Descartar"
```

### 3. Final Confirmation
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

---

## Security & Reliability
1. **User Authentication:** Only authorized Telegram IDs can execute commands.
2. **Confirmation Protocol:** Critical operations (Publish/Cleanup) require explicit confirmation.
3. **Audit Trail:** All commands and system responses are logged in the `monitoring_logs` table.
4. **Rate Limiting:** Protects the n8n instance from request spikes.
