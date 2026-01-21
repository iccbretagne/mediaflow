import sharp from "sharp"

// ============================================
// IMAGE PROCESSING RESULT
// ============================================

export interface ProcessedImage {
  original: Buffer
  thumbnail: Buffer
  metadata: {
    width: number
    height: number
    format: string
  }
}

// ============================================
// ALLOWED MIME TYPES
// ============================================

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

// ============================================
// IMAGE PROCESSING
// ============================================

export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(buffer)
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error("Could not read image metadata")
  }

  // Original: preserve with EXIF rotation applied
  const original = await image
    .rotate() // Auto-rotation based on EXIF
    .jpeg({ quality: 90 })
    .toBuffer()

  // Thumbnail: 400px wide, WebP format
  const thumbnail = await sharp(buffer)
    .rotate()
    .resize(400, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  return {
    original,
    thumbnail,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    },
  }
}

// ============================================
// VALIDATION
// ============================================

export function validateFile(
  filename: string,
  mimeType: string,
  size: number
): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${Math.round(size / 1024 / 1024)}MB (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
    )
  }
}

// ============================================
// GET EXTENSION FROM MIME TYPE
// ============================================

export function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  }
  return extensions[mimeType] || "jpg"
}
