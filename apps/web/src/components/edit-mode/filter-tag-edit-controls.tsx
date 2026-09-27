'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEditActive } from '@/hooks/use-edit-mode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModalShell } from './edit-modal'
import { PencilIcon, TrashIcon } from './edit-button'
import { editModeRequest } from './api'

export interface FilterTagOption {
  id: number
  name: string
  color: string | null
}

function useFilterTagApi() {
  const router = useRouter()
  const token = useAuth((s) => s.token)
  return {
    async run(
      path: string,
      method: string,
      body: Record<string, unknown> | null,
    ) {
      if (!token) throw new Error('Sesión vencida. Volvé a iniciar sesión.')
      const out = await editModeRequest(path, method, body, token)
      router.refresh()
      return out
    },
  }
}

function TagForm({
  initialName = '',
  initialColor = '',
  showColor,
  busy,
  error,
  submitLabel,
  onSubmit,
}: {
  initialName?: string
  initialColor?: string
  showColor: boolean
  busy: boolean
  error: string
  submitLabel: string
  onSubmit: (values: { name: string; color: string }) => void
}) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ name, color })
      }}
      className="space-y-4 px-5 py-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="ft-name">Nombre</Label>
        <Input
          id="ft-name"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Vainilla"
        />
      </div>
      {showColor ? (
        <div className="space-y-1.5">
          <Label htmlFor="ft-color">Color (punto de la lista)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ft-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#E9C893 (vacío = sin punto)"
              maxLength={7}
            />
            {color ? (
              <span
                aria-hidden="true"
                className="h-6 w-6 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

/**
 * Botón "+ Agregar" de opciones de filtro (MODO EDICIÓN).
 * Solo visible con edición activa; fuera de ella no renderiza nada.
 */
export function FilterTagAddButton({
  kind,
}: {
  kind: 'aroma' | 'ritual'
}) {
  const active = useEditActive()
  const { run } = useFilterTagApi()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!active) return null

  async function handleSubmit(values: { name: string; color: string }) {
    if (!values.name.trim()) {
      setError('El nombre es requerido')
      return
    }
    setBusy(true)
    setError('')
    try {
      await run('/api/edit-mode/product-tags', 'POST', {
        name: values.name.trim(),
        kind,
        ...(kind === 'aroma' && values.color.trim()
          ? { color: values.color.trim() }
          : {}),
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError('')
          setOpen(true)
        }}
        className="mt-2 text-[11px] font-medium text-[#7A6A5D] transition-colors hover:text-[#C45A37]"
      >
        + Agregar
      </button>
      {open ? (
        <ModalShell
          title={kind === 'aroma' ? 'Agregar aroma' : 'Agregar ritual'}
          onClose={() => setOpen(false)}
        >
          <TagForm
            showColor={kind === 'aroma'}
            busy={busy}
            error={error}
            submitLabel="Agregar"
            onSubmit={handleSubmit}
          />
        </ModalShell>
      ) : null}
    </>
  )
}

/**
 * Controles por opción (MODO EDICIÓN): editar nombre/color y eliminar.
 * Eliminar con productos vinculados la oculta (active=false, reversible).
 */
export function FilterTagRowControls({
  tag,
  kind,
}: {
  tag: FilterTagOption
  kind: 'aroma' | 'ritual'
}) {
  const active = useEditActive()
  const { run } = useFilterTagApi()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!active) return null

  async function handleSubmit(values: { name: string; color: string }) {
    if (!values.name.trim()) {
      setError('El nombre es requerido')
      return
    }
    setBusy(true)
    setError('')
    try {
      await run(`/api/edit-mode/product-tags/${tag.id}`, 'PUT', {
        name: values.name.trim(),
        color:
          kind === 'aroma'
            ? values.color.trim() === ''
              ? null
              : values.color.trim()
            : undefined,
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `¿Eliminar "${tag.name}"? Si tiene productos vinculados, se ocultará sin borrarse.`,
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await run(`/api/edit-mode/product-tags/${tag.id}`, 'DELETE', null)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar')
    } finally {
      setBusy(false)
    }
  }

  const iconBtn =
    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[#9A8A7A] transition-colors hover:text-[#C45A37] disabled:opacity-50'

  return (
    <>
      <span className="flex shrink-0 items-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setError('')
            setOpen(true)
          }}
          className={iconBtn}
          aria-label={`Editar ${tag.name}`}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleDelete()}
          className={iconBtn}
          aria-label={`Eliminar ${tag.name}`}
        >
          <TrashIcon />
        </button>
      </span>
      {open ? (
        <ModalShell title={`Editar ${tag.name}`} onClose={() => setOpen(false)}>
          <TagForm
            initialName={tag.name}
            initialColor={tag.color ?? ''}
            showColor={kind === 'aroma'}
            busy={busy}
            error={error}
            submitLabel="Guardar cambios"
            onSubmit={handleSubmit}
          />
        </ModalShell>
      ) : null}
    </>
  )
}
