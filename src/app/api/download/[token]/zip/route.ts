import { NextRequest } from "next/server"
import { validateParams, errorResponse, ApiError } from "@/lib/api-utils"
import { validateShareToken } from "@/lib/tokens"
import { getSignedOriginalUrl } from "@/lib/s3"
import { TokenParamSchema } from "@/lib/schemas"
import archiver from "archiver"

type RouteParams = { params: Promise<{ token: string }> }

// GET /api/download/[token]/zip - Download all approved photos as ZIP
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = validateParams(await params, TokenParamSchema)

    const shareToken = await validateShareToken(token)
    const event = shareToken.event

    // Filter only approved photos
    const approvedPhotos = event.photos.filter((p) => p.status === "APPROVED")

    if (approvedPhotos.length === 0) {
      throw new ApiError(404, "No approved photos to download", "NO_PHOTOS")
    }

    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 5 }, // Balanced compression
    })

    // Generate safe filename for ZIP
    const safeName = event.name
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, "")
      .replace(/\s+/g, "_")
      .slice(0, 50)
    const zipFilename = `${safeName}_photos.zip`

    // Create a readable stream from the archive
    const stream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk) => {
          controller.enqueue(chunk)
        })

        archive.on("end", () => {
          controller.close()
        })

        archive.on("error", (err) => {
          controller.error(err)
        })
      },
    })

    // Add photos to archive
    const addPhotosToArchive = async () => {
      for (const photo of approvedPhotos) {
        try {
          // Get signed URL for the original photo
          const url = await getSignedOriginalUrl(photo.originalKey)

          // Fetch the photo
          const response = await fetch(url)
          if (!response.ok) {
            console.error(`Failed to fetch photo ${photo.id}`)
            continue
          }

          const buffer = await response.arrayBuffer()

          // Add to archive with original filename
          archive.append(Buffer.from(buffer), { name: photo.filename })
        } catch (err) {
          console.error(`Error adding photo ${photo.id} to ZIP:`, err)
        }
      }

      // Finalize the archive
      await archive.finalize()
    }

    // Start adding photos (don't await - it runs in parallel with streaming)
    addPhotosToArchive()

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
