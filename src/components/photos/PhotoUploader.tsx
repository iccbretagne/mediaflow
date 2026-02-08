"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui"

// Upload photos in batches to avoid memory issues
const BATCH_SIZE = 10

interface UploadedPhoto {
  id: string
  filename: string
  thumbnailUrl: string
}

interface UploadError {
  filename: string
  error: string
}

interface PhotoUploaderProps {
  eventId: string
}

export function PhotoUploader({ eventId }: PhotoUploaderProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{
    current: number
    total: number
    filename: string
  } | null>(null)
  const [results, setResults] = useState<{
    uploaded: UploadedPhoto[]
    errors: UploadError[]
  } | null>(null)

  async function uploadBatch(
    files: File[],
    eventId: string
  ): Promise<{ uploaded: UploadedPhoto[]; errors: UploadError[] }> {
    const formData = new FormData()
    formData.append("eventId", eventId)
    for (const file of files) {
      formData.append("files", file)
    }

    const res = await fetch("/api/photos/upload", {
      method: "POST",
      body: formData,
    })

    const response = await res.json()

    if (!res.ok) {
      // Return all files as errors if request failed
      return {
        uploaded: [],
        errors: files.map((f) => ({
          filename: f.name,
          error: response.error?.message || "Erreur lors de l'upload",
        })),
      }
    }

    return {
      uploaded: response.data.uploaded,
      errors: response.data.errors,
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    setResults(null)

    const fileArray = Array.from(files)
    const allUploaded: UploadedPhoto[] = []
    const allErrors: UploadError[] = []

    // Split files into batches
    const batches: File[][] = []
    for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
      batches.push(fileArray.slice(i, i + BATCH_SIZE))
    }

    // Process each batch sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      const processedCount = batchIndex * BATCH_SIZE

      setProgress({
        current: processedCount,
        total: fileArray.length,
        filename: `Lot ${batchIndex + 1}/${batches.length} (${batch.length} photos)`,
      })

      try {
        const result = await uploadBatch(batch, eventId)
        allUploaded.push(...result.uploaded)
        allErrors.push(...result.errors)
      } catch (error) {
        // Network error or other fatal error for this batch
        allErrors.push(
          ...batch.map((f) => ({
            filename: f.name,
            error: error instanceof Error ? error.message : "Erreur réseau",
          }))
        )
      }
    }

    setResults({
      uploaded: allUploaded,
      errors: allErrors,
    })

    // Refresh page to show new photos
    if (allUploaded.length > 0) {
      router.refresh()
    }

    setUploading(false)
    setProgress(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          uploading
            ? "border-blue-300 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="photo-input"
          disabled={uploading}
        />

        {uploading ? (
          <div>
            <div className="w-12 h-12 mx-auto mb-4">
              <svg
                className="animate-spin w-full h-full text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Upload en cours...</p>
            {progress && (
              <>
                <p className="text-sm text-gray-500 mt-1">{progress.filename}</p>
                <div className="mt-2 w-48 mx-auto bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {progress.current} / {progress.total} photos
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-1">
              Glissez-déposez vos photos ici
            </p>
            <p className="text-sm text-gray-500 mb-4">ou</p>
            <label htmlFor="photo-input">
              <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
                Parcourir
              </Button>
            </label>
            <p className="text-xs text-gray-400 mt-4">
              JPEG, PNG ou WebP • Max 50 Mo par photo
            </p>
          </>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {results.uploaded.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">
                {results.uploaded.length} photo(s) uploadée(s) avec succès
              </p>
            </div>
          )}
          {results.errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium mb-2">
                {results.errors.length} erreur(s)
              </p>
              <ul className="text-sm text-red-600 space-y-1">
                {results.errors.map((err, i) => (
                  <li key={i}>
                    {err.filename}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
