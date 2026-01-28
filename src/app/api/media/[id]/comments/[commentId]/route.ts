import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  validateParams,
  errorResponse,
  ApiError,
} from "@/lib/api-utils"
import { z } from "zod"

const ParamsSchema = z.object({
  id: z.string().cuid2(),
  commentId: z.string().cuid(),
})

type RouteParams = { params: Promise<{ id: string; commentId: string }> }

// DELETE /api/media/[id]/comments/[commentId] - Delete comment (author or owner)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id, commentId } = validateParams(await params, ParamsSchema)

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        media: {
          include: {
            project: { select: { createdById: true } },
            event: { select: { createdById: true } },
          },
        },
      },
    })

    if (!comment || comment.mediaId !== id) {
      throw new ApiError(404, "Comment not found", "NOT_FOUND")
    }

    const ownerId = comment.media.project?.createdById || comment.media.event?.createdById
    if (comment.authorId !== user.id && ownerId !== user.id) {
      throw new ApiError(403, "Not authorized to delete this comment", "FORBIDDEN")
    }

    await prisma.comment.delete({ where: { id: commentId } })

    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
