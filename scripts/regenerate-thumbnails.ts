/**
 * Script de régénération des thumbnails à 1200px
 *
 * Usage:
 *   npm run regenerate-thumbnails
 *
 * Ce script:
 * 1. Récupère toutes les photos (Photo) et versions média (MediaVersion)
 * 2. Télécharge l'original depuis S3
 * 3. Régénère le thumbnail à 1200px (au lieu de 400px)
 * 4. Upload le nouveau thumbnail sur S3
 */

import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import sharp from "sharp"
import "dotenv/config"

// ============================================
// CONFIGURATION
// ============================================

const DRY_RUN = process.argv.includes("--dry-run")
const BATCH_SIZE = 10 // Process 10 items at a time to avoid memory issues

// ============================================
// PRISMA CLIENT
// ============================================

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "mediaflow",
    connectionLimit: 5,
  })

  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

// ============================================
// S3 CLIENT
// ============================================

const s3Client = new S3Client({
  region: process.env.S3_REGION || "gra",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET || ""

// ============================================
// HELPERS
// ============================================

async function downloadFile(key: string): Promise<Buffer | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )

    if (!response.Body) {
      return null
    }

    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  } catch (error) {
    console.error(`  ❌ Erreur téléchargement ${key}:`, error)
    return null
  }
}

async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<boolean> {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    )
    return true
  } catch (error) {
    console.error(`  ❌ Erreur upload ${key}:`, error)
    return false
  }
}

async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Auto-rotation based on EXIF
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
}

// ============================================
// PROCESSING
// ============================================

interface ProcessResult {
  total: number
  success: number
  failed: number
  skipped: number
}

async function processPhotos(): Promise<ProcessResult> {
  console.log("\n📷 Traitement des Photos (legacy)...")

  const photos = await prisma.photo.findMany({
    select: {
      id: true,
      filename: true,
      originalKey: true,
      thumbnailKey: true,
    },
  })

  console.log(`   ${photos.length} photos trouvées`)

  const result: ProcessResult = {
    total: photos.length,
    success: 0,
    failed: 0,
    skipped: 0,
  }

  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (photo) => {
        const index = photos.indexOf(photo) + 1
        process.stdout.write(
          `\r   [${index}/${photos.length}] ${photo.filename.slice(0, 30)}...`
        )

        if (DRY_RUN) {
          result.skipped++
          return
        }

        // Download original
        const original = await downloadFile(photo.originalKey)
        if (!original) {
          result.failed++
          return
        }

        // Generate new thumbnail
        let thumbnail: Buffer
        try {
          thumbnail = await generateThumbnail(original)
        } catch (error) {
          console.error(`\n  ❌ Erreur Sharp ${photo.filename}:`, error)
          result.failed++
          return
        }

        // Upload new thumbnail
        const success = await uploadFile(
          photo.thumbnailKey,
          thumbnail,
          "image/webp"
        )

        if (success) {
          result.success++
        } else {
          result.failed++
        }
      })
    )
  }

  console.log() // New line after progress
  return result
}

async function processMediaVersions(): Promise<ProcessResult> {
  console.log("\n🎬 Traitement des MediaVersions...")

  const versions = await prisma.mediaVersion.findMany({
    select: {
      id: true,
      originalKey: true,
      thumbnailKey: true,
      media: {
        select: {
          filename: true,
          type: true,
          mimeType: true,
        },
      },
    },
  })

  // Filter only images (PHOTO and VISUAL, not VIDEO)
  const imageVersions = versions.filter(
    (v) => v.media.type === "PHOTO" || v.media.type === "VISUAL"
  )

  console.log(
    `   ${imageVersions.length} versions image trouvées (${versions.length - imageVersions.length} vidéos ignorées)`
  )

  const result: ProcessResult = {
    total: imageVersions.length,
    success: 0,
    failed: 0,
    skipped: 0,
  }

  for (let i = 0; i < imageVersions.length; i += BATCH_SIZE) {
    const batch = imageVersions.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (version) => {
        const index = imageVersions.indexOf(version) + 1
        process.stdout.write(
          `\r   [${index}/${imageVersions.length}] ${version.media.filename.slice(0, 30)}...`
        )

        if (DRY_RUN) {
          result.skipped++
          return
        }

        // Download original
        const original = await downloadFile(version.originalKey)
        if (!original) {
          result.failed++
          return
        }

        // Generate new thumbnail
        let thumbnail: Buffer
        try {
          thumbnail = await generateThumbnail(original)
        } catch (error) {
          console.error(`\n  ❌ Erreur Sharp ${version.media.filename}:`, error)
          result.failed++
          return
        }

        // Upload new thumbnail
        const success = await uploadFile(
          version.thumbnailKey,
          thumbnail,
          "image/webp"
        )

        if (success) {
          result.success++
        } else {
          result.failed++
        }
      })
    )
  }

  console.log() // New line after progress
  return result
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("🔄 Régénération des thumbnails (400px → 1200px)")
  console.log("================================================")

  if (DRY_RUN) {
    console.log("⚠️  Mode dry-run activé (aucune modification)")
  }

  if (!BUCKET) {
    console.error("❌ S3_BUCKET non défini")
    process.exit(1)
  }

  console.log(`📦 Bucket: ${BUCKET}`)

  const photoResult = await processPhotos()
  const mediaResult = await processMediaVersions()

  console.log("\n================================================")
  console.log("📊 Résumé:")
  console.log(
    `   Photos:        ${photoResult.success}/${photoResult.total} ✅  ${photoResult.failed} ❌`
  )
  console.log(
    `   MediaVersions: ${mediaResult.success}/${mediaResult.total} ✅  ${mediaResult.failed} ❌`
  )

  const totalSuccess = photoResult.success + mediaResult.success
  const totalFailed = photoResult.failed + mediaResult.failed
  const total = photoResult.total + mediaResult.total

  console.log(`\n   Total: ${totalSuccess}/${total} thumbnails régénérés`)

  if (totalFailed > 0) {
    console.log(`   ⚠️  ${totalFailed} erreurs`)
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error("❌ Erreur fatale:", error)
  process.exit(1)
})
