"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge, Button, Input, Select, Textarea } from "@/components/ui"
import type { ChurchResponse } from "@/lib/schemas"

type EventStatus = "DRAFT" | "PENDING_REVIEW" | "REVIEWED" | "ARCHIVED"

const statusConfig: Record<EventStatus, { label: string; variant: "default" | "warning" | "success" | "info" }> = {
  DRAFT: { label: "Brouillon", variant: "default" },
  PENDING_REVIEW: { label: "En attente de validation", variant: "warning" },
  REVIEWED: { label: "Validé", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "info" },
}

interface EventEditFormProps {
  event: {
    id: string
    name: string
    date: string
    churchId: string
    churchName: string
    description: string | null
    status: EventStatus
  }
}

export function EventEditForm({ event }: EventEditFormProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [churches, setChurches] = useState<ChurchResponse[]>([])
  const [loadingChurches, setLoadingChurches] = useState(false)

  useEffect(() => {
    if (editing && churches.length === 0) {
      setLoadingChurches(true)
      fetch("/api/churches")
        .then((res) => res.json())
        .then((data) => setChurches(data.data || []))
        .catch(() => {})
        .finally(() => setLoadingChurches(false))
    }
  }, [editing, churches.length])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      date: new Date(formData.get("date") as string).toISOString(),
      churchId: formData.get("churchId") as string,
      description: (formData.get("description") as string) || undefined,
      status: formData.get("status") as EventStatus,
    }

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || "Erreur lors de la modification")
      }

      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  // Format date for datetime-local input
  const dateForInput = new Date(event.date).toISOString().slice(0, 16)

  if (!editing) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-icc-violet">{event.name}</h1>
          <Badge variant={statusConfig[event.status].variant}>
            {statusConfig[event.status].label}
          </Badge>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-gray-400 hover:text-icc-violet transition-colors rounded-lg hover:bg-icc-violet-light/30"
            title="Modifier l'événement"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        <p className="text-gray-700 font-medium">{event.churchName}</p>
        <p className="text-sm text-gray-600 mt-1">
          {new Date(event.date).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {event.description && (
          <p className="text-gray-700 mt-3">{event.description}</p>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-icc-rouge/20 rounded-lg text-icc-rouge text-sm flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <Input
          id="edit-name"
          name="name"
          label="Nom de l&apos;événement"
          type="text"
          required
          maxLength={255}
          defaultValue={event.name}
        />

        <Input
          id="edit-date"
          name="date"
          label="Date"
          type="datetime-local"
          required
          defaultValue={dateForInput}
        />

        {loadingChurches ? (
          <div className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500">
            Chargement...
          </div>
        ) : (
          <Select
            id="edit-churchId"
            name="churchId"
            label="Église"
            defaultValue={event.churchId}
            required
          >
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </Select>
        )}

        <Textarea
          id="edit-description"
          name="description"
          label="Description"
          rows={3}
          maxLength={1000}
          defaultValue={event.description ?? ""}
          placeholder="Description optionnelle de l&apos;événement"
        />

        <Select
          id="edit-status"
          name="status"
          label="Statut"
          defaultValue={event.status}
          required
        >
          {Object.entries(statusConfig).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => { setEditing(false); setError(null) }}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}
