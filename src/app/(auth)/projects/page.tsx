import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, Button, Badge } from "@/components/ui"

type MediaType = "PHOTO" | "VISUAL" | "VIDEO"
type MediaStatus = "PENDING" | "APPROVED" | "REJECTED" | "DRAFT" | "IN_REVIEW" | "REVISION_REQUESTED" | "FINAL_APPROVED"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ churchId?: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  const params = await searchParams
  const { churchId } = params

  type ProjectWithMedia = {
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
    media: { type: MediaType; status: MediaStatus }[]
    _count: { media: number }
  }

  const projects = (await prisma.project.findMany({
    where: {
      createdById: session.user.id,
      ...(churchId && { churchId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      church: {
        select: { name: true },
      },
      _count: {
        select: { media: true },
      },
      media: {
        select: { type: true, status: true },
      },
    },
  })) as ProjectWithMedia[]

  const projectsWithStats = projects.map((project) => ({
    ...project,
    visualCount: project.media.filter((m) => m.type === "VISUAL").length,
    videoCount: project.media.filter((m) => m.type === "VIDEO").length,
    pendingCount: project.media.filter(
      (m) => m.status === "PENDING" || m.status === "DRAFT" || m.status === "IN_REVIEW"
    ).length,
    approvedCount: project.media.filter(
      (m) => m.status === "APPROVED" || m.status === "FINAL_APPROVED"
    ).length,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-icc-violet">Mes projets</h1>
          <p className="text-gray-700 mt-1">
            Gérez vos projets de visuels et vidéos
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nouveau projet
          </Button>
        </Link>
      </div>

      {/* Projects list */}
      {projectsWithStats.length === 0 ? (
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun projet
            </h3>
            <p className="text-gray-700 mb-6">
              Créez votre premier projet pour commencer à uploader des visuels et vidéos.
            </p>
            <Link href="/projects/new">
              <Button>Créer un projet</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectsWithStats.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-icc-violet/60 hover:shadow-lg transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  {/* Media count */}
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="info" size="sm">
                      Projet
                    </Badge>
                    <span className="text-sm font-medium text-gray-600">
                      {project._count.media} média{project._count.media > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Project info */}
                  <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                    {project.name}
                  </h3>
                  <p className="text-sm text-icc-violet font-medium mb-3">{project.church.name}</p>
                  <p className="text-sm text-gray-600">
                    Créé le{" "}
                    {new Date(project.createdAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  {/* Stats */}
                  {project._count.media > 0 && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-icc-violet/10">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-icc-bleu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">
                          {project.visualCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-icc-rouge" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">
                          {project.videoCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-xs font-medium text-gray-700">
                          {project.approvedCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-icc-jaune-dark" />
                        <span className="text-xs font-medium text-gray-700">
                          {project.pendingCount}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
