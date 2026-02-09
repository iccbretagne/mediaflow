import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  validateBody,
  validateParams,
  successResponse,
  errorResponse,
} from "@/lib/api-utils"
import { Cuid2IdParamSchema } from "@/lib/schemas"
import type { MediaStatus } from "@/lib/schemas"

type RouteParams = { params: Promise<{ id: string }> }

const ResetBodySchema = z.object({
  scope: z.enum(["all", "prevalidation"]),
})

// POST /api/events/[id]/reset - Reset media statuses
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = validateParams(await params, Cuid2IdParamSchema)
    const { scope } = await validateBody(request, ResetBodySchema)

    const statusesToReset: MediaStatus[] =
      scope === "all"
        ? ["APPROVED", "REJECTED", "PREVALIDATED", "PREREJECTED"]
        : ["PREVALIDATED", "PREREJECTED"]

    const result = await prisma.media.updateMany({
      where: {
        eventId: id,
        type: "PHOTO",
        status: { in: statusesToReset },
      },
      data: { status: "PENDING" },
    })

    if (scope === "all") {
      await prisma.event.update({
        where: { id },
        data: { status: "DRAFT" },
      })
    }

    return successResponse({ updated: result.count })
  } catch (error) {
    return errorResponse(error)
  }
}
