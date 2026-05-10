const express = require('express');
const crypto = require('crypto');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });
const app = express();
app.use(express.json({ limit: '100mb' }));

// --- Configuration ---
const PORT = process.env.MEDIA_PROCESSOR_PORT || 3001;
const HMAC_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const WATERMARK_STORAGE_PATH = process.env.WATERMARK_STORAGE_PATH || 'nenufar-assets/nenufar-logo.png';
const WATERMARK_PATH = path.join(__dirname, 'logo', 'nenufar-logo.png');
const TEMP_DIR = path.join(__dirname, 'temp');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const uploadWithStorage = multer({
  storage: multer.diskStorage({
    destination: TEMP_DIR,
    filename: (req, file, cb) => cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`),
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const SIZES = {
  portrait:  { width: 1080, height: 1350, fit: 'cover' },
  square:    { width: 1080, height: 1080, fit: 'cover' },
  landscape: { width: 1080, height: 566,  fit: 'cover' },
  story:     { width: 1080, height: 1920, fit: 'cover' },
};

const VIDEO_SIZES = {
  portrait:  { width: 1080, height: 1350 },
  square:    { width: 1080, height: 1080 },
  landscape: { width: 1080, height: 566  },
  story:     { width: 1080, height: 1920 },
};

const VIDEO_CRF = {
  low:    28,
  medium: 23,
  high:   18,
};

// --- Download file from URL ---
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const tempPath = path.join(TEMP_DIR, `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const file = fs.createWriteStream(tempPath);
    client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(tempPath); });
    }).on('error', (err) => { fs.unlinkSync(tempPath); reject(err); });
  });
}

// --- Ensure watermark logo is available ---
let logoDownloaded = false;
async function ensureWatermarkLogo() {
  if (fs.existsSync(WATERMARK_PATH)) { logoDownloaded = true; return; }
  if (logoDownloaded) return;
  const logoDir = path.dirname(WATERMARK_PATH);
  if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });
  if (SUPABASE_URL && SUPABASE_KEY && WATERMARK_STORAGE_PATH) {
    const [bucket, ...pathParts] = WATERMARK_STORAGE_PATH.split('/');
    const filePath = pathParts.join('/');
    const signedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
    const tmpPath = await downloadFile(signedUrl);
    fs.renameSync(tmpPath, WATERMARK_PATH);
    logoDownloaded = true;
  } else {
    console.warn('[watermark] No Supabase credentials and no local logo found at', WATERMARK_PATH, '- skipping watermark');
    return false;
  }
  return true;
}

