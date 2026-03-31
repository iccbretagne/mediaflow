import { NextRequest } from "next/server"
import { MediaStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { validateParams, errorResponse, ApiError } from "@/lib/api-utils"
import { getSignedOriginalUrl } from "@/lib/s3"
import { Cuid2IdParamSchema } from "@/lib/schemas"
import archiver from "archiver"

type RouteParams = { params: Promise<{ id: string }> }

const FILTER_VALUES = ["all", "approved", "rejected"] as const
type Filter = (typeof FILTER_VALUES)[number]

const STATUS_MAP: Record<Filter, MediaStatus[]> = {
  all: [MediaStatus.PENDING, MediaStatus.APPROVED, MediaStatus.REJECTED, MediaStatus.PREVALIDATED, MediaStatus.PREREJECTED],
  approved: [MediaStatus.APPROVED],
  rejected: [MediaStatus.REJECTED, MediaStatus.PREREJECTED],
}

// GET /api/events/[id]/download?filter=all|approved|rejected
// Admin-only ZIP download of event photos
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()

    if (user.role !== "ADMIN") {
      throw new ApiError(403, "Forbidden", "FORBIDDEN")
    }

    const { id } = validateParams(await params, Cuid2IdParamSchema)

    const filterParam = request.nextUrl.searchParams.get("filter") ?? "all"
    if (!FILTER_VALUES.includes(filterParam as Filter)) {
      throw new ApiError(400, "Invalid filter. Use: all, approved, rejected", "INVALID_FILTER")
    }
    const filter = filterParam as Filter

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!event) {
      throw new ApiError(404, "Event not found", "NOT_FOUND")
    }

    const statuses = STATUS_MAP[filter]

    const photos = await prisma.media.findMany({
      where: {
        eventId: event.id,
        type: "PHOTO",
        status: { in: statuses },
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    })

    if (photos.length === 0) {
      throw new ApiError(404, "No photos found for this filter", "NO_PHOTOS")
    }

    const safeName = event.name
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, "")
      .replace(/\s+/g, "_")
      .slice(0, 50)
    const suffix = filter === "all" ? "toutes" : filter === "approved" ? "validees" : "rejetees"
    const zipFilename = `${safeName}_${suffix}.zip`

    const archive = archiver("zip", { zlib: { level: 5 } })

    const stream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk) => controller.enqueue(chunk))
        archive.on("end", () => controller.close())
        archive.on("error", (err) => controller.error(err))
      },
    })

    const addPhotos = async () => {
      for (const photo of photos) {
        try {
          const latest = photo.versions[0]
          if (!latest) continue

          const url = await getSignedOriginalUrl(latest.originalKey)
          const response = await fetch(url)
          if (!response.ok) {
            console.error(`Failed to fetch photo ${photo.id}`)
            continue
          }

          const buffer = await response.arrayBuffer()
          archive.append(Buffer.from(buffer), { name: photo.filename })
        } catch (err) {
          console.error(`Error adding photo ${photo.id} to ZIP:`, err)
        }
      }
      await archive.finalize()
    }

    addPhotos()

    return new Response(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
