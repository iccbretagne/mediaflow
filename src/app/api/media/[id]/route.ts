import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isSuperAdmin } from "@/lib/auth"
import { successResponse, errorResponse, ApiError, validateParams } from "@/lib/api-utils"
import { deleteFiles } from "@/lib/s3"
import { z } from "zod"

const ParamsSchema = z.object({
  id: z.string().min(1),
})

type RouteParams = { params: Promise<{ id: string }> }

// DELETE /api/media/[id] - Delete a media item
// Only the uploader or a super admin can delete
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = validateParams(await params, ParamsSchema)

    // Fetch the media with its versions to check ownership
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: "asc" },
          select: {
            id: true,
            createdById: true,
            originalKey: true,
            thumbnailKey: true,
          },
        },
      },
    })

    if (!media) {
      throw new ApiError(404, "Media not found", "NOT_FOUND")
    }

    // Check authorization: uploader (first version creator) or super admin
    const uploaderId = media.versions[0]?.createdById
    const isUploader = uploaderId === user.id
    const isSuper = isSuperAdmin(user.email)

    if (!isUploader && !isSuper) {
      throw new ApiError(
        403,
        "Vous n'êtes pas autorisé à supprimer ce média",
        "FORBIDDEN"
      )
    }

    // Collect all S3 keys to delete
    const keysToDelete: string[] = []
    for (const version of media.versions) {
      keysToDelete.push(version.originalKey)
      keysToDelete.push(version.thumbnailKey)
    }

    // Delete from database (cascades to versions and comments)
    await prisma.media.delete({
      where: { id },
    })

    // Delete files from S3
    if (keysToDelete.length > 0) {
      await deleteFiles(keysToDelete)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    return errorResponse(error)
  }
}
