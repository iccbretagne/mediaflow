import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  validateBody,
  validateParams,
  errorResponse,
  successResponse,
  ApiError,
} from "@/lib/api-utils"
import { MediaIdParamSchema, UpdateMediaStatusSchema } from "@/lib/schemas"
import { validateShareToken } from "@/lib/tokens"
import { createId } from "@paralleldrive/cuid2"

type RouteParams = { params: Promise<{ id: string }> }

function isValidTransition(current: string, next: string, type: string): boolean {
  if (type === "PHOTO") {
    return current === "PENDING" && (next === "APPROVED" || next === "REJECTED")
  }

  const transitions: Record<string, string[]> = {
    DRAFT: ["IN_REVIEW", "FINAL_APPROVED", "REJECTED", "REVISION_REQUESTED"],
    PENDING: ["IN_REVIEW", "FINAL_APPROVED", "REJECTED", "REVISION_REQUESTED"],
    IN_REVIEW: ["FINAL_APPROVED", "REJECTED", "REVISION_REQUESTED", "IN_REVIEW"],
    REVISION_REQUESTED: ["IN_REVIEW", "FINAL_APPROVED", "REJECTED", "REVISION_REQUESTED"],
    REJECTED: ["IN_REVIEW", "FINAL_APPROVED", "REVISION_REQUESTED", "REJECTED"],
    FINAL_APPROVED: ["IN_REVIEW", "REJECTED", "REVISION_REQUESTED", "FINAL_APPROVED"],
    APPROVED: [],
  }

  return transitions[current]?.includes(next) ?? false
}

async function getMediaWithAccess(request: NextRequest, mediaId: string) {
  const token = new URL(request.url).searchParams.get("token")
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      project: { select: { id: true, createdById: true } },
      event: { select: { id: true, createdById: true } },
    },
  })

  if (!media) {
    throw new ApiError(404, "Media not found", "NOT_FOUND")
  }

  if (token) {
    const shareToken = await validateShareToken(token, "VALIDATOR")
    if (!shareToken.projectId || shareToken.projectId !== media.projectId) {
      throw new ApiError(403, "Not authorized to review this media", "FORBIDDEN")
    }
    return { media, actor: "token" as const }
  }

  const user = await requireAuth()
  if (media.projectId && media.project?.createdById !== user.id) {
    throw new ApiError(403, "Not authorized to update this media", "FORBIDDEN")
  }
  if (media.eventId && media.event?.createdById !== user.id) {
    throw new ApiError(403, "Not authorized to update this media", "FORBIDDEN")
  }

  return { media, actor: "user" as const }
}

// PATCH /api/media/[id]/status - Update media status (workflow transitions)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = validateParams(await params, MediaIdParamSchema)
    const body = await validateBody(request, UpdateMediaStatusSchema)

    const { media } = await getMediaWithAccess(request, id)

    if (!isValidTransition(media.status, body.status, media.type)) {
      throw new ApiError(400, "Invalid status transition", "INVALID_TRANSITION")
    }

    if (body.status === "REVISION_REQUESTED") {
      if (!body.comment || body.comment.trim().length === 0) {
        throw new ApiError(400, "Comment is required for revision request", "COMMENT_REQUIRED")
      }

      const token = new URL(request.url).searchParams.get("token")
      let authorName: string | null = null

      let authorConnect: { id: string } | null = null
      if (token) {
        const shareToken = await validateShareToken(token, "VALIDATOR")
        authorName = shareToken.label || "Validator"
      } else {
        const user = await requireAuth()
        authorName = user.name || null
        authorConnect = { id: user.id }
      }

      await prisma.comment.create({
        data: {
          id: createId(),
          content: body.comment.trim(),
          type: "GENERAL",
          timecode: null,
          media: { connect: { id: media.id } },
          authorName,
          ...(authorConnect ? { author: { connect: authorConnect } } : {}),
        },
      })
    }

    const updated = await prisma.media.update({
      where: { id: media.id },
      data: {
        status: body.status,
      },
    })

    return successResponse({
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
