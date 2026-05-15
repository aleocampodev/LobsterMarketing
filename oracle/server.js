const express = require("express");
const crypto = require("crypto");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const multer = require("multer");
const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });
const app = express();
app.use(express.json({ limit: "100mb" }));

// --- Async task store for video processing ---
const asyncTasks = new Map();

// --- Configuration ---
const PORT = process.env.MEDIA_PROCESSOR_PORT || 3001;
const HMAC_SECRET = process.env.WEBHOOK_SECRET || "your-webhook-secret";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const WATERMARK_STORAGE_PATH =
  process.env.WATERMARK_STORAGE_PATH || "nenufar-assets/nenufar-logo.png";
const WATERMARK_PATH = path.join(__dirname, "logo", "nenufar-logo.png");
const TEMP_DIR = path.join(__dirname, "temp");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const N8N_VIDEO_CALLBACK_URL = process.env.N8N_VIDEO_CALLBACK_URL || "";

// --- Notify n8n when video processing is done ---
async function notifyVideoDone(taskId, fileId, fileName, postType, status, error) {
  if (!N8N_VIDEO_CALLBACK_URL) {
    console.log("[callback] Skipping — N8N_VIDEO_CALLBACK_URL not configured");
    return;
  }
  try {
    const payload = {
      task_id: taskId,
      file_id: fileId,
      file_name: fileName,
      post_type: postType || "feed_ig",
      status: status,
    };
    if (error) payload.error = error;
    await fetch(N8N_VIDEO_CALLBACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[callback] Notified n8n: ${status} for ${fileId}`);
  } catch (err) {
    console.error(`[callback] Failed to notify n8n:`, err.message);
  }
}

const uploadWithStorage = multer({
  storage: multer.diskStorage({
    destination: TEMP_DIR,
    filename: (req, file, cb) =>
      cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`),
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const SIZES = {
  portrait: { width: 1080, height: 1350, fit: "cover" },
  square: { width: 1080, height: 1080, fit: "cover" },
  landscape: { width: 1080, height: 566, fit: "cover" },
  story: { width: 1080, height: 1920, fit: "cover" },
};

const VIDEO_SIZES = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1080, height: 566 },
  story: { width: 1080, height: 1920 },
};

const VIDEO_CRF = {
  low: 28,
  medium: 23,
  high: 18,
};

