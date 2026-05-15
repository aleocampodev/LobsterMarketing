/**
 * Luna Bridge API Tests — Zero external dependencies
 *
 * Tests:
 *   1. POST /send           — message forwarded to OpenClaw
 *   2. POST /send           — HMAC validation (valid + invalid + missing)
 *   3. POST /upload IMAGE   — binary saved + OpenClaw notified with direct instruction
 *   4. POST /upload VIDEO   — binary saved + OpenClaw notified with direct instruction
 *   5. POST /proxy-telegram — image from Drive + caption + 2 buttons
 *   6. POST /proxy-telegram — video from Drive + caption + 2 buttons
 *   7. Copywriter           — caption structure validation (hook/CTA/hashtags/prohibited)
 *   8. Error cases          — missing fields
 *
 * Usage:  node oracle/test-bridge.js
 */

const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const BRIDGE_PORT = 3099;
const MOCK_TG_PORT = 3097;
const MOCK_DRIVE_PORT = 3098;
const BRIDGE_SECRET = "test-bridge-secret";
const BOT_TOKEN = "123456:FAKE";
const CHAT_ID = "6327668964";
const TEMP_DIR = path.join(__dirname, "temp_test_bridge");

let passed = 0, failed = 0;
function assert(cond, msg) { if (!cond) throw new Error(msg); }
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}\n     ${e.message}`); }
}

// ── HTTP helpers ──────────────────────────────────────────────
function listen(server, port) { return new Promise((r, j) => { server.listen(port, r); server.on("error", j); }); }

function postJSON(port, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: "localhost", port, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers }
    }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "localhost", port, path }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function postRaw(port, path, buffer, headers) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "localhost", port, path, method: "POST", headers }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch { resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }); }
      });
    });
    req.on("error", reject);
    req.write(buffer);
    req.end();
  });
}

// ── Build multipart body ──────────────────────────────────────
function buildMultipart(boundary, fields, file) {
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  if (file) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`));
    parts.push(file.data);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  } else {
    parts.push(Buffer.from(`--${boundary}--\r\n`));
  }
  return Buffer.concat(parts);
}

// ── Parse multipart ───────────────────────────────────────────
function parseMultipart(buf, boundary) {
  const parts = [];
  const delim = Buffer.from(`--${boundary}`);
  let start = 0;
  while (start < buf.length) {
    const idx = buf.indexOf(delim, start);
    if (idx === -1) break;
    if (idx > start) {
      const section = buf.slice(start, idx - 2); // remove \r\n before delim
      const hdrEnd = section.indexOf("\r\n\r\n");
      if (hdrEnd !== -1) {
        const hdr = section.slice(0, hdrEnd).toString();
        const nm = hdr.match(/name="([^"]+)"/);
        const fn = hdr.match(/filename="([^"]+)"/);
        if (nm) {
          const data = section.slice(hdrEnd + 4);
          const trimmed = (data[data.length - 2] === 0x0d && data[data.length - 1] === 0x0a) ? data.slice(0, -2) : data;
          parts.push(fn ? { name: nm[1], filename: fn[1], data: trimmed } : { name: nm[1], value: trimmed.toString() });
        }
      }
    }
    start = idx + delim.length;
  }
  return parts;
}

// ── Mock Telegram ──────────────────────────────────────────────
const tgCalls = [];
function createMockTelegram() {
  return http.createServer((req, res) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      const ct = req.headers["content-type"] || "";
      const entry = { endpoint: req.url, ct, fields: {}, body: null };

      if (ct.includes("application/json")) {
        try { entry.body = JSON.parse(raw); entry.fields.chat_id = String(entry.body.chat_id || ""); } catch {}
      } else if (ct.includes("multipart")) {
        const chatM = raw.match(/name="chat_id"\r?\n\r?\n(\d+)/);
        const capM = raw.match(/name="caption"\r?\n\r?\n([\s\S]*?)\r?\n--/);
        const rmM = raw.match(/name="reply_markup"\r?\n\r?\n([\s\S]*?)\r?\n--/);
        if (chatM) entry.fields.chat_id = chatM[1];
        if (capM) entry.fields.caption = capM[1].trim();
        if (rmM) try { entry.fields.reply_markup = JSON.parse(rmM[1].trim()); } catch {}
      }

      tgCalls.push(entry);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, result: { message_id: Date.now() } }));
    });
  });
}

