# Media Processor API — Oracle Cloud Worker
Version: v1.2
<!-- v1.2: Added /process-video endpoint with ffmpeg support. -->
<!-- v1.1: Updated response — n8n uploads processed files to Drive /Procesadas/. Oracle returns binary. -->
<!-- v1.1: Updated response — n8n uploads processed files to Drive /Procesadas/. Oracle returns binary. -->
<!-- v1.0: Initial spec for Oracle Cloud Media Processor replacing local n8n image processing. -->

## 1. Overview

The Media Processor API is a lightweight Node.js micro-service running on the **same Oracle Cloud VM** as OpenClaw (Luna). It handles all CPU/RAM-intensive media operations (resize, watermark, format conversion) so that the n8n instance on GCP e2-micro never touches heavy files.

**Why Oracle Cloud:** The OCI Free Tier ARM Ampere A1 instance provides up to 4 OCPU + 24GB RAM — orders of magnitude more powerful than GCP e2-micro (0.25 vCPU, 1GB RAM). Since OpenClaw already runs there, we reuse the existing VM at zero additional cost.

---

## 2. Oracle Cloud VM Setup Guide

### 2.1 Verify Your VM Shape

```bash
# SSH into your Oracle Cloud VM
ssh <user>@<oracle-vm-ip>

# Check the instance shape and resources
nproc        # Should show available OCPUs
free -h      # Should show available RAM
df -h        # Check disk space
uname -m     # Should show aarch64 (ARM)
```

**Recommended allocation for this VM:**
- OpenClaw (Luna): ~1 OCPU + 2GB RAM
- Media Processor API: ~1 OCPU + 2GB RAM
- OS overhead: ~0.5GB RAM
- **Minimum:** 1 OCPU + 4GB RAM total on the VM

### 2.2 Install Node.js (ARM64)

```bash
# Install Node.js 20.x LTS for ARM64
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # v20.x
npm --version
```

### 2.3 Install System Dependencies

```bash
# Sharp's native dependencies (usually bundled, but just in case)
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libvips-dev \
  libpng-dev \
  libjpeg-dev \
  libwebp-dev \
  curl

# Install ffmpeg for future video processing
sudo apt-get install -y ffmpeg
ffmpeg -version
```

### 2.4 Create the Media Processor Project

```bash
# Create project directory
sudo mkdir -p /opt/media-processor
sudo chown $USER:$USER /opt/media-processor
cd /opt/media-processor

# Initialize project
npm init -y

# Install dependencies
npm install sharp express crypto

# Create required directories
mkdir -p temp logo
```

### 2.5 Configure the Watermark Logo Source (Supabase Storage)

The Nenufar watermark logo is stored in **Supabase Storage** — it is NOT stored locally on the Oracle VM. The Media Processor downloads it from Supabase Storage on first use and caches it locally.

#### Step 1: Create the Storage Bucket in Supabase

1. Go to **Supabase Dashboard** -> **Storage**
2. Create a new bucket: `nenufar-assets`
3. Set it as **Private** (accessed via signed URL with service_role key)
4. Upload the logo file: `nenufar-logo.png`

#### Step 2: Note the file path

After uploading, the file path will be: `nenufar-assets/nenufar-logo.png`

#### Step 3: Configure environment variables

Update `/opt/media-processor/.env`:

```bash
MEDIA_PROCESSOR_PORT=3001
WEBHOOK_SECRET=<same-secret-as-n8n-and-openclaw>
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
WATERMARK_STORAGE_PATH=nenufar-assets/nenufar-logo.png
```

The server code (section 2.6) downloads the logo from Supabase Storage on first use using a signed URL and caches it in `/opt/media-processor/logo/` for subsequent requests.

### 2.6 Create the Service

Create `/opt/media-processor/server.js`:

