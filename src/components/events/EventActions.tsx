"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button, ConfirmModal } from "@/components/ui"

interface EventActionsProps {
  eventId: string
  eventName: string
  hasPrevalidation: boolean
  nonPendingCount: number
  prevalidationCount: number
}

export function EventActions({
  eventId,
  eventName,
  hasPrevalidation,
  nonPendingCount,
  prevalidationCount,
}: EventActionsProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showResetMenu, setShowResetMenu] = useState(false)
  const [resetScope, setResetScope] = useState<"all" | "prevalidation" | null>(null)
  const [resetting, setResetting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowResetMenu(false)
      }
    }
    if (showResetMenu) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [showResetMenu])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.error?.message || "Erreur lors de la suppression")
      }

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur inconnue")
      setDeleting(false)
    }
  }

  async function handleReset() {
    if (!resetScope) return
    setResetting(true)
    try {
      const res = await fetch(`/api/events/${eventId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: resetScope }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || "Erreur lors de la réinitialisation")
      }

      setResetScope(null)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur inconnue")
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <Link href={`/events/${eventId}/share`}>
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

        {/* Reset button with dropdown */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="secondary"
            onClick={() => setShowResetMenu(!showResetMenu)}
            disabled={nonPendingCount === 0}
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Réinitialiser
          </Button>

          {showResetMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={nonPendingCount === 0}
                onClick={() => {
                  setShowResetMenu(false)
                  setResetScope("all")
                }}
              >
                <p className="font-medium text-gray-900 text-sm">Tout réinitialiser</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Remettre toutes les photos en attente
                </p>
              </button>
              {hasPrevalidation && (
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={prevalidationCount === 0}
                  onClick={() => {
                    setShowResetMenu(false)
                    setResetScope("prevalidation")
                  }}
                >
                  <p className="font-medium text-gray-900 text-sm">
                    Réinitialiser la prévalidation
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Remettre les photos prévalidées/écartées en attente
                  </p>
                </button>
              )}
            </div>
          )}
        </div>

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

      {/* Reset confirmation modals */}
      <ConfirmModal
        isOpen={resetScope === "all"}
        onClose={() => setResetScope(null)}
        onConfirm={handleReset}
        title="Tout réinitialiser"
        message="Toutes les photos seront remises en attente et l'événement repassera en brouillon."
        confirmText="Réinitialiser"
        variant="warning"
        loading={resetting}
      />

      <ConfirmModal
        isOpen={resetScope === "prevalidation"}
        onClose={() => setResetScope(null)}
        onConfirm={handleReset}
        title="Réinitialiser la prévalidation"
        message="Les photos prévalidées et écartées seront remises en attente."
        confirmText="Réinitialiser"
        variant="warning"
        loading={resetting}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'événement"
        message={`Cette action est irréversible. Toutes les photos associées seront également supprimées.`}
        confirmText="Supprimer"
        confirmValue={eventName}
        confirmPlaceholder="Nom de l'événement"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