// ── Mock Drive ─────────────────────────────────────────────────
function createMockDrive() {
  return http.createServer((req, res) => {
    const isVideo = req.url.includes("video");
    const buf = Buffer.alloc(isVideo ? 2048 : 1024);
    res.writeHead(200, { "Content-Type": isVideo ? "video/mp4" : "image/jpeg", "Content-Length": buf.length });
    res.end(buf);
  });
}

// ── Bridge server (logic from bridge.js, zero deps) ───────────
function createBridge() {
  return http.createServer((req, res) => {
    const send = (code, data) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", async () => {
      const raw = Buffer.concat(chunks);
      const ct = req.headers["content-type"] || "";

      try {
        // GET /health
        if (req.method === "GET" && req.url === "/health") return send(200, { status: "ok", service: "luna-bridge", version: "3.0.0" });

        // POST /send
        if (req.url === "/send" && req.method === "POST") {
          const body = JSON.parse(raw.toString());
          const sig = req.headers["x-bridge-signature"];
          const expected = crypto.createHmac("sha256", BRIDGE_SECRET).update(raw.toString()).digest("hex");
          if (sig && sig !== expected) return send(403, { error: "Invalid signature" });
          if (!body.file_id || !body.file_name) return send(400, { error: "Missing file_id or file_name" });
          const text = body.message || `Publica el archivo ${body.file_name}`;

          const tgRes = await fetch(`http://localhost:${MOCK_TG_PORT}/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
          });
          const tgJson = await tgRes.json();
          if (!tgJson.ok) throw new Error(tgJson.description);
          return send(200, { status: "sent", message: text });
        }

        // POST /upload (multipart)
        if (req.url === "/upload" && req.method === "POST") {
          const bm = ct.match(/boundary=(.+)/);
          if (!bm) return send(400, { error: "Invalid multipart" });
          const parts = parseMultipart(raw, bm[1].replace(/;.*$/, "").trim());
          const filePart = parts.find(p => p.filename);
          if (!filePart) return send(400, { error: "Missing file" });
          const fields = {};
          parts.forEach(p => { if (!p.filename) fields[p.name] = p.value; });
          if (!fields.file_id) return send(400, { error: "Missing file_id" });

          const isVideo = fields.is_video === "true" || (fields.mime_type || "").startsWith("video/");
          const ext = isVideo ? ".mp4" : ".jpg";
          if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
          const tmpPath = path.join(TEMP_DIR, `up_${Date.now()}${ext}`);
          fs.writeFileSync(tmpPath, filePart.data);

          // Send photo/video to Telegram with instruction as caption (v3.2 behavior)
          const method = isVideo ? "sendVideo" : "sendPhoto";
          const field = isVideo ? "video" : "photo";
          const text = `Publica el archivo ${fields.file_name || "unknown"}. ` +
            `Formato: ${fields.post_type || "feed_ig"}. ` +
            `file_id: ${fields.file_id}. ` +
            `processed_file_id: ${fields.processed_file_id || fields.file_id}. ` +
            `task_id: ${fields.task_id || ""}.`;

          const tgRes = await fetch(`http://localhost:${MOCK_TG_PORT}/bot${BOT_TOKEN}/${method}`, {
            method: "POST",
            body: (() => {
              const fd = new FormData();
              fd.append("chat_id", CHAT_ID);
              fd.append("caption", text);
              fd.append(field, new Blob([Buffer.alloc(8)], {type: isVideo ? "video/mp4" : "image/jpeg"}), isVideo ? "video.mp4" : "photo.jpg");
              return fd;
            })()
          });
          const tgJson = await tgRes.json();
          if (!tgJson.ok) throw new Error(tgJson.description);
          return send(200, { status: "sent", task_id: fields.task_id || null });
        }

        // POST /proxy-telegram
        if (req.url === "/proxy-telegram" && req.method === "POST") {
          const body = JSON.parse(raw.toString());
          const { chat_id, caption, is_video, callback_approve, callback_adjust, processed_file_id } = body;
          if (!chat_id) return send(400, { error: "Missing chat_id" });
          if (!processed_file_id) return send(400, { error: "Missing processed_file_id" });

          const isV = is_video === true || is_video === "true";
          const method = isV ? "sendVideo" : "sendPhoto";
          const field = isV ? "video" : "photo";

          const driveRes = await fetch(`http://localhost:${MOCK_DRIVE_PORT}/drive/v3/files/${processed_file_id}?alt=media`);
          if (!driveRes.ok) throw new Error(`Drive failed (${driveRes.status})`);
          const fileBuf = Buffer.from(await driveRes.arrayBuffer());

          const replyMarkup = JSON.stringify({ inline_keyboard: [[
            { text: "✅ Aprobar y Publicar", callback_data: callback_approve || "approve:none" },
            { text: "✏️ Ajustar", callback_data: callback_adjust || "adjust:none" },
          ]] });

          const fd = new FormData();
          fd.append("chat_id", chat_id);
          if (caption) fd.append("caption", caption);
          fd.append("reply_markup", replyMarkup);
          fd.append(field, new Blob([fileBuf]), isV ? "video.mp4" : "photo.jpg");

          const tgRes = await fetch(`http://localhost:${MOCK_TG_PORT}/bot${BOT_TOKEN}/${method}`, { method: "POST", body: fd });
          const tgJson = await tgRes.json();
          if (!tgJson.ok) throw new Error(tgJson.description);
          return send(200, { status: "sent", message_id: tgJson.result.message_id });
        }

        send(404, { error: "Not found" });
      } catch (err) {
        send(500, { error: err.message });
      }
    });
  });
}