```javascript
const express = require('express');
const crypto = require('crypto');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
app.use(express.json({ limit: '50mb' }));

// --- Configuration ---
const PORT = process.env.MEDIA_PROCESSOR_PORT || 3001;
const HMAC_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const WATERMARK_STORAGE_PATH = process.env.WATERMARK_STORAGE_PATH || 'nenufar-assets/nenufar-logo.png';
const WATERMARK_PATH = path.join(__dirname, 'logo', 'nenufar-logo.png');
const TEMP_DIR = path.join(__dirname, 'temp');

// Target sizes for Instagram/Facebook
const SIZES = {
  portrait: { width: 1080, height: 1350, fit: 'cover' },
  square: { width: 1080, height: 1080, fit: 'cover' },
  landscape: { width: 1080, height: 566, fit: 'cover' },
};

// --- HMAC Validation Middleware ---
function validateHMAC(req, res, next) {
  const signature = req.headers['x-luna-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Missing HMAC signature' });
  }

  const payload = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');

  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid HMAC signature' });
  }
  next();
}

// --- Download file from URL ---
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const tempPath = path.join(TEMP_DIR, `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const file = fs.createWriteStream(tempPath);

    client.get(url, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(tempPath);
      });
    }).on('error', (err) => {
      fs.unlinkSync(tempPath);
      reject(err);
    });
  });
}

// --- Ensure watermark logo is available (download from Supabase Storage if missing) ---
let logoDownloaded = false;
async function ensureWatermarkLogo() {
  if (logoDownloaded && fs.existsSync(WATERMARK_PATH)) return;

  const logoDir = path.dirname(WATERMARK_PATH);
  if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

  if (SUPABASE_URL && SUPABASE_KEY && WATERMARK_STORAGE_PATH) {
    // Download from Supabase Storage using signed URL
    const [bucket, ...pathParts] = WATERMARK_STORAGE_PATH.split('/');
    const filePath = pathParts.join('/');
    const signedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
    const tmpPath = await downloadFile(signedUrl);
    fs.renameSync(tmpPath, WATERMARK_PATH);
    logoDownloaded = true;
  } else {
    throw new Error('Supabase Storage credentials not configured for watermark logo');
  }
}

// --- Process Image ---
async function processImage(inputPath, operations) {
  let pipeline = sharp(inputPath);
  const metadata = await pipeline.metadata();

  // Resize
  if (operations.resize) {
    const size = SIZES[operations.resize] || SIZES.portrait;
    pipeline = pipeline.resize(size.width, size.height, { fit: size.fit });
  }

  // Convert format
  if (operations.format === 'jpeg' || operations.format === 'jpg') {
    pipeline = pipeline.jpeg({ quality: 90 });
  } else if (operations.format === 'png') {
    pipeline = pipeline.png();
  } else if (operations.format === 'webp') {
    pipeline = pipeline.webp({ quality: 90 });
  }

  // Apply watermark
  if (operations.watermark) {
    await ensureWatermarkLogo();
    const opacity = operations.watermark_opacity || 0.15;
    const resizedImage = await pipeline.toBuffer();

    const watermarkBuffer = await sharp(WATERMARK_PATH)
      .resize(Math.round((metadata.width || 1080) * 0.2))
      .ensureAlpha(opacity)
      .toBuffer();

    pipeline = sharp(resizedImage)
      .composite([{
        input: watermarkBuffer,
        gravity: 'southeast',
        blend: 'over',
      }]);
  }

  const outputPath = path.join(TEMP_DIR, `out_${Date.now()}_${Math.random().toString(36).slice(2)}.${operations.format || 'jpg'}`);
  await pipeline.toFile(outputPath);

  return { outputPath, metadata: await sharp(outputPath).metadata() };
}

// --- Video Size Presets ---
const VIDEO_SIZES = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1080, height: 566 },
};

const VIDEO_CRF = {
  low: 28,
  medium: 23,
  high: 18,
};

