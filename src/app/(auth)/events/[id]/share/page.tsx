"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, Button } from "@/components/ui"

type TokenType = "VALIDATOR" | "MEDIA" | "PREVALIDATOR" | "GALLERY"

interface ShareToken {
  id: string
  token: string
  url: string
  type: TokenType
  label: string | null
  expiresAt: string | null
  lastUsedAt: string | null
  usageCount: number
  createdAt: string
}

interface EventStats {
  total: number
  pending: number
  prevalidated: number
  prerejected: number
}

const tokenTypeLabels: Record<TokenType, string> = {
  PREVALIDATOR: "Prévalidation",
  VALIDATOR: "Validation",
  MEDIA: "Téléchargement",
  GALLERY: "Galerie",
}

const tokenTypeDescriptions: Record<TokenType, string> = {
  PREVALIDATOR: "Permet de filtrer les photos avant la validation finale",
  VALIDATOR: "Permet de valider ou rejeter les photos",
  MEDIA: "Permet de télécharger les photos validées (ZIP)",
  GALLERY: "Galerie photo individuelle (téléchargement photo par photo)",
}

export default function SharePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: eventId } = use(params)
  const [tokens, setTokens] = useState<ShareToken[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [eventStats, setEventStats] = useState<EventStats | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // Form state
  const [formType, setFormType] = useState<TokenType>("VALIDATOR")
  const [formLabel, setFormLabel] = useState("")
  const [formExpires, setFormExpires] = useState("7")
  const [formOnlyApproved, setFormOnlyApproved] = useState(false)

  // Derived state
  const hasPrevalidator = tokens.some((t) => t.type === "PREVALIDATOR")
  const prevalidationInProgress = hasPrevalidator && eventStats !== null && eventStats.pending > 0
  const prevalidationDone = hasPrevalidator && eventStats !== null && eventStats.pending === 0

  const fetchTokens = useCallback(async () => {
    setLoading(true)
    try {
      const [tokensRes, eventRes] = await Promise.all([
        fetch(`/api/events/${eventId}/share`),
        fetch(`/api/events/${eventId}`),
      ])
      const tokensData = await tokensRes.json()
      const eventData = await eventRes.json()
      if (tokensRes.ok) {
        setTokens(tokensData.data || [])
      }
      if (eventRes.ok) {
        const ev = eventData.data
        setEventStats({
          total: ev.photoCount ?? 0,
          pending: ev.pendingCount ?? 0,
          prevalidated: ev.prevalidatedCount ?? 0,
          prerejected: ev.prerejectedCount ?? 0,
        })
      }
    } catch (error) {
      console.error("Error fetching tokens:", error)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)

    try {
      const res = await fetch(`/api/events/${eventId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          label: formLabel || undefined,
          expiresInDays: formExpires ? parseInt(formExpires) : undefined,
          ...(formType === "GALLERY" && { onlyApproved: formOnlyApproved }),
        }),
      })

      if (res.ok) {
        await fetchTokens()
        setShowForm(false)
        setFormLabel("")
        setFormExpires("7")
      } else {
        const data = await res.json()
        setCreateError(data.error?.message || "Erreur lors de la création")
      }
    } catch (error) {
      console.error("Error creating token:", error)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(tokenId: string) {
    if (!confirm("Supprimer ce lien de partage ?")) return

    try {
      const res = await fetch(`/api/events/${eventId}/share?tokenId=${tokenId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setTokens(tokens.filter((t) => t.id !== tokenId))
      }
    } catch (error) {
      console.error("Error deleting token:", error)
    }
  }

  async function copyToClipboard(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href={`/events/${eventId}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
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
        Retour à l&apos;événement
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liens de partage</h1>
          <p className="text-gray-600 mt-1">
            Créez des liens pour partager cet événement
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
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
            Nouveau lien
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Créer un lien</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Type selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de lien
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(["PREVALIDATOR", "VALIDATOR", "MEDIA", "GALLERY"] as TokenType[]).map((type) => {
                    const isDisabled =
                      (type === "PREVALIDATOR" && hasPrevalidator) ||
                      ((type === "VALIDATOR" || type === "MEDIA") && prevalidationInProgress)

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => !isDisabled && setFormType(type)}
                        disabled={isDisabled}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          isDisabled
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : formType === type
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium text-gray-900">
                          {tokenTypeLabels[type]}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {tokenTypeDescriptions[type]}
                        </p>
                        {type === "PREVALIDATOR" && hasPrevalidator && (
                          <p className="text-xs text-amber-600 mt-2">
                            Déjà créé pour cet événement
                          </p>
                        )}
                        {(type === "VALIDATOR" || type === "MEDIA") && prevalidationInProgress && (
                          <p className="text-xs text-amber-600 mt-2">
                            Prévalidation en cours ({eventStats?.pending} restante(s))
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Gallery config */}
              {formType === "GALLERY" && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formOnlyApproved}
                    onClick={() => setFormOnlyApproved((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-icc-violet focus:ring-offset-2 ${
                      formOnlyApproved ? "bg-icc-violet" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                        formOnlyApproved ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Photos validées uniquement</p>
                    <p className="text-xs text-gray-500">
                      {formOnlyApproved
                        ? "Seules les photos approuvées seront visibles"
                        : "Toutes les photos sont visibles (même non validées)"}
                    </p>
                  </div>
                </div>
              )}

              {/* Create error */}
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {createError}
                </div>
              )}

              {/* Label */}
              <div>
                <label
                  htmlFor="label"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nom (optionnel)
                </label>
                <input
                  type="text"
                  id="label"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Ex: Pasteur Martin"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-icc-violet focus:border-icc-violet"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pour identifier qui utilise ce lien
                </p>
              </div>

              {/* Expiration */}
              <div>
                <label
                  htmlFor="expires"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expiration
                </label>
                <select
                  id="expires"
                  value={formExpires}
                  onChange={(e) => setFormExpires(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-icc-violet focus:border-icc-violet"
                >
                  <option value="1">1 jour</option>
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="90">90 jours</option>
                  <option value="">Jamais</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="submit" loading={creating}>
                  Créer le lien
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Prevalidation status banner */}
      {hasPrevalidator && eventStats && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  prevalidationDone ? "bg-green-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              <div>
                <p className="font-medium text-gray-900">
                  {prevalidationDone
                    ? "Prévalidation terminée"
                    : "Prévalidation en cours"}
                </p>
                <p className="text-sm text-gray-600">
                  {eventStats.prevalidated} gardée(s), {eventStats.prerejected} écartée(s)
                  {!prevalidationDone && ` — ${eventStats.pending} restante(s) sur ${eventStats.total}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tokens list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tokens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun lien de partage
            </h3>
            <p className="text-gray-600 mb-6">
              Créez un lien pour partager cet événement avec des validateurs ou
              l&apos;équipe média.
            </p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>Créer un lien</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <Card
              key={token.id}
              className={isExpired(token.expiresAt) ? "opacity-60" : ""}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          token.type === "PREVALIDATOR"
                            ? "bg-amber-100 text-amber-700"
                            : token.type === "VALIDATOR"
                            ? "bg-purple-100 text-purple-700"
                            : token.type === "GALLERY"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tokenTypeLabels[token.type]}
                      </span>
                      {isExpired(token.expiresAt) && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          Expiré
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">
                      {token.label || "Sans nom"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {token.usageCount} utilisation(s)
                      {token.lastUsedAt &&
                        ` • Dernière: ${new Date(token.lastUsedAt).toLocaleDateString("fr-FR")}`}
                    </p>
                    {token.expiresAt && !isExpired(token.expiresAt) && (
                      <p className="text-xs text-gray-400 mt-1">
                        Expire le{" "}
                        {new Date(token.expiresAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(token.url, token.id)}
                    >
                      {copiedId === token.id ? (
                        <>
                          <svg
                            className="w-4 h-4 mr-1 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Copié
                        </>
                      ) : (
                        <>
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
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                          Copier
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(token.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <svg
                        className="w-4 h-4"
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
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
