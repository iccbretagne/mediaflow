import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth, isSuperAdmin } from "@/lib/auth"
import { getSignedThumbnailUrl } from "@/lib/s3"
import { Card, CardContent, CardHeader, Button, Badge } from "@/components/ui"
import { PhotoUploader } from "@/components/photos/PhotoUploader"
import { PhotoGrid } from "@/components/photos/PhotoGrid"
import { EventActions, EventEditForm } from "@/components/events"

type EventStatus = "DRAFT" | "PENDING_REVIEW" | "REVIEWED" | "ARCHIVED"
type PhotoStatus = "PENDING" | "APPROVED" | "REJECTED" | "PREVALIDATED" | "PREREJECTED"

type EventWithRelations = {
  id: string
  name: string
  date: Date
  churchId: string
  church: {
    name: string
  }
  description: string | null
  status: EventStatus
  createdById: string
  media: {
    id: string
    filename: string
    status: PhotoStatus
    versions: {
      thumbnailKey: string
      versionNumber: number
    }[]
    createdAt: Date
  }[]
  shareTokens: {
    id: string
    type: "VALIDATOR" | "MEDIA" | "PREVALIDATOR"
    label: string | null
    expiresAt: Date | null
    usageCount: number
    createdAt: Date
  }[]
}

const statusConfig: Record<EventStatus, { label: string; variant: "default" | "warning" | "success" | "info" }> = {
  DRAFT: { label: "Brouillon", variant: "default" },
  PENDING_REVIEW: { label: "En attente de validation", variant: "warning" },
  REVIEWED: { label: "Validé", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "info" },
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    notFound()
  }

  const { id } = await params
  const isAdmin = session.user.role === "ADMIN"

  const event = (await prisma.event.findUnique({
    where: {
      id,
      // Admins can view any event, others only their own
      ...(!isAdmin && { createdById: session.user.id }),
    },
    include: {
      church: {
        select: { name: true },
      },
      media: {
        where: { type: "PHOTO" },
        orderBy: { createdAt: "desc" },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      },
      shareTokens: {
        orderBy: { createdAt: "desc" },
      },
    },
  })) as EventWithRelations | null

  if (!event) {
    notFound()
  }

  // Check if user can delete photos (event creator or super admin)
  const isEventCreator = event.createdById === session.user.id
  const canDelete = isEventCreator || isSuperAdmin(session.user.email)

  // Get signed URLs for thumbnails
  const photosWithUrls = await Promise.all(
    event.media.map(async (media) => {
      const latestVersion = media.versions[0]
      return {
        id: media.id,
        filename: media.filename,
        status: media.status,
        thumbnailUrl: latestVersion ? await getSignedThumbnailUrl(latestVersion.thumbnailKey) : "",
      }
    })
  )

  const prevalidated = event.media.filter((p) => p.status === "PREVALIDATED").length
  const prerejected = event.media.filter((p) => p.status === "PREREJECTED").length
  const hasPrevalidation = event.shareTokens.some((t) => t.type === "PREVALIDATOR") || prevalidated > 0 || prerejected > 0

  const stats = {
    total: event.media.length,
    approved: event.media.filter((p) => p.status === "APPROVED").length,
    rejected: event.media.filter((p) => p.status === "REJECTED").length,
    pending: event.media.filter((p) => p.status === "PENDING").length,
    prevalidated,
    prerejected,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-icc-violet hover:text-icc-violet-dark font-medium mb-6 transition-colors"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Retour au dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
        <EventEditForm
          event={{
            id: event.id,
            name: event.name,
            date: event.date.toISOString(),
            churchId: event.churchId,
            churchName: event.church.name,
            description: event.description,
            status: event.status as EventStatus,
          }}
        />

        <EventActions
          eventId={event.id}
          eventName={event.name}
          hasPrevalidation={hasPrevalidation}
          nonPendingCount={stats.approved + stats.rejected + stats.prevalidated + stats.prerejected}
          prevalidationCount={stats.prevalidated + stats.prerejected}
        />
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 ${hasPrevalidation ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-4"} gap-4 mb-8`}>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-icc-violet">{stats.total}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">Photos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">Validées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-icc-rouge">{stats.rejected}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">Rejetées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-icc-jaune-dark">{stats.pending}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">En attente</p>
          </CardContent>
        </Card>
        {hasPrevalidation && (
          <>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-amber-600">{stats.prevalidated}</p>
                <p className="text-sm text-gray-700 font-medium mt-1">Prévalidées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-gray-500">{stats.prerejected}</p>
                <p className="text-sm text-gray-700 font-medium mt-1">Écartées</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Share tokens summary */}
      {event.shareTokens.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            Liens de partage
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-icc-violet/10">
              {event.shareTokens.slice(0, 3).map((token) => (
                <div
                  key={token.id}
                  className="px-6 py-4 flex justify-between items-center hover:bg-icc-violet-light/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {token.label || "Sans nom"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {token.type === "PREVALIDATOR" ? "Prévalidation" : token.type === "VALIDATOR" ? "Validation" : "Téléchargement"} •{" "}
                      {token.usageCount} utilisation{token.usageCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {token.expiresAt && new Date(token.expiresAt) < new Date() && (
                      <Badge variant="danger" size="sm">Expiré</Badge>
                    )}
                    <Link href={`/events/${event.id}/share`}>
                      <Button variant="ghost" size="sm">
                        Gérer
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload section */}
      <Card className="mb-8">
        <CardHeader>
          Ajouter des photos
        </CardHeader>
        <CardContent>
          <PhotoUploader eventId={event.id} />
        </CardContent>
      </Card>

      {/* Photos grid */}
      {photosWithUrls.length > 0 && (
        <Card>
          <CardHeader>
            Photos ({photosWithUrls.length})
          </CardHeader>
          <CardContent>
            <PhotoGrid photos={photosWithUrls} canDelete={canDelete} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
