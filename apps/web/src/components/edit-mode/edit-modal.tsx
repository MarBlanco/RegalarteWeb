'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface EditField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox'
  options?: Array<{ value: string; label: string }>
  maxLength?: number
  placeholder?: string
  hint?: string
}

interface EditModalProps {
  title: string
  fields: EditField[]
  initialValues: Record<string, string>
  onClose: () => void
  onSave: (values: Record<string, string>) => Promise<void>
}

/**
 * Shell visual del modal (overlay + panel responsive). Reutilizable por
 * editores dedicados del Modo Edición.
 */
export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5DDD1] px-5 py-4">
          <h2 className="font-serif text-lg font-normal text-[#38271D]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#7A6A5D] hover:bg-[#F5EFE7]"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
 
/**
 * Modal genérico del Modo Edición (responsive: panel completo en mobile).
 * Solo se monta cuando Guale abre un "Editar"; los clientes nunca lo ven.
 */
export function EditModal({
  title,
  fields,
  initialValues,
  onClose,
  onSave,
}: EditModalProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave(values)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={title} onClose={onClose}>
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={`edit-${field.name}`}>{field.label}</Label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`edit-${field.name}`}
                    value={values[field.name] ?? ''}
                    maxLength={field.maxLength}
                    placeholder={field.placeholder}
                    rows={3}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.value }))
                    }
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={`edit-${field.name}`}
                    value={values[field.name] ?? ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.value }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'number' ? (
                  <Input
                    id={`edit-${field.name}`}
                    type="number"
                    min="0"
                    step="1"
                    value={values[field.name] ?? ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.value }))
                    }
                  />
                ) : field.type === 'checkbox' ? (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#38271D]">
                    <input
                      type="checkbox"
                      checked={values[field.name] === 'true'}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [field.name]: e.target.checked ? 'true' : 'false',
                        }))
                      }
                      className="h-4 w-4 accent-[#B85C33]"
                    />
                    {field.placeholder ?? field.label}
                  </label>
                ) : (
                  <Input
                    id={`edit-${field.name}`}
                    value={values[field.name] ?? ''}
                    maxLength={field.maxLength}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.value }))
                    }
                  />
                )}
                {field.hint ? (
                  <p className="text-xs text-[#7A6A5D]">{field.hint}</p>
                ) : null}
              </div>
            ))}
          </div>

          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
    </ModalShell>
  )
}
