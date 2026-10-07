'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEditActive } from '@/hooks/use-edit-mode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModalShell } from './edit-modal'
import { PencilIcon, TrashIcon } from './edit-button'
import { editModeRequest } from './api'
import type { Tipo } from '@/components/catalog/catalog-tipos'
import { ImagePicker } from './tipo-image-picker'
import { CategoryTypesEditor } from './category-types-editor'

const OPEN_EDITOR_EVENT = 'open-category-types-editor'

interface OpenEditorDetail {
  categoryId: number
  tipoId?: number
}

/**
 * Abre el editor central. El modal vive en `CategoryTypesEditorHost` (fuera de
 * las tarjetas): al cambiar la visibilidad de un tipo su tarjeta se mueve
 * entre la lista y los ocultos, y el modal no debe cerrarse con ella.
 */
function openCategoryTypesEditor(detail: OpenEditorDetail) {
  window.dispatchEvent(new CustomEvent<OpenEditorDetail>(OPEN_EDITOR_EVENT, { detail }))
}

/** Monta el editor central cuando una tarjeta lo pide (solo MODO EDICIÓN). */
export function CategoryTypesEditorHost() {
  const active = useEditActive()
  const [open, setOpen] = useState<OpenEditorDetail | null>(null)
  useEffect(() => {
    const onOpen = (e: Event) => setOpen((e as CustomEvent<OpenEditorDetail>).detail)
    window.addEventListener(OPEN_EDITOR_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EDITOR_EVENT, onOpen)
  }, [])
  if (!active || !open) return null
  return (
    <CategoryTypesEditor
      initialCategoryId={open.categoryId}
      initialTipoId={open.tipoId}
      onClose={() => setOpen(null)}
    />
  )
}

function useEditToken() {
  const router = useRouter()
  const token = useAuth((s) => s.token)
  return {
    async run(path: string, method: string, body: Record<string, unknown> | null) {
      if (!token) throw new Error('Sesión vencida. Volvé a iniciar sesión.')
      const out = await editModeRequest(path, method, body, token)
      router.refresh()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tipos-changed'))
      }
      return out
    },
  }
}