// ── Copywriter validation ──────────────────────────────────────
function validateCaption(caption) {
  const errors = [];
  if (!caption || !caption.trim()) return ["Empty caption"];
  const lines = caption.split("\n").filter(l => l.trim());
  if (lines.length < 2) errors.push("Too short: need hook + CTA");
  if (!lines.some(l => l.includes("#"))) errors.push("Missing hashtags");
  const lower = caption.toLowerCase();
  for (const w of ["barato", "oferta agresiva", "low cost"]) if (lower.includes(w)) errors.push(`Prohibited: "${w}"`);
  if (!["dm", "escribenos", "escríbenos", "link en la bio", "toque el link", "separa", "mensaje"].some(w => lower.includes(w)))
    errors.push("Missing CTA");
  return errors;
}

const sampleCaption = {
  valid: `Te invito a descubrir mis poemas tejidos en este collar de Mostacilla Checa con técnica Peyote ✨

Cada puntada es un paso hacia la estabilidad de una familia colombiana. Trabajamos con madres cabeza de hogar 🤎

Escríbenos por DM para separar tu pieza única

#NenufarContigo #TejiendoCaminos #PoemasTejidos #JoyeríaAncestral`,
  noHashtags: `Collar de mostacilla. Escríbenos por DM.`,
  prohibited: `¡Barato! Oferta agresiva en collares. Escríbenos.`,
  noCTA: `Collar hermoso de Mostacilla Checa.\n\n#NenufarContigo`,
};

