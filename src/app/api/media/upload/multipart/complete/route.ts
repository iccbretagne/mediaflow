import { NextRequest } from "next/server"
import { createId } from "@paralleldrive/cuid2"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  validateBody,
  successResponse,
  errorResponse,
  ApiError,
} from "@/lib/api-utils"
import { CompleteMultipartUploadSchema } from "@/lib/schemas"
import {
  completeMultipartUpload,
  abortMultipartUpload,
  getFileHead,
  getFileBytes,
  moveFile,
  uploadFile,
  getMediaOriginalKey,
  getMediaThumbnailKey,
  getSignedThumbnailUrl,
  deleteFile,
} from "@/lib/s3"
import { getUploadSession, deleteUploadSession } from "@/lib/upload-session"
import { validateMagicBytes } from "@/lib/magic-bytes"
import { generateThumbnail } from "@/lib/sharp"

function generateMediaId(): string {
  return createId()
}

// POST /api/media/upload/multipart/complete - Complete multipart upload and create media record
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await validateBody(request, CompleteMultipartUploadSchema)

    // Get upload session
    const session = getUploadSession(body.uploadId)
    if (!session) {
      throw new ApiError(404, "Upload session not found or expired", "SESSION_NOT_FOUND")
    }

    // Verify session belongs to user
    if (session.userId !== user.id) {
      throw new ApiError(403, "Not authorized to confirm this upload", "FORBIDDEN")
    }

    // Verify this is a multipart session
    if (!session.isMultipart || !session.s3UploadId) {
      throw new ApiError(400, "Not a multipart upload session", "NOT_MULTIPART")
    }

    // Verify all parts are provided
    if (body.parts.length !== session.totalParts) {
      throw new ApiError(
        400,
        `Expected ${session.totalParts} parts, received ${body.parts.length}`,
        "PARTS_MISMATCH"
      )
    }

    // Complete the S3 multipart upload
    try {
      await completeMultipartUpload(session.s3Key, session.s3UploadId, body.parts)
    } catch (err) {
      // If completion fails, try to abort
      try {
        await abortMultipartUpload(session.s3Key, session.s3UploadId)
      } catch {
        // Ignore abort errors
      }
      deleteUploadSession(body.uploadId)
      throw new ApiError(500, "Failed to complete multipart upload", "MULTIPART_COMPLETE_FAILED")
    }

    // From here, the file is assembled in S3 — same validation as confirm route

    // Verify file size
    const fileHead = await getFileHead(session.s3Key)
    if (!fileHead) {
      throw new ApiError(500, "Could not read file metadata", "READ_ERROR")
    }

    if (fileHead.size !== session.size) {
      await deleteFile(session.s3Key)
      deleteUploadSession(body.uploadId)
      throw new ApiError(400, "File size mismatch", "SIZE_MISMATCH")
    }

    // Validate magic bytes (first up to 512 bytes)
    if (session.size === 0) {
      await deleteFile(session.s3Key)
      deleteUploadSession(body.uploadId)
      throw new ApiError(400, "File is empty", "EMPTY_FILE")
    }

    const headerEnd = Math.min(511, session.size - 1)
    const headerBytes = await getFileBytes(session.s3Key, 0, headerEnd)
    if (!headerBytes) {
      throw new ApiError(500, "Could not read file header", "READ_ERROR")
    }

    const validation = validateMagicBytes(new Uint8Array(headerBytes), session.contentType)
    if (!validation.valid) {
      await deleteFile(session.s3Key)
      deleteUploadSession(body.uploadId)
      throw new ApiError(
        400,
        `File type mismatch. Expected ${session.contentType}, detected ${validation.detectedType || "unknown"}`,
        "TYPE_MISMATCH"
      )
    }

    // Generate media ID
    const mediaId = generateMediaId()

    // Determine container type and ID
    const containerType = session.eventId ? "events" : "projects"
    const containerId = session.eventId || session.projectId!

    // Extract extension from filename
    const extension = session.filename.split(".").pop()?.toLowerCase() || "bin"

    // Generate final keys
    const originalKey = getMediaOriginalKey(containerType, containerId, mediaId, extension)
    const thumbnailKey = getMediaThumbnailKey(containerType, containerId, mediaId)

    // Process thumbnail
    let thumbnailBuffer: Buffer

    if (session.type === "VIDEO") {
      if (!body.thumbnailDataUrl) {
        throw new ApiError(400, "Thumbnail required for video uploads", "THUMBNAIL_REQUIRED")
      }

      const matches = body.thumbnailDataUrl.match(/^data:image\/\w+;base64,(.+)$/)
      if (!matches) {
        throw new ApiError(400, "Invalid thumbnail data URL format", "INVALID_THUMBNAIL")
      }

      const base64Data = matches[1]
      const imageBuffer = Buffer.from(base64Data, "base64")
      thumbnailBuffer = await generateThumbnail(imageBuffer)
    } else {
      const originalFileBytes = await getFileBytes(session.s3Key, 0, session.size - 1)
      if (!originalFileBytes) {
        throw new ApiError(500, "Could not read uploaded file for thumbnail generation", "READ_ERROR")
      }

      if (session.contentType === "application/pdf") {
        thumbnailBuffer = await generatePlaceholderThumbnail("PDF")
      } else if (session.contentType === "image/svg+xml") {
        thumbnailBuffer = await generatePlaceholderThumbnail("SVG")
      } else {
        thumbnailBuffer = await generateThumbnail(originalFileBytes)
      }
    }

    // Move file from quarantine to final location
    await moveFile(session.s3Key, originalKey)

    // Upload thumbnail
    await uploadFile(thumbnailKey, thumbnailBuffer, "image/webp")

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        id: mediaId,
        type: session.type,
        status: "DRAFT",
        filename: session.filename,
        mimeType: session.contentType,
        size: session.size,
        ...(session.eventId && { eventId: session.eventId }),
        ...(session.projectId && { projectId: session.projectId }),
      },
    })

    // Create initial version record
    await prisma.mediaVersion.create({
      data: {
        id: createId(),
        mediaId: media.id,
        versionNumber: 1,
        originalKey,
        thumbnailKey,
        createdById: user.id,
      },
    })

    // Delete upload session
    deleteUploadSession(body.uploadId)

    // Get signed thumbnail URL
    const thumbnailUrl = await getSignedThumbnailUrl(thumbnailKey)

    return successResponse({
      id: media.id,
      type: media.type,
      filename: media.filename,
      thumbnailUrl,
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

// Helper function to generate placeholder thumbnail
async function generatePlaceholderThumbnail(type: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default

  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="48" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">${type}</text>
    </svg>
  `

  return sharp(Buffer.from(svg))
    .resize(400, 300, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer()
}