// --- Preparar PNG del watermark limpio ---
async function buildWatermarkPng(targetSize, opacity) {
  const { data: raw, info } = await sharp(WATERMARK_PATH)
    .resize(targetSize, targetSize, { fit: 'inside' })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < raw.length; i += 4) {
    const lum = 0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2];
    raw[i + 3] = lum > 210 ? 0 : Math.round(255 * opacity);
  }

  return sharp(Buffer.from(raw), {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();
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
  // Paso 1: obtener dimensiones originales
  const meta = await sharp(inputBuffer).metadata();
  const origW = meta.width;
  const origH = meta.height;

  // Paso 2: upscale 2x con lanczos3
  const upscaled = await sharp(inputBuffer)
    .resize(origW * 2, origH * 2, {
      kernel: sharp.kernel.lanczos3,
      fastShrinkOnLoad: false,
    })
    .toBuffer();

  // Paso 3: blur gaussiano en el upscale para disolver juntas entre mostacillas
  // sigma 1.8 a este tamaño equivale a ~0.9 en la imagen original — suave pero efectivo
  const blurred = await sharp(upscaled)
    .blur(1.8)
    .toBuffer();

  // Paso 4: downscale de vuelta con mitchell — preserva estructura sin ringing
  const downscaled = await sharp(blurred)
    .resize(origW, origH, {
      kernel: sharp.kernel.mitchell,
      fastShrinkOnLoad: false,
    })
    .toBuffer();

  // Paso 5: sharpen selectivo post-downscale
  // sigma bajo + m2 alto = recupera bordes grandes (figura del personaje)
  // sin recuperar la cuadrícula de granos (frecuencia alta)
  const sharpened = await sharp(downscaled)
    .sharpen({ sigma: 0.8, m1: 0.3, m2: 3.5, x1: 2.0, y2: 15, y3: 0 })
    .toBuffer();

  // Paso 6: colores de producto fotográfico profesional
  // saturation 1.5 = colores ricos como en foto de estudio
  // brightness 1.06 = evitar que los negros del cabello se hundan
  // hue 0 = no desviar tonos
  const vivid = await sharp(sharpened)
    .modulate({ saturation: 1.5, brightness: 1.06 })
    .toBuffer();

  // Paso 7: contraste local adaptativo
  // clahe normaliza zonas oscuras (capa negra) y claras (libro) por separado
  // maxSlope 4 = contraste pronunciado sin posterización
  const enhanced = await sharp(vivid)
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
    pipeline = pipeline.resize(size.width, size.height, { fit: size.fit });
  }

  if (operations.format === 'jpeg' || operations.format === 'jpg') {
    pipeline = pipeline.jpeg({ quality: 92 }); // subimos a 92 para preservar el detalle mejorado
  } else if (operations.format === 'png') {
    pipeline = pipeline.png();
  } else if (operations.format === 'webp') {
    pipeline = pipeline.webp({ quality: 92 });
  }

  if (operations.watermark) {
    const hasLogo = await ensureWatermarkLogo();
    if (hasLogo === false) operations.watermark = false;
  }

  if (operations.watermark) {
    const opacity = operations.watermark_opacity ?? 0.35;
    const resizedImage = await pipeline.toBuffer();

    const imgMeta = await sharp(resizedImage).metadata();
    const imgW = imgMeta.width  || 1080;
    const imgH = imgMeta.height || 1350;

    const shortSide = Math.min(imgW, imgH);
    const wmSize    = Math.min(Math.round(shortSide * 0.10), 150);
    const margin    = Math.round(shortSide * 0.03);

    const finalWm = await buildWatermarkPng(wmSize, opacity);
    const wmMeta  = await sharp(finalWm).metadata();

    pipeline = sharp(resizedImage).composite([{
      input: finalWm,
      top:   imgH - wmMeta.height - margin,
      left:  imgW - wmMeta.width  - margin,
      blend: 'over',
    }]);
  }

  const outputPath = path.join(
    TEMP_DIR,
    `out_${Date.now()}_${Math.random().toString(36).slice(2)}.${operations.format || 'jpg'}`
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
  const { execFile } = require('child_process');
  const format = operations.format || 'mp4';
  const size   = VIDEO_SIZES[operations.resize] || VIDEO_SIZES.portrait;
  const crf    = VIDEO_CRF[operations.quality]  || VIDEO_CRF.medium;
  const outputPath = path.join(TEMP_DIR, `vid_${Date.now()}_${Math.random().toString(36).slice(2)}.${format}`);

  // super-res simulado en ffmpeg:
  // 1. scale 2x con lanczos
  // 2. gblur para disolver cuadrícula
  // 3. scale de vuelta con lanczos
  // 4. unsharp para recuperar bordes grandes
  // 5. eq para colores vivos
  const enhanceFilter =
    'scale=iw*2:ih*2:flags=lanczos,' +
    'gblur=sigma=1.5,' +
    `scale=${size.width}:${size.height}:flags=lanczos:force_original_aspect_ratio=decrease,` +
    `pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2:black,` +
    'unsharp=5:5:0.5:5:5:0,' +
    'eq=saturation=1.5:brightness=0.06:contrast=1.05';

  let tmpWatermark = null;
  const ffmpegArgs = ['-i', inputPath, '-y'];

  if (operations.watermark) {
    await ensureWatermarkLogo();

    const opacity   = operations.watermark_opacity ?? 0.35;
    const shortSide = Math.min(size.width, size.height);
    const wmSize    = Math.min(Math.round(shortSide * 0.10), 150);
    const margin    = Math.round(shortSide * 0.03);

    const wmBuffer = await buildWatermarkPng(wmSize, opacity);
    tmpWatermark = path.join(TEMP_DIR, `wm_${Date.now()}.png`);
    fs.writeFileSync(tmpWatermark, wmBuffer);

    ffmpegArgs.push('-i', tmpWatermark);
    ffmpegArgs.push(
      '-filter_complex',
      `[0:v]${enhanceFilter}[bg];[bg][1:v]overlay=W-w-${Math.round(Math.min(size.width, size.height) * 0.025)}:H-h-${Math.round(Math.min(size.width, size.height) * 0.025)}`
    );
  } else {
    ffmpegArgs.push('-vf', enhanceFilter);
  }

  if (operations.max_duration) {
    ffmpegArgs.push('-t', String(operations.max_duration));
  }

  if (format === 'mp4') {
    ffmpegArgs.push('-c:v', 'libx264', '-preset', 'fast', '-crf', String(crf), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart');
  } else if (format === 'webm') {
    ffmpegArgs.push('-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-c:a', 'libopus', '-b:a', '128k');
  }

  ffmpegArgs.push(outputPath);

  return new Promise((resolve, reject) => {
    execFile('ffmpeg', ffmpegArgs, { maxBuffer: 100 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (tmpWatermark) { try { fs.unlinkSync(tmpWatermark); } catch (e) { /* ignore */ } }
      if (error) return reject(new Error(`ffmpeg failed: ${error.message}`));
      resolve({ outputPath });
    });
  });
}

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'media-processor', version: '1.4.0', logo: fs.existsSync(WATERMARK_PATH) });
});

