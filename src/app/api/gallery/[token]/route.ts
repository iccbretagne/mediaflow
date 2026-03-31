import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateParams, successResponse, errorResponse, ApiError } from "@/lib/api-utils"
import { validateShareToken } from "@/lib/tokens"
import { getSignedThumbnailUrl } from "@/lib/s3"
import { TokenParamSchema } from "@/lib/schemas"

type RouteParams = { params: Promise<{ token: string }> }

// GET /api/gallery/[token] - List photos for gallery (per-photo download)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = validateParams(await params, TokenParamSchema)

    const shareToken = await validateShareToken(token, "GALLERY")

    if (!shareToken.eventId) {
      throw new ApiError(400, "Gallery tokens are only supported for events", "INVALID_TOKEN_TYPE")
    }

    const config = (shareToken.config ?? {}) as { onlyApproved?: boolean }
    const onlyApproved = config.onlyApproved === true

    const event = await prisma.event.findUnique({
      where: { id: shareToken.eventId },
      include: { church: { select: { name: true } } },
    })

    if (!event) {
      throw new ApiError(404, "Event not found", "NOT_FOUND")
    }

    const photos = await prisma.media.findMany({
      where: {
        eventId: event.id,
        type: "PHOTO",
        ...(onlyApproved ? { status: "APPROVED" } : {}),
      },
      orderBy: { createdAt: "asc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    })

    const photosWithUrls = await Promise.all(
      photos.map(async (m) => {
        const latest = m.versions[0]
        return {
          id: m.id,
          filename: m.filename,
          thumbnailUrl: latest ? await getSignedThumbnailUrl(latest.thumbnailKey) : "",
          width: m.width,
          height: m.height,
        }
      })
    )

    return successResponse({
      event: {
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        church: event.church.name,
      },
      photos: photosWithUrls,
      onlyApproved,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