// --- Download file from URL ---
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const tempPath = path.join(
      TEMP_DIR,
      `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    const file = fs.createWriteStream(tempPath);
    client
      .get(url, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          downloadFile(response.headers.location).then(resolve).catch(reject);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(tempPath);
        });
      })
      .on("error", (err) => {
        fs.unlinkSync(tempPath);
        reject(err);
      });
  });
}

// --- Ensure watermark logo is available ---
let logoDownloaded = false;
async function ensureWatermarkLogo() {
  if (fs.existsSync(WATERMARK_PATH)) {
    logoDownloaded = true;
    return;
  }
  if (logoDownloaded) return;
  const logoDir = path.dirname(WATERMARK_PATH);
  if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });
  if (SUPABASE_URL && SUPABASE_KEY && WATERMARK_STORAGE_PATH) {
    const [bucket, ...pathParts] = WATERMARK_STORAGE_PATH.split("/");
    const filePath = pathParts.join("/");
    const signedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
    const tmpPath = await downloadFile(signedUrl);
    fs.renameSync(tmpPath, WATERMARK_PATH);
    logoDownloaded = true;
  } else {
    console.warn(
      "[watermark] No Supabase credentials and no local logo found at",
      WATERMARK_PATH,
      "- skipping watermark",
    );
    return false;
  }
  return true;
}

// --- Preparar PNG del watermark limpio ---
async function buildWatermarkPng(targetSize, opacity) {
  const { data: raw, info } = await sharp(WATERMARK_PATH)
    .resize(targetSize, targetSize, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const maxAlpha = Math.round(255 * opacity);
  for (let i = 0; i < raw.length; i += 4) {
    const lum = 0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2];
    if (lum >= 230) {
      raw[i + 3] = 0;
    } else if (lum <= 180) {
      raw[i + 3] = maxAlpha;
    } else {
      raw[i + 3] = Math.round(maxAlpha * (230 - lum) / 50);
    }
  }

  return sharp(Buffer.from(raw), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .blur(1.2)
    .png()
    .toBuffer();
}

// ─── TÉCNICA PROFESIONAL: Super-resolution para eliminar cuadritos ─────────────
//
// El patrón de cuadrícula de las mostacillas es frecuencia espacial regular.
// La técnica más efectiva es:
//   1. Upscale 2x con lanczos3 (interpolación de alta calidad)
//   2. Gaussian blur suave en el upscale — disuelve las juntas entre granos
//   3. Downscale de vuelta al tamaño original con mitchell (preserva estructura)
//   4. Sharpen selectivo — recupera bordes del producto sin recuperar la cuadrícula
//   5. Modulate + clahe — colores vivos y contraste de producto fotográfico
//
// El resultado: mostacillas se ven como superficie continua y rica en color,
// no como píxeles. Igual que lo que hace Lightroom con el slider "Texture".
// ─────────────────────────────────────────────────────────────────────────────
async function enhanceProduct(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata();
  const origW = meta.width;
  const origH = meta.height;

  const enhanced = await sharp(inputBuffer)
    .resize(origW * 2, origH * 2, {
      kernel: sharp.kernel.lanczos3,
      fastShrinkOnLoad: false,
    })
    .blur(1.8)
    .resize(origW, origH, {
      kernel: sharp.kernel.mitchell,
      fastShrinkOnLoad: false,
    })
    .sharpen({ sigma: 0.8, m1: 0.3, m2: 3.5, x1: 2.0, y2: 15, y3: 0 })
    .modulate({ saturation: 1.5, brightness: 1.06 })
    .clahe({ width: 32, height: 32, maxSlope: 4 })
    .toBuffer();

  return enhanced;
}

// --- Process Image (Sharp) ---
async function processImage(inputPath, operations) {
  const metadata = await sharp(inputPath).metadata();

  // Enhance primero sobre el original a máxima resolución
  const enhancedBuffer = await enhanceProduct(fs.readFileSync(inputPath));

  // A partir de aquí trabajamos sobre el buffer mejorado
  let pipeline = sharp(enhancedBuffer);

  if (operations.resize) {
    const size = SIZES[operations.resize] || SIZES.portrait;
    
    // Creamos el fondo difuminado que llena todo el lienzo
    const bgBlur = await sharp(enhancedBuffer)
      .resize(size.width, size.height, { fit: "cover" })
      .blur(40)
      .toBuffer();

    // Creamos la imagen principal ajustada sin recortes
    const fg = await sharp(enhancedBuffer)
      .resize(size.width, size.height, { fit: "inside" })
      .toBuffer();

    // Componemos la imagen sobre el fondo
    pipeline = sharp(bgBlur).composite([{ input: fg, blend: "over" }]);
  }

  if (operations.format === "jpeg" || operations.format === "jpg") {
    pipeline = pipeline.jpeg({ quality: 92 }); // subimos a 92 para preservar el detalle mejorado
  } else if (operations.format === "png") {
    pipeline = pipeline.png();
  } else if (operations.format === "webp") {
    pipeline = pipeline.webp({ quality: 92 });
  }

  if (operations.watermark) {
    const hasLogo = await ensureWatermarkLogo();
    if (hasLogo === false) operations.watermark = false;
  }

  if (operations.watermark) {
    const opacity = 0.95;
    const resizedImage = await pipeline.toBuffer();

    const imgMeta = await sharp(resizedImage).metadata();
    const imgW = imgMeta.width || 1080;
    const imgH = imgMeta.height || 1350;

    const shortSide = Math.min(imgW, imgH);
    const wmSize = Math.min(Math.round(shortSide * 0.11), 160);
    const margin = Math.round(shortSide * 0.03);

    const finalWm = await buildWatermarkPng(wmSize, opacity);
    const wmMeta = await sharp(finalWm).metadata();

    pipeline = sharp(resizedImage).composite([
      {
        input: finalWm,
        top: imgH - wmMeta.height - margin,
        left: imgW - wmMeta.width - margin,
        blend: "over",
      },
    ]);
  }

  const outputPath = path.join(
    TEMP_DIR,
    `out_${Date.now()}_${Math.random().toString(36).slice(2)}.${operations.format || "jpg"}`,
  );
  await pipeline.toFile(outputPath);
  return { outputPath, metadata: await sharp(outputPath).metadata() };
}

// --- Process Video (ffmpeg) ---
// Para video: misma filosofía pero con filtros ffmpeg equivalentes
// gblur=sigma=1.5 → equivale al blur del upscale
// unsharp con valores bajos en luma alta frecuencia → sharpen selectivo
// eq=saturation=1.5 → colores vivos
// El upscale/downscale en ffmpeg se hace con scale + flags=lanczos encadenado
async function processVideo(inputPath, operations) {
  const { execFile } = require("child_process");
  const format = operations.format || "mp4";
  const size = VIDEO_SIZES[operations.resize] || VIDEO_SIZES.portrait;
  const crf = VIDEO_CRF[operations.quality] || VIDEO_CRF.medium;
  const outputPath = path.join(
    TEMP_DIR,
    `vid_${Date.now()}_${Math.random().toString(36).slice(2)}.${format}`,
  );

  const fgEnhance =
    `scale=${size.width}:${size.height}:flags=lanczos:force_original_aspect_ratio=decrease,` +
    "unsharp=5:5:0.5:5:5:0," +
    "eq=saturation=1.5:brightness=0.06:contrast=1.05";

  const bgBlur = `scale=${size.width}:${size.height}:flags=lanczos:force_original_aspect_ratio=increase,crop=${size.width}:${size.height},gblur=sigma=25`;

  let tmpWatermark = null;
  const ffmpegArgs = ["-i", inputPath, "-y"];

  if (operations.watermark) {
    await ensureWatermarkLogo();

    const opacity = 0.95;
    const shortSide = Math.min(size.width, size.height);
    const wmSize = Math.min(Math.round(shortSide * 0.11), 160);
    const margin = Math.round(shortSide * 0.03);

    // Posición: Inferior Derecha
    const logoX = size.width - wmSize - margin;
    const logoY = size.height - wmSize - margin;

    const wmBuffer = await buildWatermarkPng(wmSize, opacity);
    tmpWatermark = path.join(TEMP_DIR, `wm_${Date.now()}.png`);
    fs.writeFileSync(tmpWatermark, wmBuffer);

    ffmpegArgs.push("-i", tmpWatermark);
    ffmpegArgs.push(
      "-filter_complex",
      `[0:v]${bgBlur}[bg];[0:v]${fgEnhance}[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[merged];[merged][1:v]overlay=${logoX}:${logoY}:format=auto`,
    );
  } else {
    ffmpegArgs.push(
      "-filter_complex",
      `[0:v]${bgBlur}[bg];[0:v]${fgEnhance}[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`,
    );
  }

  if (operations.max_duration) {
    ffmpegArgs.push("-t", String(operations.max_duration));
  }

  if (format === "mp4") {
    ffmpegArgs.push(
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "fast",
      "-crf",
      String(crf),
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
    );
  } else if (format === "webm") {
    ffmpegArgs.push(
      "-c:v",
      "libvpx-vp9",
      "-crf",
      String(crf),
      "-b:v",
      "0",
      "-c:a",
      "libopus",
      "-b:a",
      "128k",
    );
  }

  ffmpegArgs.push(outputPath);

  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      ffmpegArgs,
      { maxBuffer: 100 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (tmpWatermark) {
          try {
            fs.unlinkSync(tmpWatermark);
          } catch (e) {
            /* ignore */
          }
        }
        if (error) return reject(new Error(`ffmpeg failed: ${error.message}`));
        resolve({ outputPath });
      },
    );
  });
}

// --- GET /task-status/:taskId --- Poll async video processing result ---
app.get("/task-status/:taskId", (req, res) => {
  const task = asyncTasks.get(req.params.taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  if (task.status === "done" && req.query.return === "binary") {
    if (!fs.existsSync(task.output_path)) {
      return res.status(410).json({ status: "error", error: "Output file expired" });
    }
    res.set("Content-Type", `video/${task.format}`);
    res.set("Content-Length", fs.statSync(task.output_path).size);
    const stream = fs.createReadStream(task.output_path);
    stream.pipe(res);
    return;
  }

  res.json(task);
});

// --- Health Check ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "media-processor",
    version: "1.4.0",
    logo: fs.existsSync(WATERMARK_PATH),
  });
});

// --- Helper: Get file from base64 or URL ---
async function getInputFile(body) {
  if (body.file_base64) {
    const tempPath = path.join(
      TEMP_DIR,
      `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    fs.writeFileSync(tempPath, Buffer.from(body.file_base64, "base64"));
    return tempPath;
  }
  if (body.file_url) return await downloadFile(body.file_url);
  throw new Error("Missing file_base64 or file_url");
}

// --- Process Image Endpoint ---
app.post("/process", uploadWithStorage.single("image"), async (req, res) => {
  const file = req.file;
  const { file_url, file_base64, operations: opsStr, file_id } = req.body;
  console.log("[/process] received:", {
    hasFile: !!file,
    file_id,
    opsStr: opsStr ? opsStr.substring(0, 100) : opsStr,
    bodyKeys: Object.keys(req.body),
  });

  let operations;
  try {
    operations = opsStr ? JSON.parse(opsStr) : undefined;
  } catch (e) {
    console.error("[/process] JSON.parse failed for opsStr:", opsStr);
    return res
      .status(400)
      .json({ error: `Invalid operations JSON: ${opsStr}` });
  }

  if ((!file && !file_url && !file_base64) || !operations) {
    return res
      .status(400)
      .json({
        error: "Missing file or operations",
        received: {
          hasFile: !!file,
          hasUrl: !!file_url,
          hasBase64: !!file_base64,
          operations: opsStr,
        },
      });
  }

  let inputPath = null;
  let outputPath = null;

  try {
    if (file) {
      inputPath = file.path;
      const stats = fs.statSync(inputPath);
      console.log("[/process] file details:", {
        path: file.path,
        size: stats.size,
        mimetype: file.mimetype,
        originalname: file.originalname,
      });
    } else {
      inputPath = await getInputFile(req.body);
    }

    const result = await processImage(inputPath, operations);
    outputPath = result.outputPath;

    const processedBuffer = fs.readFileSync(outputPath);
    const base64 = processedBuffer.toString("base64");

    res.json({
      status: "success",
      file_id: file_id || null,
      data: base64,
      mime_type: `image/${operations.format || "jpeg"}`,
      size_bytes: processedBuffer.length,
      metadata: {
        width: result.metadata.width,
        height: result.metadata.height,
        format: result.metadata.format,
      },
    });
  } catch (error) {
    console.error("[/process] processing error:", error.message, error.stack);
    res
      .status(500)
      .json({
        status: "error",
        file_id: file_id || null,
        error: error.message,
      });
  } finally {
    if (inputPath)
      try {
        fs.unlinkSync(inputPath);
      } catch (e) {
        /* ignore */
      }
    if (outputPath)
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        /* ignore */
      }
  }
});

