# System Architecture: Nenufar Marketing Automation
Version: v1.3

## Overview
The system follows an **n8n-First Orchestration** pattern, where the decision-making (Brain) and execution (Arms) are unified within a single automated ecosystem. It is designed to be resilient, scalable (within free-tier limits), and deeply aligned with the "Luna" brand persona.

---

## 1. System Topology

### 1.1 High-Level Architecture
```mermaid
graph TD
    User((Aleja/User)) <--> Telegram[Telegram Bot Interface]
    Telegram <--> Brain[Luna Multi-Agent Orchestrator]
    
    subgraph "The Brain (n8n Orchestration)"
        Brain --> RAG[RAG Knowledge Base - Supabase]
        Brain --> Memory[Conversation Memory]
        Brain --> LLM[Gemini 1.5 Flash]
    end

    Brain -- "1. Intent & Approval" --> Redis((Upstash Redis Queue))

    subgraph "The Arms (Worker Nodes)"
        Redis -- "Task Data" --> Receiver[Webhook Receiver]
        Receiver --> IPW[Image Processor Worker]
        IPW --> Drive[Google Drive API]
        IPW --> Watermark[Watermarking Engine]
        Watermark --> SPW[Social Publisher Worker]
        SPW --> Meta[Facebook/Instagram Graph API]
        SPW --> FLW[Feedback & Logging Worker]
    end

    FLW --> Supabase[(Supabase DB)]
    FLW -- "Success/Error Notification" --> Telegram
```

---

## 2. Workflow Orchestration & Data Flow

### 2.1 Sequence of Execution (The Handshake)
Este diagrama muestra cómo los procesos asíncronos se comunican entre sí para garantizar que ninguna tarea se pierda.

```mermaid
sequenceDiagram
    participant T as Telegram (Aleja)
    participant O as Orchestrator (Luna)
    participant R as Redis Queue
    participant W as Webhook Receiver
    participant IP as Image Processor
    participant SP as Social Publisher
    participant FL as Feedback/Logging

    T->>O: Envía Voz/Texto o Aprueba
    O->>O: Procesa Intención (RAG + LLM)
    O->>R: Push Payload (Task JSON)
    Note over R: Tarea en espera (Resiliencia)
    R->>W: Pull Task (Worker listo)
    W->>IP: Descarga & Marca de Agua
    IP->>SP: Sube a Instagram/FB
    SP->>FL: Registra éxito en Supabase
    FL->>T: "¡Poema publicado con éxito! 🌸"
```

### 2.2 Decision Logic: The Brain (Internal Luna Loop)
Cómo decide Luna qué acción tomar ante un mensaje de entrada.

```mermaid
graph TD
    In[Entrada de Usuario] --> Detect{¿Qué desea Aleja?}
    
    Detect -- Charlar --> Chat[Conversación Eco-Poética]
    Detect -- Publicar --> RAG[Consultar specs/product_catalog.md]
    Detect -- Ver Estado --> Stats[Consultar Supabase Logs]
    
    RAG --> Template[Aplicar Tema del Día - Content Calendar]
    Template --> Gen[Generar Propuesta de Poema]
    Gen --> Approval{¿Aleja Aprueba?}
    
    Approval -- No / Ajustar --> Gen
    Approval -- Sí --> Dispatch[Enviar a Redis Queue]
    
    Chat --> Response[Respuesta en Telegram]
    Stats --> Response
    Dispatch --> Response
```

---

## 3. Core Components

### 3.1 The Orchestrator (Luna Multi-Agent v2)
- **Role:** Central Mission Control.
- **Workflow:**
    1. **Input:** Receives text, voice, or media from Telegram.
    2. **Transcription:** Uses Whisper/Gemini for voice-to-text.
    3. **Strategy Retrieval:** Queries `luna-rag-knowledge-base` to get product specs and social narratives.
    4. **Generation:** Luna crafts a "Woven Poem" caption following the `specs/brand_essence.md` guidelines.
    5. **Human-in-the-Loop:** Presents the content and media preview to Aleja for approval.
    6. **Dispatch:** Upon approval, it sends a payload to the Webhook Receiver.

### 3.2 The Message Broker (Upstash Redis)
- **Role:** Asynchronous Backbone.
- **Function:** Decouples the low-latency Orchestrator from high-latency processing (image resizing, API calls). It ensures task persistence and allows for retries in case of worker failure.

### 3.3 The Infrastructure (GCP + Supabase)
- **n8n (GCP e2-micro):** Dockerized instance running in Queue Mode.
- **Supabase:** Acts as the "Long-Term Memory" (LTM).
    - `processed_files`: Tracks every asset's lifecycle.
    - `content_calendar`: Stores the 7-day marketing strategy.
    - `monitoring_logs`: System health metrics.

---

## 4. Operational Modes & Lifecycle

### 4.1 Proactive Discovery Mode (Heartbeat Triggered)
- **Drive Scan:** `luna-drive-monitor` busca nuevos activos.
- **Strategy Alignment:** Luna consulta el `content_calendar`.
- **Curation:** Luna selecciona y propone.

### 4.2 Lifecycle States Table

| State | Trigger | System Action | Output |
| :--- | :--- | :--- | :--- |
| **Pending** | Drive Sync | Record created in `processed_files` | Metadata en Supabase |
| **Drafting** | Heartbeat | Luna genera propuesta de caption | Mensaje en Telegram |
| **Processing**| User Approval| Redis Queue -> Image Processor | Imagen con Watermark |
| **Publishing**| Worker Success| Social Publisher -> Meta API | URL del Post en vivo |
| **Logged** | Completion | Feedback & Logging Worker | Confirmación Final |