// --- Process Video with ffmpeg ---
async function processVideo(inputPath, operations) {
  const { execFile } = require('child_process');
  const format = operations.format || 'mp4';
  const size = VIDEO_SIZES[operations.resize] || VIDEO_SIZES.portrait;
  const crf = VIDEO_CRF[operations.quality] || VIDEO_CRF.medium;

  const outputPath = path.join(TEMP_DIR, `vid_${Date.now()}_${Math.random().toString(36).slice(2)}.${format}`);

  const ffmpegArgs = ['-i', inputPath, '-y'];

  // Resize
  ffmpegArgs.push('-vf', `scale=${size.width}:${size.height}:force_original_aspect_ratio=decrease,pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2:black`);

  // Watermark
  if (operations.watermark) {
    await ensureWatermarkLogo();
    const tmpWatermark = path.join(TEMP_DIR, `wm_${Date.now()}.png`);
    // Create watermark with opacity using sharp
    const wmBuffer = await sharp(WATERMARK_PATH)
      .resize(Math.round(size.width * 0.2))
      .ensureAlpha(operations.watermark_opacity || 0.15)
      .toBuffer();
    fs.writeFileSync(tmpWatermark, wmBuffer);

    // Replace -vf with overlay
    ffmpegArgs.pop(); // remove last -vf pad
    ffmpegArgs.pop(); // remove last -vf scale
    ffmpegArgs.push('-i', tmpWatermark);
    ffmpegArgs.push('-filter_complex', `[0:v]scale=${size.width}:${size.height}:force_original_aspect_ratio=decrease,pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2:black[bg];[bg][1:v]overlay=W-w-10:H-h-10`);
  }

  // Max duration
  if (operations.max_duration) {
    ffmpegArgs.push('-t', String(operations.max_duration));
  }

  // Encoding
  if (format === 'mp4') {
    ffmpegArgs.push('-c:v', 'libx264', '-preset', 'fast', '-crf', String(crf), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart');
  } else if (format === 'webm') {
    ffmpegArgs.push('-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-c:a', 'libopus', '-b:a', '128k');
  }

  ffmpegArgs.push(outputPath);

  return new Promise((resolve, reject) => {
    execFile('ffmpeg', ffmpegArgs, { maxBuffer: 100 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(`ffmpeg failed: ${error.message}`));
      resolve({ outputPath });
    });
  });
}

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'media-processor', version: '1.0.0' });
});

// --- Process Endpoint ---
app.post('/process', validateHMAC, async (req, res) => {
  const { file_url, operations, file_id } = req.body;

  if (!file_url || !operations) {
    return res.status(400).json({ error: 'Missing file_url or operations' });
  }

  let inputPath = null;
  let outputPath = null;

  try {
    // 1. Download
    inputPath = await downloadFile(file_url);

    // 2. Process
    const result = await processImage(inputPath, operations);

    // 3. Return processed file as base64
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
        width: result.metadata.width,
        height: result.metadata.height,
        format: result.metadata.format,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      file_id: file_id || null,
      error: error.message,
    });
  } finally {
    // Cleanup temp files
    if (inputPath) try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
    if (outputPath) try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
  }
});

// --- Process Video Endpoint ---
app.post('/process-video', async (req, res) => {
  const { file_url, operations, file_id } = req.body;

  if (!file_url || !operations) {
    return res.status(400).json({ error: 'Missing file_url or operations' });
  }

  let inputPath = null;
  let outputPath = null;

  try {
    inputPath = await downloadFile(file_url);
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
    res.status(500).json({
      status: 'error',
      file_id: file_id || null,
      error: error.message,
    });
  } finally {
    if (inputPath) try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
    if (outputPath) try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
  }
});

