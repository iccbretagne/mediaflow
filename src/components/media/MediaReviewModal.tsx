"use client"

import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { CommentThread } from "./CommentThread"

type MediaStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DRAFT"
  | "IN_REVIEW"
  | "REVISION_REQUESTED"
  | "FINAL_APPROVED"

type MediaType = "PHOTO" | "VISUAL" | "VIDEO"

export interface MediaReviewItem {
  id: string
  type: MediaType
  status: MediaStatus
  filename: string
  thumbnailUrl: string
  originalUrl?: string
}

interface MediaReviewModalProps {
  media: MediaReviewItem
  onClose: () => void
  onStatusChange: (id: string, status: MediaStatus) => void
}

const statusLabels: Record<MediaStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Validé",
  REJECTED: "Rejeté",
  DRAFT: "Brouillon",
  IN_REVIEW: "En révision",
  REVISION_REQUESTED: "Révision demandée",
  FINAL_APPROVED: "Approuvé",
}

const statusVariants: Record<MediaStatus, "default" | "warning" | "success" | "info" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  DRAFT: "default",
  IN_REVIEW: "info",
  REVISION_REQUESTED: "warning",
  FINAL_APPROVED: "success",
}

function getActions(status: MediaStatus, type: MediaType) {
  if (type === "PHOTO") {
    return [
      { label: "Approuver", status: "APPROVED" as const },
      { label: "Rejeter", status: "REJECTED" as const },
    ]
  }

  switch (status) {
    case "DRAFT":
      return [{ label: "Soumettre en révision", status: "IN_REVIEW" as const }]
    case "IN_REVIEW":
      return [
        { label: "Approuver", status: "FINAL_APPROVED" as const },
        { label: "Rejeter", status: "REJECTED" as const },
        { label: "Demander révision", status: "REVISION_REQUESTED" as const },
      ]
    case "REVISION_REQUESTED":
      return [{ label: "Marquer en révision", status: "IN_REVIEW" as const }]
    case "REJECTED":
      return [{ label: "Relancer révision", status: "IN_REVIEW" as const }]
    default:
      return []
  }
}

export function MediaReviewModal({
  media,
  onClose,
  onStatusChange,
}: MediaReviewModalProps) {
  const [updating, setUpdating] = useState(false)
  const [revisionComment, setRevisionComment] = useState("")
  const [showRevisionInput, setShowRevisionInput] = useState(false)

  async function updateStatus(status: MediaStatus) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/media/${media.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          comment: status === "REVISION_REQUESTED" ? revisionComment.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de la mise à jour")
      }
      onStatusChange(media.id, status)
      if (status === "REVISION_REQUESTED") {
        setRevisionComment("")
        setShowRevisionInput(false)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setUpdating(false)
    }
  }

  const actions = getActions(media.status, media.type)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{media.filename}</h2>
            <div className="mt-1">
              <Badge variant={statusVariants[media.status]} size="sm">
                {statusLabels[media.status]}
              </Badge>
            </div>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="bg-black/5 rounded-lg flex items-center justify-center p-4 min-h-[360px]">
              {media.type === "VIDEO" && media.originalUrl ? (
                <video
                  src={media.originalUrl}
                  className="max-w-full max-h-[70vh] object-contain"
                  controls
                  playsInline
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.thumbnailUrl}
                    alt={media.filename}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.status}
                    onClick={() => {
                      if (action.status === "REVISION_REQUESTED") {
                        setShowRevisionInput(true)
                        return
                      }
                      updateStatus(action.status)
                    }}
                    loading={updating}
                    disabled={updating}
                  >
                    {action.label}
                  </Button>
                ))}
                {actions.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune action disponible</p>
                )}
              </div>

              {showRevisionInput && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Ajoutez un commentaire pour demander une révision :
                  </p>
                  <textarea
                    value={revisionComment}
                    onChange={(e) => setRevisionComment(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-icc-violet/30"
                    placeholder="Ex: merci de revoir la section 00:35"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => updateStatus("REVISION_REQUESTED")} loading={updating}>
                      Envoyer & demander révision
                    </Button>
                    <Button variant="secondary" onClick={() => setShowRevisionInput(false)} disabled={updating}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Commentaires
                </h3>
                <CommentThread mediaId={media.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