// --- Process Video Endpoint (ASYNC) ---
app.post(
  "/process-video",
  uploadWithStorage.single("image"),
  async (req, res) => {
    const file = req.file;
    const { file_url, file_base64, operations: opsStr, file_id } = req.body;
    console.log("[/process-video] received:", {
      hasFile: !!file,
      file_id,
      opsStr: opsStr ? opsStr.substring(0, 100) : opsStr,
    });

    let operations;
    try {
      operations = opsStr ? JSON.parse(opsStr) : undefined;
    } catch (e) {
      return res.status(400).json({ error: `Invalid operations JSON: ${opsStr}` });
    }

    if ((!file && !file_url && !file_base64) || !operations) {
      return res.status(400).json({
        error: "Missing file or operations",
        received: { hasFile: !!file, hasUrl: !!file_url, hasBase64: !!file_base64, operations: opsStr },
      });
    }

    // Generate task_id and respond immediately
    const taskId = `vid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let inputPath = null;

    try {
      if (file) {
        inputPath = file.path;
      } else {
        inputPath = await getInputFile(req.body);
      }

      asyncTasks.set(taskId, { status: "processing", file_id: file_id || null });

      // Respond immediately
      res.json({ status: "processing", task_id: taskId, file_id: file_id || null });

      // Process in background
      const capturedInputPath = inputPath;
      const capturedFileId = file_id || null;
      const capturedFileName = req.body.file_name || "video.mp4";
      const capturedPostType = req.body.post_type || "feed_ig";
      process.nextTick(() => {
        processVideo(capturedInputPath, operations)
          .then(async (result) => {
            asyncTasks.set(taskId, {
              status: "done",
              file_id: capturedFileId,
              output_path: result.outputPath,
              format: operations.format || "mp4",
            });
            try { fs.unlinkSync(capturedInputPath); } catch (e) {}
            console.log(`[/process-video] task ${taskId} done, output: ${result.outputPath}`);

            // Notify n8n callback workflow to download + upload to Drive + mark Supabase
            await notifyVideoDone(taskId, capturedFileId, capturedFileName, capturedPostType, "done");

            // Cleanup output after 5 minutes
            setTimeout(() => {
              try { fs.unlinkSync(result.outputPath); } catch (e) {}
              asyncTasks.delete(taskId);
            }, 5 * 60 * 1000);
          })
          .catch(async (err) => {
            asyncTasks.set(taskId, {
              status: "error",
              file_id: capturedFileId,
              error: err.message,
            });
            try { fs.unlinkSync(capturedInputPath); } catch (e) {}
            await notifyVideoDone(taskId, capturedFileId, capturedFileName, capturedPostType, "error", err.message);
            console.error(`[/process-video] task ${taskId} failed:`, err.message);
          });
      });
    } catch (error) {
      if (inputPath) try { fs.unlinkSync(inputPath); } catch (e) {}
      res.status(500).json({ status: "error", file_id: file_id || null, error: error.message });
    }
  },
);

// --- Cleanup old temp files on startup ---
fs.readdir(TEMP_DIR, (err, files) => {
  if (!err) {
    files.forEach((file) => {
      if (
        file.startsWith("dl_") ||
        file.startsWith("out_") ||
        file.startsWith("vid_") ||
        file.startsWith("wm_")
      ) {
        try {
          fs.unlinkSync(path.join(TEMP_DIR, file));
        } catch (e) {
          /* ignore */
        }
      }
    });
  }
});

// --- Start Server ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Media Processor running on port ${PORT}`);
});
