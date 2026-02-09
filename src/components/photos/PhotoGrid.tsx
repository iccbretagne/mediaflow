"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ConfirmModal } from "@/components/ui"

type PhotoStatus = "PENDING" | "APPROVED" | "REJECTED" | "PREVALIDATED" | "PREREJECTED"

interface Photo {
  id: string
  filename: string
  thumbnailUrl: string
  status: PhotoStatus
}

interface PhotoGridProps {
  photos: Photo[]
  canDelete?: boolean
}

const statusIcons: Record<PhotoStatus, React.ReactNode> = {
  PENDING: (
    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  APPROVED: (
    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
  REJECTED: (
    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  ),
  PREVALIDATED: (
    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
  PREREJECTED: (
    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  ),
}

const statusLabels: Record<PhotoStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Validée",
  REJECTED: "Rejetée",
  PREVALIDATED: "Prévalidée",
  PREREJECTED: "Écartée",
}

export function PhotoGrid({ photos, canDelete = false }: PhotoGridProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/media/${deleteTarget.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || "Erreur lors de la suppression")
      }

      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbnailUrl}
              alt={photo.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Status badge */}
            <div className="absolute top-2 right-2">
              {statusIcons[photo.status]}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              {/* Delete button */}
              {canDelete && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setDeleteTarget(photo)}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="text-white">
                <p className="text-sm font-medium truncate">{photo.filename}</p>
                <p className="text-xs opacity-75">{statusLabels[photo.status]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la photo"
        message={`Voulez-vous vraiment supprimer "${deleteTarget?.filename}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
