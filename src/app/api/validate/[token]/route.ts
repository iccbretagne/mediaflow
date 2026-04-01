import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  validateBody,
  validateParams,
  successResponse,
  errorResponse,
  ApiError,
} from "@/lib/api-utils"
import { SubmitValidationSchema, TokenParamSchema } from "@/lib/schemas"
import type { MediaStatus } from "@/lib/schemas"
import { validateShareToken, isPrevalidationActive } from "@/lib/tokens"
import { getSignedThumbnailUrl, getSignedOriginalUrl } from "@/lib/s3"

type RouteParams = { params: Promise<{ token: string }> }

function normalizeMediaStatus(status: string): "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED" {
  if (status === "APPROVED" || status === "FINAL_APPROVED") return "APPROVED"
  if (status === "REVISION_REQUESTED") return "REVISION_REQUESTED"
  if (status === "REJECTED") return "REJECTED"
  return "PENDING"
}

// GET /api/validate/[token] - Get event for validation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = validateParams(await params, TokenParamSchema)
    const shareToken = await validateShareToken(token, ["VALIDATOR", "PREVALIDATOR"])

    const isPrevalidator = shareToken.type === "PREVALIDATOR"
    const event = shareToken.event

    if (event) {
      const prevalidationActive = isPrevalidationActive(event.shareTokens)

      // Determine which statuses to show based on token type
      let statusFilter: MediaStatus[]
      if (isPrevalidator) {
        // Prevalidator sees only PENDING photos
        statusFilter = ["PENDING"]
      } else if (prevalidationActive) {
        // Validator with prevalidation active: sees PREVALIDATED + already validated
        statusFilter = ["PREVALIDATED", "APPROVED", "REJECTED"]
      } else {
        // Validator without prevalidation: sees everything except PREREJECTED
        statusFilter = ["PENDING", "PREVALIDATED", "APPROVED", "REJECTED"]
      }

      const media = await prisma.media.findMany({
        where: {
          eventId: event.id,
          type: "PHOTO",
          status: { in: statusFilter },
        },
        include: {
          versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        },
      })

      const photosWithUrls = await Promise.all(
        media.map(async (m) => {
          const latest = m.versions[0]
          // For validator with prevalidation: show PREVALIDATED as PENDING for transparency
          let displayStatus: string
          if (!isPrevalidator && prevalidationActive && m.status === "PREVALIDATED") {
            displayStatus = "PENDING"
          } else if (m.status === "APPROVED" || m.status === "REJECTED") {
            displayStatus = m.status
          } else {
            displayStatus = "PENDING"
          }
          return {
            id: m.id,
            type: "PHOTO",
            filename: m.filename,
            thumbnailUrl: latest ? await getSignedThumbnailUrl(latest.thumbnailKey) : "",
            status: displayStatus,
            width: m.width,
            height: m.height,
            uploadedAt: m.createdAt.toISOString(),
            validatedAt: null,
          }
        })
      )

      // Get all media for stats (unfiltered)
      const allMedia = await prisma.media.findMany({
        where: { eventId: event.id, type: "PHOTO" },
        select: { status: true },
      })

      const stats = {
        total: allMedia.length,
        pending: allMedia.filter((p) => p.status === "PENDING").length,
        approved: allMedia.filter((p) => p.status === "APPROVED").length,
        rejected: allMedia.filter((p) => p.status === "REJECTED").length,
        ...(prevalidationActive || isPrevalidator
          ? {
              prevalidated: allMedia.filter((p) => p.status === "PREVALIDATED").length,
              prerejected: allMedia.filter((p) => p.status === "PREREJECTED").length,
            }
          : {}),
      }

      return successResponse({
        event: {
          id: event.id,
          name: event.name,
          date: event.date.toISOString(),
          church: event.church.name,
        },
        photos: photosWithUrls,
        stats,
        tokenType: shareToken.type as "VALIDATOR" | "PREVALIDATOR",
      })
    }

    if (!shareToken.projectId) {
      throw new ApiError(400, "This token is not associated with a project", "INVALID_TOKEN_TYPE")
    }

    const project = await prisma.project.findUnique({
      where: { id: shareToken.projectId },
      include: {
        church: { select: { name: true } },
        media: {
          orderBy: { createdAt: "desc" },
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
            },
          },
        },
        shareTokens: {
          select: { type: true },
        },
      },
    })

    if (!project) {
      throw new ApiError(404, "Project not found", "NOT_FOUND")
    }

    const projectPrevalidationActive = isPrevalidationActive(project.shareTokens)

    // Determine which statuses to show based on token type
    let projectStatusFilter: MediaStatus[] | null = null
    if (isPrevalidator) {
      projectStatusFilter = ["PENDING"]
    } else if (projectPrevalidationActive) {
      projectStatusFilter = ["PREVALIDATED", "APPROVED", "REJECTED", "FINAL_APPROVED"]
    }

    const filteredMedia = projectStatusFilter
      ? project.media.filter((m) => projectStatusFilter!.includes(m.status as MediaStatus))
      : project.media

    const mediaWithUrls = await Promise.all(
      filteredMedia.map(async (media) => {
        const latestVersion = media.versions[0]
        if (!latestVersion) {
          return null
        }

        // For validator with prevalidation: show PREVALIDATED as PENDING
        let displayStatus: string
        if (!isPrevalidator && projectPrevalidationActive && media.status === "PREVALIDATED") {
          displayStatus = "PENDING"
        } else {
          displayStatus = normalizeMediaStatus(media.status)
        }

        return {
          id: media.id,
          type: media.type,
          filename: media.filename,
          thumbnailUrl: await getSignedThumbnailUrl(latestVersion.thumbnailKey),
          ...(media.type === "VIDEO"
            ? { originalUrl: await getSignedOriginalUrl(latestVersion.originalKey) }
            : {}),
          status: displayStatus,
          width: media.width,
          height: media.height,
          uploadedAt: media.createdAt.toISOString(),
          validatedAt: null,
        }
      })
    )

    const photos = mediaWithUrls.filter((item): item is NonNullable<typeof item> => item !== null)

    // Get all media for stats (unfiltered)
    const allProjectMedia = project.media
    const stats = {
      total: allProjectMedia.length,
      pending: allProjectMedia.filter((m) => m.status === "PENDING").length,
      approved: allProjectMedia.filter((m) => m.status === "APPROVED" || m.status === "FINAL_APPROVED").length,
      rejected: allProjectMedia.filter((m) => m.status === "REJECTED").length,
      ...(projectPrevalidationActive || isPrevalidator
        ? {
            prevalidated: allProjectMedia.filter((m) => m.status === "PREVALIDATED").length,
            prerejected: allProjectMedia.filter((m) => m.status === "PREREJECTED").length,
          }
        : {}),
    }

    return successResponse({
      event: {
        id: project.id,
        name: project.name,
        date: project.createdAt.toISOString(),
        church: project.church.name,
      },
      photos,
      stats,
      tokenType: shareToken.type as "VALIDATOR" | "PREVALIDATOR",
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/validate/[token] - Submit validation decisions
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = validateParams(await params, TokenParamSchema)
    const shareToken = await validateShareToken(token, ["VALIDATOR", "PREVALIDATOR"])
    const body = await validateBody(request, SubmitValidationSchema)

    const isPrevalidator = shareToken.type === "PREVALIDATOR"

    // Validate allowed statuses per token type
    const allowedStatuses = isPrevalidator
      ? ["PREVALIDATED", "PREREJECTED", "PENDING"]
      : ["APPROVED", "REJECTED", "PENDING"]

    for (const decision of body.decisions) {
      if (!allowedStatuses.includes(decision.status)) {
        throw new ApiError(
          403,
          `Status "${decision.status}" is not allowed for ${shareToken.type} tokens`,
          "FORBIDDEN_STATUS"
        )
      }
    }

    const eventId = shareToken.eventId

    if (eventId) {
      const photoIds = body.decisions.map((d) => d.photoId)
      const photos = await prisma.media.findMany({
        where: {
          id: { in: photoIds },
          eventId,
          type: "PHOTO",
        },
      })

      if (photos.length !== photoIds.length) {
        throw new ApiError(400, "Some photos do not belong to this event", "INVALID_PHOTOS")
      }

      const updates = body.decisions.map((decision) =>
        prisma.media.update({
          where: { id: decision.photoId },
          data: {
            status: decision.status,
          },
        })
      )

      await prisma.$transaction(updates)

      // Get updated stats
      const allPhotos = await prisma.media.findMany({
        where: { eventId, type: "PHOTO" },
        select: { status: true },
      })

      const stats = {
        total: allPhotos.length,
        approved: allPhotos.filter((p) => p.status === "APPROVED").length,
        rejected: allPhotos.filter((p) => p.status === "REJECTED").length,
      }

      // Auto-transition event status
      if (!isPrevalidator) {
        const prevalidationActive = shareToken.event
          ? isPrevalidationActive(shareToken.event.shareTokens)
          : false

        // Determine what constitutes "all reviewed"
        const remainingCount = prevalidationActive
          ? allPhotos.filter((p) => p.status === "PREVALIDATED").length
          : allPhotos.filter((p) => p.status === "PENDING").length

        if (remainingCount === 0) {
          await prisma.event.update({
            where: { id: eventId },
            data: { status: "REVIEWED" },
          })
        }
      }

      return successResponse({
        updated: body.decisions.length,
        stats,
      })
    }

    if (!shareToken.projectId) {
      throw new ApiError(400, "This token is not associated with a project", "INVALID_TOKEN_TYPE")
    }

    const mediaIds = body.decisions.map((d) => d.photoId)
    const media = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        projectId: shareToken.projectId,
      },
      select: { id: true },
    })

    if (media.length !== mediaIds.length) {
      throw new ApiError(400, "Some media do not belong to this project", "INVALID_MEDIA")
    }

    const updates = body.decisions.map((decision) =>
      prisma.media.update({
        where: { id: decision.photoId },
        data: {
          status: decision.status,
        },
      })
    )

    await prisma.$transaction(updates)

    const allMedia = await prisma.media.findMany({
      where: { projectId: shareToken.projectId },
      select: { status: true },
    })

    const stats = {
      total: allMedia.length,
      approved: allMedia.filter((m) => m.status === "APPROVED" || m.status === "FINAL_APPROVED").length,
      rejected: allMedia.filter((m) => m.status === "REJECTED").length,
    }

    return successResponse({
      updated: body.decisions.length,
      stats,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
