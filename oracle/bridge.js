const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });
const { google } = require("googleapis");
const app = express();
app.use(express.json());

const PORT = process.env.BRIDGE_PORT || 3010;
const BRIDGE_SECRET =
  process.env.BRIDGE_SECRET ||
  "fe4f2ef63ed74d0fab3a73471f95f8646f51961ebacffbf9ad2ad55a3157a47f";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const SHIRLEY_CHAT_ID = "6327668964";
const TEMP_DIR = path.join(__dirname, "temp");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// --- Google Drive Auth (Service Account) ---
let driveAuth = null;
const SA_KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, "gdrive-service-account.json");
if (fs.existsSync(SA_KEY_PATH)) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: SA_KEY_PATH,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"]
    });
    driveAuth = google.drive({ version: "v3", auth });
    const keyFile = JSON.parse(fs.readFileSync(SA_KEY_PATH, "utf8"));
    console.log(`  Google Drive: ${keyFile.client_email}`);
  } catch (err) {
    console.error("  Google Drive auth failed:", err.message);
  }
} else {
  console.log("  Google Drive: MISSING service account key at", SA_KEY_PATH);
}

// --- Send message to OpenClaw via Telegram ---
async function notifyOpenClaw(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: SHIRLEY_CHAT_ID,
      text: text,
    }),
  });
  const result = await response.json();
  if (!result.ok) throw new Error(`Telegram error: ${result.description}`);
  return result;
}

// --- POST /send — JSON payload from n8n, forward to OpenClaw ---
app.post("/send", async (req, res) => {
  const sig = req.headers["x-bridge-signature"];
  const bodyStr = JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", BRIDGE_SECRET)
    .update(bodyStr)
    .digest("hex");
  if (sig && sig !== expected)
    return res.status(403).json({ error: "Invalid signature" });

  const { message, file_id, file_name, post_type, processed_file_id, chat_id } =
    req.body;
  console.log("[bridge] /send received:", { file_name, post_type });

  if (!file_id || !file_name)
    return res.status(400).json({ error: "Missing file_id or file_name" });

  const text = message || `Publica el archivo ${file_name}`;
  console.log("[bridge] Forwarding to OpenClaw via Telegram:", text);

  try {
    const result = await notifyOpenClaw(text);
    res.json({ status: "sent", message: text });
    console.log("[bridge] Message sent to OpenClaw.");
  } catch (err) {
    console.error("[bridge] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- POST /notify-upload — Metadata-only from n8n. Sends text instruction to OpenClaw.
// n8n Caption Preview Sender (WF2a-2) handles sending photo/video + caption + buttons to Shirley.
app.post("/notify-upload", express.json(), async (req, res) => {
  const body = req.body || {};
  const { file_id, file_name, post_type, task_id, processed_file_id } = body;

  console.log("[bridge] /notify-upload received:", {
    file_name, post_type, task_id, file_id,
    contentType: req.headers["content-type"],
    bodyKeys: Object.keys(body),
  });

  if (!file_id) return res.status(400).json({ error: "Missing file_id", received: body });

  res.json({ status: "accepted", task_id: task_id || null });

  const instruction =
    `Publica el archivo ${file_name || "unknown"}. ` +
    `Formato: ${post_type || "feed_ig"}. ` +
    `file_id: ${file_id}. ` +
    `processed_file_id: ${processed_file_id || file_id}. ` +
    `task_id: ${task_id || ""}.`;

  try {
    await notifyOpenClaw(instruction);
    console.log("[bridge] /notify-upload sent text instruction to OpenClaw.");
  } catch (err) {
    console.error("[bridge] /notify-upload error:", err.message);
  }
});

// --- POST /upload — Multipart binary from n8n (file downloaded from Drive via OAuth) ---
app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = req.body;
  const uploadedFile = req.file;

  console.log("[bridge] /upload received:", {
    file_name: fileData.file_name,
    post_type: fileData.post_type,
    task_id: fileData.task_id,
    has_file: !!uploadedFile,
  });

  if (!uploadedFile) return res.status(400).json({ error: "Missing file" });
  if (!fileData.file_id)
    return res.status(400).json({ error: "Missing file_id" });

  // Save to temp with proper extension
  const isVideo =
    fileData.is_video === "true" ||
    fileData.is_video === true ||
    (fileData.mime_type && fileData.mime_type.startsWith("video/"));
  const ext = isVideo ? ".mp4" : ".jpg";
  const tempPath = path.join(
    TEMP_DIR,
    `up_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`,
  );

  try {
    // multer v2 stores files in memory (buffer), not on disk
    const fileBuffer = uploadedFile.buffer || (uploadedFile.path ? fs.readFileSync(uploadedFile.path) : Buffer.alloc(0));
    fs.writeFileSync(tempPath, fileBuffer);
    const stats = fs.statSync(tempPath);
    console.log(`[bridge] File saved: ${tempPath} (${stats.size} bytes)`);

    // Respond immediately so n8n doesn't timeout
    res.json({ status: "sent", task_id: fileData.task_id || null });

    // Send photo/video to Telegram with instruction as caption
    // OpenClaw sees the file AND receives the instruction to generate caption
    const instruction =
      `Publica el archivo ${fileData.file_name}. ` +
      `Formato: ${fileData.post_type || "feed_ig"}. ` +
      `file_id: ${fileData.file_id}. ` +
      `processed_file_id: ${fileData.processed_file_id || fileData.file_id}. ` +
      `task_id: ${fileData.task_id || ""}.`;

    const method = isVideo ? "sendVideo" : "sendPhoto";
    const fieldName = isVideo ? "video" : "photo";
    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;

    const fd = new FormData();
    fd.append("chat_id", SHIRLEY_CHAT_ID);
    fd.append("caption", instruction);
    fd.append("parse_mode", "Markdown");
    fd.append(fieldName, new Blob([fileBuffer]), isVideo ? "video.mp4" : "photo.jpg");

    fetch(tgUrl, { method: "POST", body: fd })
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) {
          console.log(`[bridge] Sent ${method} with instruction to OpenClaw.`);
        } else {
          console.error(`[bridge] Telegram ${method} error:`, result.description);
          // Fallback: send as text message
          return notifyOpenClaw(instruction);
        }
      })
      .catch((err) => {
        console.error("[bridge] Background notify error:", err.message);
      });

    // Cleanup temp file after a delay
    setTimeout(() => {
      try { fs.unlinkSync(tempPath); } catch (e) {}
    }, 30000);
  } catch (err) {
    console.error("[bridge] Error:", err.message);
    try {
      fs.unlinkSync(tempPath);
    } catch (e) {}
    res.status(500).json({ error: err.message });
  }
});