// --- Cleanup old temp files on startup ---
fs.readdir(TEMP_DIR, (err, files) => {
  if (!err) {
    files.forEach((file) => {
      if (file.startsWith('dl_') || file.startsWith('out_')) {
        try { fs.unlinkSync(path.join(TEMP_DIR, file)); } catch (e) { /* ignore */ }
      }
    });
  }
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Media Processor API running on port ${PORT}`);
});
```

### 2.7 Configure Environment Variables

Create `/opt/media-processor/.env`:

```bash
MEDIA_PROCESSOR_PORT=3001
WEBHOOK_SECRET=<same-secret-as-n8n-and-openclaw>
```

### 2.8 Create systemd Service (auto-start on boot)

Create `/etc/systemd/system/media-processor.service`:

```ini
[Unit]
Description=Nenufar Media Processor API
After=network.target

[Service]
Type=simple
User=<your-username>
WorkingDirectory=/opt/media-processor
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
EnvironmentFile=/opt/media-processor/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable media-processor
sudo systemctl start media-processor

# Verify it's running
sudo systemctl status media-processor
curl http://localhost:3001/health
```

### 2.9 Open Firewall Port in Oracle Cloud

OCI has TWO firewall layers — you must open both:

**Layer 1: OS firewall (iptables/ufw)**
```bash
sudo iptables -I INPUT 6 -p tcp --dport 3001 -m state --state NEW,ESTABLISHED -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

**Layer 2: OCI Security List (Network Console)**
1. Go to OCI Console -> Networking -> Virtual Cloud Networks
2. Select your VCN -> Security Lists -> Default Security List
3. Add Ingress Rule:
   - Source CIDR: `0.0.0.0/0` (or restrict to GCP e2-micro IP for better security)
   - Protocol: TCP
   - Destination Port: `3001`

### 2.10 Test from GCP

```bash
# From your local machine (or from the GCP instance)
curl -X POST http://<oracle-vm-public-ip>:3001/process \
  -H "Content-Type: application/json" \
  -H "x-luna-signature: <computed-hmac>" \
  -d '{
    "file_url": "https://example.com/test-image.jpg",
    "file_id": "test-001",
    "operations": {
      "resize": "portrait",
      "watermark": true,
      "watermark_opacity": 0.15,
      "format": "jpeg"
    }
  }'
```

---

## 3. API Contract

### 3.1 Request Format

```json
{
  "file_url": "https://drive.google.com/uc?export=download&id=FILE_ID",
  "file_id": "google-drive-file-id",
  "operations": {
    "resize": "portrait|square|landscape",
    "watermark": true,
    "watermark_opacity": 0.15,
    "format": "jpeg|png|webp"
  }
}
```

### 3.2 Response Format (Success)

```json
{
  "status": "success",
  "file_id": "google-drive-file-id",
  "data": "<base64-encoded-image>",
  "mime_type": "image/jpeg",
  "size_bytes": 245678,
  "metadata": {
    "width": 1080,
    "height": 1350,
    "format": "jpeg"
  }
}
```

### 3.3 Response Format (Error)

```json
{
  "status": "error",
  "file_id": "google-drive-file-id",
  "error": "Error message describing what went wrong"
}
```

### 3.4 HMAC Signature Computation

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(requestBody))
  .digest('hex');
// Add as header: x-luna-signature: <signature>
```

---

## 4. n8n Integration (GCP Side)

The n8n Drive Monitor workflow handles the full lifecycle:

1. **Scan Drive `/Input/`** — Detect new files uploaded by Shirley
2. **Filter new files** — Compare against `processed_files` in Supabase
3. **Call Oracle Media Processor** — HTTP POST with file URL and operations
4. **Upload to Drive `/Procesadas/`** — Google Drive upload node saves the processed image
5. **Update Supabase** — Store `processed_file_id` and `processed_file_name` in `metadata`

**Flow:**
```
Drive /Input/ → Oracle (resize + watermark) → Drive /Procesadas/ → Supabase metadata
```

**Important:** Oracle returns the processed image as base64. n8n is responsible for uploading it to Google Drive `/Procesadas/` and recording the file ID in Supabase. Oracle does NOT upload to Drive directly.

---

## 5. Future: Video Processing Extension

When video support is needed, the same service can be extended:

```javascript
// Future endpoint: POST /process-video
// Uses ffmpeg for: compression, resize, codec optimization, watermark overlay
// n8n sends video URL -> Oracle processes with ffmpeg -> returns processed video
```

---

## 6. Resource Monitoring

```bash
# Check Media Processor resource usage
ps aux | grep "node server.js"

# Monitor memory
watch -n 5 free -h

# Check logs
sudo journalctl -u media-processor -f
```
