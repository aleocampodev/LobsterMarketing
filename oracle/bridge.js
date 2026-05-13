const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });
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

// --- Send message to OpenClaw via Telegram ---
async function notifyOpenClaw(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: SHIRLEY_CHAT_ID,
      text: text,
      parse_mode: "Markdown",
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
    fs.renameSync(uploadedFile.path, tempPath);
    const stats = fs.statSync(tempPath);
    console.log(`[bridge] File saved: ${tempPath} (${stats.size} bytes)`);

    // Notify OpenClaw with file info and temp path
    const text =
      `*Nuevo archivo listo para caption*\n` +
      `Archivo: ${fileData.file_name}\n` +
      `Tipo: ${isVideo ? "Video" : "Imagen"}\n` +
      `Formato: ${fileData.post_type || "feed_ig"}\n` +
      `file_id: ${fileData.file_id}\n` +
      `processed_file_id: ${fileData.processed_file_id || fileData.file_id}\n` +
      `task_id: ${fileData.task_id || ""}\n` +
      `temp_path: ${tempPath}\n\n` +
      `${fileData.message || "Genera un caption para este archivo"}`;

    await notifyOpenClaw(text);
    res.json({ status: "sent", task_id: fileData.task_id || null });
    console.log("[bridge] File uploaded and OpenClaw notified.");
  } catch (err) {
    console.error("[bridge] Error:", err.message);
    try {
      fs.unlinkSync(tempPath);
    } catch (e) {}
    res.status(500).json({ error: err.message });
  }
});

// --- GET /health ---
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "luna-bridge",
    version: "3.0.0",
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
  console.log(`Luna Bridge v3.0 running on port ${PORT}`);
  console.log(
    `  Telegram Bot: ${TELEGRAM_BOT_TOKEN ? "configured" : "MISSING"}`,
  );
});