// --- POST /proxy-telegram — Download from Drive + send to Telegram with buttons ---
// n8n sends only metadata (no binary). Bridge downloads from Drive via Service Account.
app.post("/proxy-telegram", express.json(), async (req, res) => {
  try {
    const { chat_id, caption, is_video, callback_approve, callback_adjust, processed_file_id } = req.body;

    if (!chat_id) return res.status(400).json({ error: "Missing chat_id" });
    if (!processed_file_id) return res.status(400).json({ error: "Missing processed_file_id" });
    if (!driveAuth) return res.status(500).json({ error: "Google Drive not configured" });

    const isVideo = is_video === true || is_video === "true";
    const method = isVideo ? "sendVideo" : "sendPhoto";
    const fieldName = isVideo ? "video" : "photo";
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;

    console.log(`[bridge] /proxy-telegram downloading ${processed_file_id} from Drive...`);

    // Download from Drive via Service Account
    const destPath = path.join(TEMP_DIR, `dl_${Date.now()}_${Math.random().toString(36).slice(2)}${isVideo ? ".mp4" : ".jpg"}`);

    // Get authenticated client and download via fetch
    const authClient = await driveAuth.context._options.auth.getClient();
    const { token } = await authClient.getAccessToken();
    const driveDownloadUrl = `https://www.googleapis.com/drive/v3/files/${processed_file_id}?alt=media`;

    const driveResponse = await fetch(driveDownloadUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!driveResponse.ok) {
      const errText = await driveResponse.text();
      throw new Error(`Drive download failed (${driveResponse.status}): ${errText}`);
    }

    const arrayBuffer = await driveResponse.arrayBuffer();
    let fileBuffer = Buffer.from(arrayBuffer);

    // Oracle Media Processor stores files as JSON {status, file_id, data: "<base64>"}
    // Detect and extract the actual binary from the "data" field
    try {
      const json = JSON.parse(fileBuffer.toString("utf8"));
      if (json.status && json.data) {
        console.log(`[bridge] Detected JSON wrapper (status=${json.status}), extracting base64 data...`);
        fileBuffer = Buffer.from(json.data, "base64");
      }
    } catch (e) {
      // Not JSON — raw binary, use as-is
    }

    fs.writeFileSync(destPath, fileBuffer);
    console.log(`[bridge] Downloaded from Drive: ${fileBuffer.length} bytes (raw=${arrayBuffer.byteLength})`);

    // Send to Telegram
    const replyMarkup = JSON.stringify({
      inline_keyboard: [[
        { text: "✅ Aprobar y Publicar", callback_data: callback_approve || "approve:none" },
        { text: "✏️ Ajustar", callback_data: callback_adjust || "adjust:none" }
      ]]
    });

    const fd = new FormData();
    fd.append("chat_id", chat_id);
    if (caption) fd.append("caption", caption);
    fd.append("reply_markup", replyMarkup);
    fd.append(fieldName, new Blob([fileBuffer]), isVideo ? "video.mp4" : "photo.jpg");

    const tgResponse = await fetch(url, { method: "POST", body: fd });
    const result = await tgResponse.json();
    if (!result.ok) throw new Error(`Telegram error: ${result.description}`);

    console.log(`[bridge] /proxy-telegram sent ${method} to ${chat_id}, message_id: ${result.result.message_id}`);
    res.json({ status: "sent", message_id: result.result.message_id });

    // Cleanup
    try { fs.unlinkSync(destPath); } catch (e) {}
  } catch (err) {
    console.error("[bridge] /proxy-telegram error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- GET /file/:filename — Serve temp file for n8n ---
app.get("/file/:filename", (req, res) => {
  const filePath = path.join(TEMP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.sendFile(filePath);
});

// --- GET /serve/:fileId — Public file serving for Meta API ---
// Downloads from Drive via Service Account and returns binary.
// Meta Graph API can fetch files from this URL.
app.get("/serve/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!driveAuth) return res.status(500).json({ error: "Google Drive not configured" });

    console.log(`[bridge] /serve downloading ${fileId} from Drive...`);

    const authClient = await driveAuth.context._options.auth.getClient();
    const { token } = await authClient.getAccessToken();
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const driveResponse = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!driveResponse.ok) {
      const errText = await driveResponse.text();
      console.error(`[bridge] /serve Drive error (${driveResponse.status}): ${errText}`);
      return res.status(driveResponse.status).json({ error: `Drive download failed` });
    }

    // Detect content type
    const contentType = driveResponse.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await driveResponse.arrayBuffer());

    // Handle JSON wrapper from Oracle Media Processor
    let finalBuffer = buffer;
    let finalContentType = contentType;
    try {
      const json = JSON.parse(buffer.toString("utf8"));
      if (json.status && json.data) {
        finalBuffer = Buffer.from(json.data, "base64");
        if (json.mime_type) finalContentType = json.mime_type;
        console.log(`[bridge] /serve extracted base64 (${finalBuffer.length} bytes, ${finalContentType})`);
      }
    } catch (e) {
      // Raw binary, use as-is
    }

    res.set("Content-Type", finalContentType);
    res.set("Content-Length", finalBuffer.length);
    res.set("Cache-Control", "public, max-age=3600");
    res.send(finalBuffer);
    console.log(`[bridge] /serve sent ${fileId} (${finalBuffer.length} bytes, ${finalContentType})`);
  } catch (err) {
    console.error("[bridge] /serve error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- POST /telegram-webhook — Receives Telegram callbacks and forwards to n8n ---
app.post("/telegram-webhook", async (req, res) => {
  const update = req.body;
  console.log("[bridge] /telegram-webhook received update:", JSON.stringify(update).substring(0, 200));

  // Answer callback_query immediately so Telegram doesn't retry
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = String(cb.message.chat.id);
    const messageId = String(cb.message.message_id);

    // Answer the callback so the button stops loading
    const answerUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    fetch(answerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cb.id, text: "Procesando..." }),
    }).catch(() => {});

    // Forward to n8n WF2b webhook
    const n8nUrl = process.env.N8N_CALLBACK_WEBHOOK || "https://n8n-stack-prod-dev.duckdns.org/webhook/callback-publish";
    const payload = {
      callback_data: cb.data,
      chat_id: chatId,
      message_id: messageId,
      from: cb.from,
    };

    try {
      const n8nRes = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(`[bridge] Forwarded callback to n8n: ${n8nRes.status}`);
    } catch (err) {
      console.error("[bridge] Error forwarding to n8n:", err.message);
    }
  }

  // Always respond 200 to Telegram
  res.json({ ok: true });
});

// --- POST /register-webhook — Registers this bridge as Telegram webhook (call once) ---
app.post("/register-webhook", async (req, res) => {
  if (!TELEGRAM_BOT_TOKEN) return res.status(500).json({ error: "Missing TELEGRAM_BOT_TOKEN" });
  const bridgeUrl = req.body.url || `https://nenufar-bridge.duckdns.org/telegram-webhook`;
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
  try {
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: bridgeUrl, allowed_updates: ["callback_query"] }),
    });
    const result = await tgRes.json();
    console.log("[bridge] setWebhook result:", JSON.stringify(result));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET /health ---
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "luna-bridge",
    version: "3.3.0",
    telegram: !!TELEGRAM_BOT_TOKEN,
  }),
);

// --- Cleanup temp files on startup ---
fs.readdir(TEMP_DIR, (err, files) => {
  if (!err) {
    files.forEach((file) => {
      if (file.startsWith("up_") || file.startsWith("dl_")) {
        try {
          fs.unlinkSync(path.join(TEMP_DIR, file));
        } catch (e) {}
      }
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Luna Bridge v3.2 running on port ${PORT}`);
  console.log(
    `  Telegram Bot: ${TELEGRAM_BOT_TOKEN ? "configured" : "MISSING"}`,
  );
});