// --- Helper: Get file from base64 or URL ---
async function getInputFile(body) {
  if (body.file_base64) {
    const tempPath = path.join(TEMP_DIR, `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(tempPath, Buffer.from(body.file_base64, 'base64'));
    return tempPath;
  }
  if (body.file_url) return await downloadFile(body.file_url);
  throw new Error('Missing file_base64 or file_url');
}

// --- Process Image Endpoint ---
app.post('/process', uploadWithStorage.single('image'), async (req, res) => {
  const file = req.file;
  const { file_url, file_base64, operations: opsStr, file_id } = req.body;
  console.log('[/process] received:', { hasFile: !!file, file_id, opsStr: opsStr ? opsStr.substring(0, 100) : opsStr, bodyKeys: Object.keys(req.body) });

  let operations;
  try {
    operations = opsStr ? JSON.parse(opsStr) : undefined;
  } catch (e) {
    console.error('[/process] JSON.parse failed for opsStr:', opsStr);
    return res.status(400).json({ error: `Invalid operations JSON: ${opsStr}` });
  }

  if ((!file && !file_url && !file_base64) || !operations) {
    return res.status(400).json({ error: 'Missing file or operations', received: { hasFile: !!file, hasUrl: !!file_url, hasBase64: !!file_base64, operations: opsStr } });
  }

  let inputPath  = null;
  let outputPath = null;

  try {
    if (file) {
      inputPath = file.path;
      const stats = fs.statSync(inputPath);
      console.log('[/process] file details:', { path: file.path, size: stats.size, mimetype: file.mimetype, originalname: file.originalname });
    } else {
      inputPath = await getInputFile(req.body);
    }

    const result = await processImage(inputPath, operations);
    outputPath = result.outputPath;

    const processedBuffer = fs.readFileSync(outputPath);
    const base64 = processedBuffer.toString('base64');

    res.json({
      status: 'success',
      file_id: file_id || null,
      data: base64,
      mime_type: `image/${operations.format || 'jpeg'}`,
      size_bytes: processedBuffer.length,
      metadata: {
        width:  result.metadata.width,
        height: result.metadata.height,
        format: result.metadata.format,
      },
    });
  } catch (error) {
    console.error('[/process] processing error:', error.message, error.stack);
    res.status(500).json({ status: 'error', file_id: file_id || null, error: error.message });
  } finally {
    if (inputPath)  try { fs.unlinkSync(inputPath);  } catch (e) { /* ignore */ }
    if (outputPath) try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
  }
});

// --- Process Video Endpoint ---
app.post('/process-video', uploadWithStorage.single('image'), async (req, res) => {
  const file = req.file;
  const { file_url, file_base64, operations: opsStr, file_id } = req.body;
  console.log('[/process-video] received:', { hasFile: !!file, file_id, opsStr: opsStr ? opsStr.substring(0, 100) : opsStr, bodyKeys: Object.keys(req.body) });

  let operations;
  try {
    operations = opsStr ? JSON.parse(opsStr) : undefined;
  } catch (e) {
    console.error('[/process-video] JSON.parse failed for opsStr:', opsStr);
    return res.status(400).json({ error: `Invalid operations JSON: ${opsStr}` });
  }

  if ((!file && !file_url && !file_base64) || !operations) {
    return res.status(400).json({ error: 'Missing file or operations', received: { hasFile: !!file, hasUrl: !!file_url, hasBase64: !!file_base64, operations: opsStr } });
  }

  let inputPath  = null;
  let outputPath = null;

  try {
    if (file) {
      inputPath = file.path;
    } else {
      inputPath = await getInputFile(req.body);
    }

    const result = await processVideo(inputPath, operations);
    outputPath = result.outputPath;

    const processedBuffer = fs.readFileSync(outputPath);
    const base64 = processedBuffer.toString('base64');
    const format = operations.format || 'mp4';

    res.json({
      status: 'success',
      file_id: file_id || null,
      data: base64,
      mime_type: `video/${format}`,
      size_bytes: processedBuffer.length,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', file_id: file_id || null, error: error.message });
  } finally {
    if (inputPath)  try { fs.unlinkSync(inputPath);  } catch (e) { /* ignore */ }
    if (outputPath) try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
  }
});

// --- Cleanup old temp files on startup ---
fs.readdir(TEMP_DIR, (err, files) => {
  if (!err) {
    files.forEach((file) => {
      if (file.startsWith('dl_') || file.startsWith('out_') || file.startsWith('vid_') || file.startsWith('wm_')) {
        try { fs.unlinkSync(path.join(TEMP_DIR, file)); } catch (e) { /* ignore */ }
      }
    });
  }
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Media Processor running on port ${PORT}`);
});