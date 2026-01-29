import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, Badge } from "@/components/ui"
import { ProjectActions } from "@/components/projects"
import { MediaUploader, MediaReviewGrid } from "@/components/media"
import { getSignedThumbnailUrl, getSignedOriginalUrl } from "@/lib/s3"

type MediaType = "PHOTO" | "VISUAL" | "VIDEO"
type MediaStatus = "PENDING" | "APPROVED" | "REJECTED" | "DRAFT" | "IN_REVIEW" | "REVISION_REQUESTED" | "FINAL_APPROVED"

type ProjectWithRelations = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  churchId: string
  church: {
    name: string
  }
  description: string | null
  createdById: string
  media: {
    id: string
    filename: string
    type: MediaType
    status: MediaStatus
    createdAt: Date
    versions: {
      originalKey: string
      thumbnailKey: string
      versionNumber: number
    }[]
  }[]
  shareTokens: {
    id: string
    type: "VALIDATOR" | "MEDIA"
    label: string | null
    expiresAt: Date | null
    usageCount: number
    createdAt: Date
  }[]
}

type MediaItem = {
  id: string
  type: MediaType
  status: MediaStatus
  filename: string
  thumbnailUrl: string
  originalUrl?: string
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    notFound()
  }

  const { id } = await params

  const project = (await prisma.project.findUnique({
    where: { id, createdById: session.user.id },
    include: {
      church: {
        select: { name: true },
      },
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
        orderBy: { createdAt: "desc" },
      },
    },
  })) as ProjectWithRelations | null

  if (!project) {
    notFound()
  }

  const stats = {
    total: project.media.length,
    visuals: project.media.filter((m) => m.type === "VISUAL").length,
    videos: project.media.filter((m) => m.type === "VIDEO").length,
    approved: project.media.filter(
      (m) => m.status === "APPROVED" || m.status === "FINAL_APPROVED"
    ).length,
    pending: project.media.filter(
      (m) => m.status === "PENDING" || m.status === "DRAFT" || m.status === "IN_REVIEW"
    ).length,
  }

  const mediaWithUrls = await Promise.all(
    project.media.map(async (media) => {
      const latestVersion = media.versions[0]
      if (!latestVersion) return null

      return {
        id: media.id,
        type: media.type,
        status: media.status,
        filename: media.filename,
        thumbnailUrl: await getSignedThumbnailUrl(latestVersion.thumbnailKey),
        ...(media.type === "VIDEO"
          ? { originalUrl: await getSignedOriginalUrl(latestVersion.originalKey) }
          : {}),
      }
    })
  )

  const mediaItems = mediaWithUrls.filter((item): item is MediaItem => item !== null)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/projects"
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
        Retour aux projets
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-icc-violet">{project.name}</h1>
            <Badge variant="info">Projet</Badge>
          </div>
          <p className="text-gray-700 font-medium">{project.church.name}</p>
          <p className="text-sm text-gray-600 mt-1">
            Créé le{" "}
            {new Date(project.createdAt).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {project.description && (
            <p className="text-gray-700 mt-3">{project.description}</p>
          )}
        </div>

        <ProjectActions projectId={project.id} projectName={project.name} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-icc-violet">{stats.total}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">Médias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-icc-bleu">{stats.visuals}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">Visuels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-icc-rouge">{stats.videos}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">Vidéos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">Approuvés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-icc-jaune-dark">{stats.pending}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">En attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Share tokens summary */}
      {project.shareTokens.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            Liens de partage
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-icc-violet/10">
              {project.shareTokens.slice(0, 3).map((token) => (
                <div
                  key={token.id}
                  className="px-6 py-4 flex justify-between items-center hover:bg-icc-violet-light/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {token.label || "Sans nom"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {token.type === "VALIDATOR" ? "Validation" : "Téléchargement"} •{" "}
                      {token.usageCount} utilisation{token.usageCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {token.expiresAt && new Date(token.expiresAt) < new Date() && (
                      <Badge variant="danger" size="sm">Expiré</Badge>
                    )}
                    <Link href={`/projects/${project.id}/share`}>
                      <span className="text-sm text-icc-violet hover:text-icc-violet-dark font-medium">
                        Gérer
                      </span>
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
          Ajouter des médias
        </CardHeader>
        <CardContent>
          <MediaUploader projectId={project.id} />
        </CardContent>
      </Card>

      {/* Media grid */}
      {mediaItems.length > 0 ? (
        <Card>
          <CardHeader>
            Médias ({mediaItems.length})
          </CardHeader>
          <CardContent>
            <MediaReviewGrid media={mediaItems} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-icc-violet-light rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-icc-violet"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun média
            </h3>
            <p className="text-gray-700">
              Ce projet ne contient pas encore de médias.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
