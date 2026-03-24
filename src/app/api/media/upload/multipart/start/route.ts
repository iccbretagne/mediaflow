import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  validateBody,
  successResponse,
  errorResponse,
  ApiError,
} from "@/lib/api-utils"
import {
  StartMultipartUploadSchema,
  MULTIPART_CHUNK_SIZE,
  MULTIPART_URL_EXPIRY,
} from "@/lib/schemas"
import {
  createMultipartUpload,
  getSignedPartUrl,
  getQuarantineKey,
} from "@/lib/s3"
import {
  createUploadSession,
  checkRateLimit,
} from "@/lib/upload-session"

// POST /api/media/upload/multipart/start - Initiate multipart upload
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await validateBody(request, StartMultipartUploadSchema)

    // Check rate limit
    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      throw new ApiError(
        429,
        `Rate limit exceeded. Try again after ${rateLimit.resetAt.toISOString()}`,
        "RATE_LIMIT_EXCEEDED"
      )
    }

    // Verify event or project exists
    if (body.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: body.eventId },
      })
      if (!event) {
        throw new ApiError(404, "Event not found", "NOT_FOUND")
      }
    } else if (body.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: body.projectId },
      })
      if (!project) {
        throw new ApiError(404, "Project not found", "NOT_FOUND")
      }
    }

    // Calculate number of parts
    const totalParts = Math.ceil(body.size / MULTIPART_CHUNK_SIZE)

    // Extract extension from filename
    const extension = body.filename.split(".").pop()?.toLowerCase() || "bin"

    // Create upload session to get the ID (for quarantine key)
    const session = createUploadSession({
      userId: user.id,
      filename: body.filename,
      contentType: body.contentType,
      size: body.size,
      type: body.type,
      eventId: body.eventId,
      projectId: body.projectId,
      s3Key: "", // Set below
      expirySeconds: MULTIPART_URL_EXPIRY,
    })

    const quarantineKey = getQuarantineKey(session.id, extension)

    // Recreate session with correct s3Key and multipart fields
    const { deleteUploadSession, createUploadSession: createSession } = await import("@/lib/upload-session")
    deleteUploadSession(session.id)

    // Initiate S3 multipart upload
    const s3UploadId = await createMultipartUpload(quarantineKey, body.contentType)

    const finalSession = createSession({
      userId: user.id,
      filename: body.filename,
      contentType: body.contentType,
      size: body.size,
      type: body.type,
      eventId: body.eventId,
      projectId: body.projectId,
      s3Key: quarantineKey,
      expirySeconds: MULTIPART_URL_EXPIRY,
      isMultipart: true,
      s3UploadId,
      totalParts,
    })

    // Generate presigned URLs for all parts
    const parts = await Promise.all(
      Array.from({ length: totalParts }, async (_, i) => {
        const partNumber = i + 1
        const url = await getSignedPartUrl(
          quarantineKey,
          s3UploadId,
          partNumber,
          MULTIPART_URL_EXPIRY
        )
        return { partNumber, url }
      })
    )

    return successResponse({
      uploadId: finalSession.id,
      parts,
      expiresAt: finalSession.expiresAt.toISOString(),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
