'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

export function ImagePicker({
  value,
  onChange,
}: {
  value: { id: number | null; url: string | null }
  onChange: (next: { id: number | null; url: string | null }) => void
}) {
  const token = useAuth((s) => s.token)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleSelect(file: File) {
    if (!token) {
      setError('Sesión vencida. Volvé a iniciar sesión.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes')
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      setError('La imagen supera los 6MB')
      return
    }
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('alt', file.name)
      const res = await fetch('/api/edit-mode/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = (await res.json().catch(() => null)) as {
        id?: number
        url?: string | null
        error?: string
      } | null
      if (!res.ok || !data || typeof data.id !== 'number') {
        throw new Error(data?.error ?? 'No se pudo subir la imagen')
      }
      onChange({ id: data.id, url: data.url ?? null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Imagen</span>
      <div className="flex items-center gap-3">
        {value.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.url}
            alt=""
            className="h-14 w-14 rounded-md border border-[#E5DDD1] object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-[#E5DDD1] text-[10px] text-[#7A6A5D]">
            Sin imagen
          </span>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#8A5A33]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void handleSelect(f)
            }}
          />
          <span className="rounded-full border border-[#E5C9A8] bg-[#F9EFE2] px-3 py-1.5 text-xs">
            {uploading ? 'Subiendo…' : value.url ? 'Cambiar' : 'Subir'}
          </span>
        </label>
        {value.url ? (
          <button
            type="button"
            onClick={() => onChange({ id: null, url: null })}
            className="text-xs text-[#7A6A5D] underline underline-offset-2"
          >
            Quitar
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
