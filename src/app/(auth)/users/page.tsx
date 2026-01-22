"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardContent } from "@/components/ui"
import type { UserResponse, UserRole, UserStatus } from "@/lib/schemas"

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  MEDIA: "Équipe média",
}

const statusLabels: Record<UserStatus, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  REJECTED: "Rejeté",
}

const statusColors: Record<UserStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<UserStatus | "">("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [filter])

  async function fetchUsers() {
    try {
      const url = filter
        ? `/api/users?status=${filter}`
        : "/api/users"
      const res = await fetch(url)
      const data = await res.json()
      setUsers(data.data || [])
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  async function updateUser(id: string, updates: { role?: UserRole; status?: UserStatus }) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de la mise à jour")
      }

      fetchUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">Chargement...</div>
      </div>
    )
  }

  const pendingCount = users.filter((u) => u.status === "PENDING").length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">
            Gérez les accès et les rôles des utilisateurs
          </p>
          {pendingCount > 0 && (
            <p className="text-yellow-600 mt-2 font-medium">
              {pendingCount} utilisateur(s) en attente d'approbation
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter("")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === ""
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "PENDING"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "ACTIVE"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Actifs
        </button>
        <button
          onClick={() => setFilter("REJECTED")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "REJECTED"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Rejetés
        </button>
      </div>

      {/* Users list */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              Aucun utilisateur trouvé
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name || user.email}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name || user.email}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[user.status]
                          }`}
                        >
                          {statusLabels[user.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {roleLabels[user.role]} • {user._count?.events || 0} événement(s)
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Inscrit le{" "}
                        {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:items-end">
                    {/* Status actions */}
                    {user.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updateUser(user.id, { status: "ACTIVE" })}
                        >
                          Approuver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateUser(user.id, { status: "REJECTED" })}
                          className="text-red-600 hover:text-red-700"
                        >
                          Rejeter
                        </Button>
                      </div>
                    )}
                    {user.status === "REJECTED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateUser(user.id, { status: "ACTIVE" })}
                      >
                        Approuver
                      </Button>
                    )}
                    {user.status === "ACTIVE" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateUser(user.id, { status: "REJECTED" })}
                        className="text-red-600 hover:text-red-700"
                      >
                        Révoquer
                      </Button>
                    )}

                    {/* Role toggle */}
                    {user.status === "ACTIVE" && (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateUser(user.id, { role: e.target.value as UserRole })
                        }
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ADMIN">Administrateur</option>
                        <option value="MEDIA">Équipe média</option>
                      </select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
