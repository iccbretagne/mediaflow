"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Church = {
  id: string
  name: string
}

type EventStatus = "DRAFT" | "PENDING_REVIEW" | "REVIEWED" | "ARCHIVED"

const statusOptions: { value: EventStatus | ""; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "PENDING_REVIEW", label: "En attente" },
  { value: "REVIEWED", label: "Validé" },
  { value: "ARCHIVED", label: "Archivé" },
]

export function DashboardFilters({ churches }: { churches: Church[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentChurchId = searchParams.get("churchId") || ""
  const currentStatus = searchParams.get("status") || ""

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`)
  }

  function clearFilters() {
    router.push("/dashboard")
  }

  const hasActiveFilters = currentChurchId || currentStatus

  return (
    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Church filter */}
        <div className="flex-1">
          <label htmlFor="church-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Église
          </label>
          <select
            id="church-filter"
            value={currentChurchId}
            onChange={(e) => updateFilters("churchId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Toutes les églises</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex-1">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            id="status-filter"
            value={currentStatus}
            onChange={(e) => updateFilters("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
