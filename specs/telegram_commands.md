# Telegram Commands for Luna - Nenufar Marketing
Version: v1.3
<!-- v1.3: Added Interactive Classification and Proactive Heartbeat workflows to optimize tokens and schedule posts. Supports Photo and Video. -->
<!-- v1.2: Fixed truncated /cleanup description, restored Interactive Workflow Examples section header. -->

## User Commands (Manual Control)

### `/process [file_name]`
**Description:** Process a specific file from Google Drive.
**Example:** `/process earrings-blue.png`
**Workflow:** 
1. Luna searches for the file in Drive.
2. Generates an eco-poetic caption using Templates Bank.
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

### `/seed [text/audio]`
**Description:** Set the creative "Seed" for the week. This context influences all captions for the next 7 days.
**Example:** `/seed Esta semana nos enfocamos en la paciencia y el color azul.`
**Workflow:**
1. Luna transcribes audio (if provided) and summarizes the intent.
2. Context is stored in Supabase.
3. Luna confirms: "Semilla guardada. Esta semana floreceremos con [resumen]."

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

### 1. Interactive Classification (Token Optimization)
```
🔔 **Nuevo archivo (Foto/Video) detectado en Drive:**
📸 collar-indigo.mp4 (8.5 MB)

🤖 Luna: "¡Hola Shirley! Veo que subiste un nuevo video. Para no gastar mi energía mágica (tokens) adivinando, ¿me confirmas qué tipo de pieza es?"
   
[Collar] | [Aretes] | [Pulsera] | [Otro]
```
*(Después de seleccionar "Aretes")*
```
🤖 Luna: "¡Perfecto! ¿De qué colección o técnica estamos hablando?"

[Macramé] | [Mostacilla] | [Telar] | [Resina]
```

### 2. Processing Request & Approval
```
👤 User: /process aretes-azul.png (O se inicia automáticamente tras la clasificación)

🤖 Luna: "Procesando aretes-azul.png...
   
📝 **Caption Propuesto:**
   
Te invito a descubrir mis poemas tejidos...
   
[Full caption preview]
   
✅ Aprobar | 🔄 Ajustar | ❌ Descartar"
```

### 3. Scheduled Confirmation (The Chronological Arms)
```
👤 User: ✅ Aprobar

🤖 Luna: "¡Perfecto! El post ha sido aprobado. 🌸
   
✅ Procesando video con marca de agua (Logo desde Drive)
🕒 Programado para publicación hoy a las 18:30 (Hora pico)
   
Puedes usar /calendar para ver la estrategia de la semana."
```

### 4. Proactive Heartbeat (Daily Check)
```
*(Activado a las 9:00 AM si no hay material)*

🤖 Luna: "🌸 ¡Hola Shirley! He revisado nuestro calendario para hoy y no tenemos nada programado, tampoco vi nuevas creaciones en nuestra carpeta. 
¿Tienes alguna foto o video de tu taller que te gustaría que tejamos hoy?"
```

---

## Security & Reliability
1. **User Authentication:** Only authorized Telegram IDs can execute commands.
2. **Confirmation Protocol:** Critical operations (Publish/Cleanup) require explicit confirmation.
3. **Audit Trail:** All commands and system responses are logged in the `monitoring_logs` table.
4. **Rate Limiting:** Protects the n8n instance from request spikes.