function TipoForm({
  initial,
  submitLabel,
  onSubmit,
  saving,
  serverError,
}: {
  initial: { title: string; description: string; image: { id: number | null; url: string | null }; sortOrder: string; active: boolean }
  submitLabel: string
  onSubmit: (values: {
    title: string
    description: string
    imageId: number | null
    imageTouched: boolean
    sortOrder: string
    active: boolean
  }) => Promise<void>
  saving: boolean
  serverError: string
}) {
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [image, setImage] = useState(initial.image)
  const [imageTouched, setImageTouched] = useState(false)
  const [sortOrder, setSortOrder] = useState(initial.sortOrder)
  const [active, setActive] = useState(initial.active)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('El nombre es requerido')
      return
    }
    setError('')
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      imageId: image.id,
      imageTouched,
      sortOrder,
      active,
    })
  }

  const inputCls =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e)
      }}
      className="overflow-y-auto px-5 py-4"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tipo-title">Nombre</Label>
          <Input
            id="tipo-title"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tipo-desc">Descripción</Label>
          <textarea
            id="tipo-desc"
            value={description}
            rows={3}
            maxLength={600}
            onChange={(e) => setDescription(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <ImagePicker
          value={image}
          onChange={(next) => {
            setImage(next)
            setImageTouched(true)
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tipo-order">Orden de aparición</Label>
            <input
              id="tipo-order"
              type="number"
              min="0"
              step="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-[#7A6A5D]">
              Define el orden en que se muestra este tipo en la tienda.
            </p>
          </div>
          <div className="space-y-1.5">
            <span id="tipo-visible-label" className="text-sm font-medium">
              Visible en catálogo
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              aria-labelledby="tipo-visible-label"
              onClick={() => setActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active ? 'bg-[#B85C33]' : 'bg-[#D8CFC2]'}`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <p className="text-xs text-[#7A6A5D]">
              Si desactivas esta opción, este tipo no se mostrará en la
              tienda, pero no se eliminará.
            </p>
          </div>
        </div>
      </div>
      {error || serverError ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error || serverError}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

/** Tarjeta "+" para agregar un tipo (solo MODO EDICIÓN). */
export function TipoAddButton({ categoryId }: { categoryId: number }) {
  const active = useEditActive()
  const { run } = useEditToken()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  if (!active) return null
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setServerError('')
          setOpen(true)
        }}
        aria-label="Agregar tipo"
        className="flex w-[210px] shrink-0 items-center justify-center gap-2 self-stretch rounded-lg border border-dashed border-[#C9A24B] bg-[#FFFDF9] p-2.5 text-[#8A5A33] shadow-sm transition-colors hover:bg-white sm:w-[230px]"
      >
        <span aria-hidden="true" className="text-xl font-light leading-none">
          +
        </span>
        <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider">
          Agregar tipo
        </span>
      </button>
      {open ? (
        <ModalShell title="Agregar tipo" onClose={() => setOpen(false)}>
          <TipoForm
            initial={{
              title: '',
              description: '',
              image: { id: null, url: null },
              sortOrder: '0',
              active: true,
            }}
            submitLabel="Crear tipo"
            saving={saving}
            serverError={serverError}
            onSubmit={async (v) => {
              setSaving(true)
              setServerError('')
              try {
                await run('/api/edit-mode/categories', 'POST', {
                  title: v.title,
                  description: v.description,
                  parent: categoryId,
                  ...(v.imageTouched && v.imageId !== null
                    ? { image: v.imageId }
                    : {}),
                })
                setOpen(false)
              } catch (err) {
                setServerError(
                  err instanceof Error ? err.message : 'No se pudo guardar',
                )
              } finally {
                setSaving(false)
              }
            }}
          />
        </ModalShell>
      ) : null}
    </>
  )
}

interface TipoItemControlsProps {
  tipo: Tipo
  tipos: Tipo[]
  index: number
  /** Categoría principal del tipo: abre el editor central en su solapa. */
  parentId?: number
}

/** Controles por tarjeta de tipo real: editar, mover, eliminar. */
export function TipoItemControls({ tipo, tipos, index, parentId }: Readonly<TipoItemControlsProps>) {
  const active = useEditActive()
  const { run } = useEditToken()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  if (!active) return null
  if (!tipo.real || tipo.categoryId === undefined) return null

  const prev = tipos[index - 1]
  const next = tipos[index + 1]

  async function move(direction: -1 | 1) {
    const other = direction === -1 ? prev : next
    if (!other || other.categoryId === undefined) return
    setBusy(true)
    try {
      const myOrder = tipo.sortOrder ?? index
      const otherOrder = other.sortOrder ?? (direction === -1 ? index - 1 : index + 1)
      await run(`/api/edit-mode/categories/${tipo.categoryId}`, 'PUT', {
        sortOrder: otherOrder,
      })
      await run(`/api/edit-mode/categories/${other.categoryId}`, 'PUT', {
        sortOrder: myOrder,
      })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (
      !window.confirm(
        `¿Eliminar el tipo "${tipo.name}"? Si tiene productos, se ocultará en lugar de borrarse.`,
      )
    ) {
      return
    }
    setBusy(true)
    setNotice('')
    try {
      const out = await run(
        `/api/edit-mode/categories/${tipo.categoryId}`,
        'DELETE',
        null,
      )
      if (out.deactivated) {
        setNotice('El tipo tenía productos: se ocultó en lugar de borrarse.')
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'No se pudo eliminar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <span className="absolute right-1.5 top-1.5 z-10 flex gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setServerError('')
            setNotice('')
            if (parentId !== undefined) {
              openCategoryTypesEditor({ categoryId: parentId, tipoId: tipo.categoryId })
            } else {
              setEditing(true)
            }
          }}
          className="inline-flex items-center gap-1 rounded-full border border-[#E5C9A8] bg-[#F9EFE2]/95 px-2 py-0.5 text-[10px] font-medium text-[#8A5A33] shadow-sm hover:bg-[#F3E2CC]"
          aria-label={`Editar tipo ${tipo.name}`}
        >
          <PencilIcon />
        </button>
        {prev && prev.categoryId !== undefined ? (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void move(-1)
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E5C9A8] bg-[#F9EFE2]/95 text-[10px] font-bold text-[#8A5A33] shadow-sm disabled:opacity-50"
            aria-label={`Mover ${tipo.name} a la izquierda`}
          >
            ‹
          </button>
        ) : null}
        {next && next.categoryId !== undefined ? (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void move(1)
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E5C9A8] bg-[#F9EFE2]/95 text-[10px] font-bold text-[#8A5A33] shadow-sm disabled:opacity-50"
            aria-label={`Mover ${tipo.name} a la derecha`}
          >
            ›
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void remove()
          }}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E5C9A8] bg-[#F9EFE2]/95 text-[#8A3A33] shadow-sm disabled:opacity-50"
          aria-label={`Eliminar tipo ${tipo.name}`}
        >
          <TrashIcon className="h-3 w-3" />
        </button>
      </span>
      {notice ? (
        <span
          role="status"
          className="absolute inset-x-1.5 bottom-1.5 z-10 rounded-md bg-[#38271D]/90 px-2 py-1 text-[10px] text-white"
        >
          {notice}
        </span>
      ) : null}
      {editing && parentId === undefined ? (
        <ModalShell
          title={`Editar tipo: ${tipo.name}`}
          onClose={() => setEditing(false)}
        >
          <TipoForm
            initial={{
              title: tipo.name,
              description: tipo.description,
              image: { id: null, url: tipo.image },
              sortOrder: String(tipo.sortOrder ?? index),
              active: true,
            }}
            submitLabel="Guardar cambios"
            saving={saving}
            serverError={serverError}
            onSubmit={async (v) => {
              setSaving(true)
              setServerError('')
              try {
                await run(`/api/edit-mode/categories/${tipo.categoryId}`, 'PUT', {
                  title: v.title,
                  description: v.description,
                  sortOrder: v.sortOrder === '' ? 0 : Number(v.sortOrder),
                  ...(v.imageTouched
                    ? { image: v.imageId }
                    : {}),
                })
                setEditing(false)
              } catch (err) {
                setServerError(
                  err instanceof Error ? err.message : 'No se pudo guardar',
                )
              } finally {
                setSaving(false)
              }
            }}
          />
        </ModalShell>
      ) : null}
    </>
  )
}

interface HiddenTipo {
  id: number
  title: string
  slug: string
  description: string
  active: boolean
  image: { id: number; url: string | null } | null
  sortOrder: number
}

/**
 * Tira de tipos ocultos (MODO EDICIÓN). Muestra los tipos con
 * `active=false` atenuados para que Guale pueda reactivarlos: al volver a
 * activarlos reaparecen con todo su contenido (productos intactos).
 * Solo existe en edición; los clientes nunca la ven ni la reciben.
 */
export function HiddenTiposStrip({ parentId }: Readonly<{ parentId: number }>) {
  const active = useEditActive()
  const token = useAuth((s) => s.token)
  const [items, setItems] = useState<HiddenTipo[]>([])

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(
        `/api/edit-mode/categories?parent=${parentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        },
      )
      if (!res.ok) return
      const data = (await res.json()) as { docs?: HiddenTipo[] }
      setItems((data.docs ?? []).filter((d) => d && d.active === false))
    } catch {
      /* sin conexión: la tira queda vacía sin romper nada */
    }
  }, [token, parentId])

  useEffect(() => {
    if (active) void load()
  }, [active, load])

  useEffect(() => {
    const onChange = () => {
      void load()
    }
    window.addEventListener('tipos-changed', onChange)
    return () => window.removeEventListener('tipos-changed', onChange)
  }, [load])

  if (!active || items.length === 0) return null

  const tipos: Tipo[] = items.map((d) => ({
    slug: d.slug,
    name: d.title,
    tagline: d.description,
    description: d.description,
    image: d.image?.url ?? null,
    count: 0,
    real: true,
    categoryId: d.id,
    sortOrder: d.sortOrder,
  }))

  return (
    <div className="mt-3">
      <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A6A5D]">
        Tipos ocultos
        <span className="rounded-full bg-[#EFE7DD] px-2 py-0.5 text-[10px] font-bold text-[#7A6A5D]">
          {items.length}
        </span>
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 lg:gap-4">
        {tipos.map((tipo, index) => (
          <div
            key={tipo.slug}
            className="relative w-[210px] shrink-0 opacity-70 grayscale-[0.4] sm:w-[230px]"
          >
            <span className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#C9A24B] bg-[#FCF8F1] p-2.5 text-left">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#F4EDE4]">
                {tipo.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tipo.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-[15px] font-medium text-[#38271D]">
                  {tipo.name}
                </span>
                <span className="block truncate text-[11px] font-semibold uppercase tracking-wider text-[#8A5A33]">
                  Oculto
                </span>
              </span>
            </span>
            <TipoItemControls tipo={tipo} tipos={tipos} index={index} parentId={parentId} />
          </div>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#7A6A5D]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-[#7A9159]" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        El tipo se oculta de la tienda, pero sus productos se mantienen
        guardados. Cuando vuelvas a activarlo, aparecerá con todo su contenido.
      </p>
    </div>
  )
}
