"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button, ConfirmModal } from "@/components/ui"

interface ProjectActionsProps {
  projectId: string
  projectName: string
}

export function ProjectActions({ projectId, projectName }: ProjectActionsProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.error?.message || "Erreur lors de la suppression")
      }

      // Redirect to projects list
      router.push("/projects")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur inconnue")
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <Link href={`/projects/${projectId}/share`}>
          <Button variant="secondary">
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Partager
          </Button>
        </Link>
        <Button
          variant="danger"
          onClick={() => setShowDeleteModal(true)}
        >
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Supprimer
        </Button>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer le projet"
        message={`Cette action est irréversible. Tous les médias associés seront également supprimés.`}
        confirmText="Supprimer"
        confirmValue={projectName}
        confirmPlaceholder="Nom du projet"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