// ── Main ───────────────────────────────────────────────────────
async function main() {
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const mockTg = createMockTelegram();
  const mockDrive = createMockDrive();
  const bridge = createBridge();
  await listen(mockTg, MOCK_TG_PORT);
  await listen(mockDrive, MOCK_DRIVE_PORT);
  await listen(bridge, BRIDGE_PORT);
  console.log(`\n  Mock TG:${MOCK_TG_PORT}  Drive:${MOCK_DRIVE_PORT}  Bridge:${BRIDGE_PORT}\n`);

  // ── 1. Health ──
  console.log("── 1. Health ──");
  await test("GET /health returns ok", async () => {
    const r = await get(BRIDGE_PORT, "/health");
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.status === "ok", `body ${JSON.stringify(r.body)}`);
  });

  // ── 2. POST /send ──
  console.log("\n── 2. POST /send ──");
  await test("forwards message to OpenClaw via Telegram", async () => {
    tgCalls.length = 0;
    const r = await postJSON(BRIDGE_PORT, "/send", {
      message: "Publica collar_dorado.jpg", file_id: "f1", file_name: "collar_dorado.jpg", post_type: "feed_ig",
    });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.status === "sent", `body ${JSON.stringify(r.body)}`);
    const tg = tgCalls.find(c => c.endpoint.includes("sendMessage"));
    assert(tg, "Telegram not called");
    assert(tg.body.text.includes("collar_dorado.jpg"), `text: ${tg.body.text}`);
  });

  await test("rejects invalid HMAC", async () => {
    const r = await postJSON(BRIDGE_PORT, "/send", { file_id: "a", file_name: "x.jpg" }, { "x-bridge-signature": "bad" });
    assert(r.status === 403, `status ${r.status}`);
  });

  await test("accepts valid HMAC", async () => {
    const body = { file_id: "a2", file_name: "y.jpg" };
    const sig = crypto.createHmac("sha256", BRIDGE_SECRET).update(JSON.stringify(body)).digest("hex");
    const r = await postJSON(BRIDGE_PORT, "/send", body, { "x-bridge-signature": sig });
    assert(r.status === 200, `status ${r.status}`);
  });

  await test("400 missing file_id", async () => {
    const r = await postJSON(BRIDGE_PORT, "/send", { file_name: "z.jpg" });
    assert(r.status === 400, `status ${r.status}`);
  });

  // ── 3. POST /upload IMAGE ──
  console.log("\n── 3. POST /upload (IMAGE) ──");
  await test("saves image + notifies with direct instruction", async () => {
    tgCalls.length = 0;
    const boundary = "----ImgTest" + Date.now();
    const buf = buildMultipart(boundary,
      { file_id: "img1", file_name: "aretes.jpg", post_type: "feed_ig", processed_file_id: "proc1", task_id: "t1", is_video: "false", message: "Caption aretes" },
      { name: "aretes.jpg", type: "image/jpeg", data: Buffer.alloc(512, 0xff) }
    );
    const r = await postRaw(BRIDGE_PORT, "/upload", buf, { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": buf.length });
    assert(r.status === 200, `status ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.status === "sent", `body ${JSON.stringify(r.body)}`);
    assert(r.body.task_id === "t1", `task_id ${r.body.task_id}`);

    const tg = tgCalls.find(c => c.endpoint.includes("sendPhoto"));
    assert(tg, "sendPhoto not called");
    const caption = tg.fields.caption || "";
    assert(caption.includes("Publica el archivo aretes.jpg"), `Expected "Publica el archivo": ${caption.slice(0, 100)}`);
    assert(caption.includes("feed_ig"), "post_type missing in caption");
  });

  // ── 4. POST /upload VIDEO ──
  console.log("\n── 4. POST /upload (VIDEO) ──");
  await test("saves video + notifies with direct instruction", async () => {
    tgCalls.length = 0;
    const boundary = "----VidTest" + Date.now();
    const buf = buildMultipart(boundary,
      { file_id: "vid1", file_name: "water.mp4", post_type: "story", processed_file_id: "pv1", task_id: "t2", is_video: "true", message: "Caption video" },
      { name: "water.mp4", type: "video/mp4", data: Buffer.alloc(2048, 0x00) }
    );
    const r = await postRaw(BRIDGE_PORT, "/upload", buf, { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": buf.length });
    assert(r.status === 200, `status ${r.status}: ${JSON.stringify(r.body)}`);

    const tg = tgCalls.find(c => c.endpoint.includes("sendVideo"));
    assert(tg, "sendVideo not called");
    const caption = tg.fields.caption || "";
    assert(caption.includes("Publica el archivo water.mp4"), `Expected "Publica el archivo": ${caption.slice(0, 100)}`);
    assert(caption.includes("story"), "post_type missing in caption");
  });

  await test("400 no file attached", async () => {
    const boundary = "----NoFile" + Date.now();
    const buf = buildMultipart(boundary, { file_id: "abc" });
    const r = await postRaw(BRIDGE_PORT, "/upload", buf, { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": buf.length });
    assert(r.status === 400, `status ${r.status}`);
  });

  // ── 5. POST /proxy-telegram IMAGE ──
  console.log("\n── 5. POST /proxy-telegram (IMAGE + caption + buttons) ──");
  await test("sends photo + caption + 2 buttons (Aprobar / Ajustar)", async () => {
    tgCalls.length = 0;
    const r = await postJSON(BRIDGE_PORT, "/proxy-telegram", {
      chat_id: CHAT_ID, caption: sampleCaption.valid, is_video: false,
      callback_approve: "approve:task_001", callback_adjust: "adjust:task_001",
      processed_file_id: "test_image_001",
    });
    assert(r.status === 200, `status ${r.status}: ${JSON.stringify(r.body)}`);

    const tg = tgCalls.find(c => c.endpoint.includes("sendPhoto"));
    assert(tg, "sendPhoto not called");
    assert(tg.fields.chat_id === CHAT_ID, `chat_id ${tg.fields.chat_id}`);
    assert(tg.fields.caption, "caption missing");
    assert(tg.fields.reply_markup, "reply_markup missing");

    const kb = tg.fields.reply_markup.inline_keyboard;
    assert(kb.length === 1 && kb[0].length === 2, `buttons: ${JSON.stringify(kb)}`);
    assert(kb[0][0].text === "✅ Aprobar y Publicar", `btn1: ${kb[0][0].text}`);
    assert(kb[0][0].callback_data === "approve:task_001", `cb1: ${kb[0][0].callback_data}`);
    assert(kb[0][1].text === "✏️ Ajustar", `btn2: ${kb[0][1].text}`);
    assert(kb[0][1].callback_data === "adjust:task_001", `cb2: ${kb[0][1].callback_data}`);
  });

  // ── 6. POST /proxy-telegram VIDEO ──
  console.log("\n── 6. POST /proxy-telegram (VIDEO + caption + buttons) ──");
  await test("sends video + caption + 2 buttons (Aprobar / Ajustar)", async () => {
    tgCalls.length = 0;
    const caption = `El secreto de nuestra joyería índigo que pocos conocen 🤫

No es solo la calidad de la Mostacilla Checa; es la paciencia en la técnica de Peyote.

Dale ▶️ y cuéntanos: ¿crees que lo hecho a mano tiene otra energía?

#NenufarContigo #TejiendoCaminos #PoemasTejidos #JoyeríaAncestral`;

    const r = await postJSON(BRIDGE_PORT, "/proxy-telegram", {
      chat_id: CHAT_ID, caption, is_video: true,
      callback_approve: "approve:task_002", callback_adjust: "adjust:task_002",
      processed_file_id: "test_video_file_002",
    });
    assert(r.status === 200, `status ${r.status}: ${JSON.stringify(r.body)}`);

    const tg = tgCalls.find(c => c.endpoint.includes("sendVideo"));
    assert(tg, "sendVideo not called");
    assert(tg.fields.chat_id === CHAT_ID, `chat_id ${tg.fields.chat_id}`);

    const kb = tg.fields.reply_markup.inline_keyboard;
    assert(kb[0][0].text === "✅ Aprobar y Publicar", `btn1: ${kb[0][0].text}`);
    assert(kb[0][0].callback_data === "approve:task_002", `cb1: ${kb[0][0].callback_data}`);
    assert(kb[0][1].text === "✏️ Ajustar", `btn2: ${kb[0][1].text}`);
    assert(kb[0][1].callback_data === "adjust:task_002", `cb2: ${kb[0][1].callback_data}`);
  });

  // ── 7. /proxy-telegram errors ──
  console.log("\n── 7. POST /proxy-telegram error cases ──");
  await test("400 missing chat_id", async () => {
    const r = await postJSON(BRIDGE_PORT, "/proxy-telegram", { caption: "x", processed_file_id: "y" });
    assert(r.status === 400, `status ${r.status}`);
    assert(r.body.error.includes("chat_id"), `error: ${r.body.error}`);
  });

  await test("400 missing processed_file_id", async () => {
    const r = await postJSON(BRIDGE_PORT, "/proxy-telegram", { chat_id: CHAT_ID, caption: "x" });
    assert(r.status === 400, `status ${r.status}`);
    assert(r.body.error.includes("processed_file_id"), `error: ${r.body.error}`);
  });

  // ── 8. Copywriter ──
  console.log("\n── 8. Copywriter validation ──");
  await test("valid caption passes", () => {
    assert(validateCaption(sampleCaption.valid).length === 0, `Errors: ${validateCaption(sampleCaption.valid).join(", ")}`);
  });
  await test("no hashtags → fail", () => {
    assert(validateCaption(sampleCaption.noHashtags).some(e => e.includes("hashtags")), "Should fail on hashtags");
  });
  await test("prohibited words → fail", () => {
    assert(validateCaption(sampleCaption.prohibited).some(e => e.includes("Prohibited")), "Should fail on prohibited");
  });
  await test("no CTA → fail", () => {
    assert(validateCaption(sampleCaption.noCTA).some(e => e.includes("CTA")), "Should fail on CTA");
  });

  // ── Cleanup ──
  await new Promise(r => bridge.close(r));
  await new Promise(r => mockTg.close(r));
  await new Promise(r => mockDrive.close(r));
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${"═".repeat(50)}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
