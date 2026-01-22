"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardContent } from "@/components/ui"
import type { ChurchResponse } from "@/lib/schemas"

export default function ChurchesPage() {
  const [churches, setChurches] = useState<ChurchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", address: "" })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChurches()
  }, [])

  async function fetchChurches() {
    try {
      const res = await fetch("/api/churches")
      const data = await res.json()
      setChurches(data.data || [])
    } catch (err) {
      setError("Erreur lors du chargement des églises")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const url = editing ? `/api/churches/${editing}` : "/api/churches"
      const method = editing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de la sauvegarde")
      }

      setFormData({ name: "", address: "" })
      setShowForm(false)
      setEditing(null)
      fetchChurches()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette église ?")) return

    try {
      const res = await fetch(`/api/churches/${id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de la suppression")
      }

      fetchChurches()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }

  function startEdit(church: ChurchResponse) {
    setEditing(church.id)
    setFormData({ name: church.name, address: church.address || "" })
    setShowForm(true)
  }

  function cancelEdit() {
    setEditing(null)
    setFormData({ name: "", address: "" })
    setShowForm(false)
    setError(null)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Églises</h1>
          <p className="text-gray-600 mt-1">Gérez les églises de votre réseau</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "Nouvelle église"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editing ? "Modifier l'église" : "Nouvelle église"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  {editing ? "Sauvegarder" : "Créer"}
                </Button>
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste */}
      <div className="space-y-4">
        {churches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              Aucune église enregistrée
            </CardContent>
          </Card>
        ) : (
          churches.map((church) => (
            <Card key={church.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {church.name}
                    </h3>
                    {church.address && (
                      <p className="text-sm text-gray-600 mt-1">{church.address}</p>
                    )}
                    {church._count && (
                      <p className="text-sm text-gray-500 mt-2">
                        {church._count.events} événement(s)
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(church)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(church.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
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
