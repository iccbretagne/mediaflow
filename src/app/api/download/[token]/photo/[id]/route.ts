import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateParams, successResponse, errorResponse, ApiError } from "@/lib/api-utils"
import { validateShareToken } from "@/lib/tokens"
import { getSignedDownloadUrl } from "@/lib/s3"
import { z } from "zod"

const ParamsSchema = z.object({
  token: z.string().length(64),
  id: z.string().cuid(),
})

type RouteParams = { params: Promise<{ token: string; id: string }> }

// GET /api/download/[token]/photo/[id] - Download a photo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token, id } = validateParams(await params, ParamsSchema)

    const shareToken = await validateShareToken(token)

    // Find photo
    const photo = await prisma.photo.findUnique({
      where: { id },
    })

    if (!photo || photo.eventId !== shareToken.eventId) {
      throw new ApiError(404, "Photo not found", "NOT_FOUND")
    }

    // Only allow download of approved photos for MEDIA tokens
    if (shareToken.type === "MEDIA" && photo.status !== "APPROVED") {
      throw new ApiError(403, "Photo not validated", "NOT_APPROVED")
    }

    const url = await getSignedDownloadUrl(photo.originalKey, photo.filename)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    return successResponse({
      url,
      expiresAt: expiresAt.toISOString(),
      filename: photo.filename,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
