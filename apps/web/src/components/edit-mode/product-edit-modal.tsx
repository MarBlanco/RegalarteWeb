'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEditActive } from '@/hooks/use-edit-mode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModalShell } from './edit-modal'
import { MultiSelect } from './multi-select'
import { PencilIcon } from './edit-button'
import { notifyProductsChanged } from './api'
import { useRefreshStorefront } from './use-refresh-storefront'
import { isSimpleLexical, lexicalToPlainText } from '@/lib/product-edit'
import { safeImageSrc } from '@/lib/safe-url'

interface Option {
  id: number
  label: string
  kind?: string
}

interface Thumb {
  id: number
  url: string | null
}

function asId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (value !== null && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isInteger(id)) return id
  }
  return null
}

async function fetchDocs(
  url: string,
  labelKey: 'title' | 'name',
): Promise<Option[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('No se pudo cargar la información')
  const data = await res.json()
  const docs = Array.isArray((data as { docs?: unknown }).docs)
    ? (data as { docs: Array<Record<string, unknown>> }).docs
    : []
  return docs.flatMap((d) => {
    const id = asId(d.id)
    const label = d[labelKey]
    if (id === null || typeof label !== 'string') return []
    const kind = typeof d.kind === 'string' ? d.kind : undefined
    return [{ id, label, kind }]
  })
}

/**
 * Botón "Editar" de producto en storefront (MODO EDICIÓN).
 * Reales → editor comercial contextual. Mock (relleno provisional, no
 * existe en DB) → aviso explícito, sin pretender que se puede guardar.
 */
export function ProductEditButton({
  productId,
  slug,
  className = '',
}: {
  productId: number | string
  slug: string
  className?: string
}) {
  const active = useEditActive()
  const [open, setOpen] = useState(false)
  if (!active) return null
  const isMock = slug.startsWith('mock-')
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5C9A8] bg-[#F9EFE2]/95 px-2.5 py-1 text-[11px] font-medium text-[#8A5A33] shadow-sm transition-colors hover:bg-[#F3E2CC] ${className}`}
        aria-label="Editar producto"
      >
        <PencilIcon />
        Editar
      </button>
      {open ? (
        isMock || typeof productId !== 'number' ? (
          <ModalShell title="Producto provisional" onClose={() => setOpen(false)}>
            <div className="overflow-y-auto px-5 py-4">
              <p className="text-sm leading-relaxed text-[#5A4A3E]">
                Este producto es un relleno provisional de muestra y no
                existe en el sistema, por eso no se puede guardar. Los
                productos reales del catálogo sí son editables.
              </p>
              <div className="mt-5 flex justify-end">
                <Button type="button" onClick={() => setOpen(false)}>
                  Entendido
                </Button>
              </div>
            </div>
          </ModalShell>
        ) : (
          <ProductEditModal
            productId={productId}
            onClose={() => setOpen(false)}
          />
        )
      ) : null}
    </>
  )
}

/**
 * Botón "+ Agregar producto" (MODO EDICIÓN). Abre el editor en modo
 * creación con la categoría preseleccionada.
 */
export function ProductAddButton({
  categoryId,
  className = '',
}: {
  categoryId?: number
  className?: string
}) {
  const active = useEditActive()
  const [open, setOpen] = useState(false)
  if (!active) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#B85C33] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#9E4E2B] ${className}`}
      >
        <span aria-hidden="true" className="text-sm font-light leading-none">
          +
        </span>
        Agregar producto
      </button>
      {open ? (
        <ProductEditModal
          presetCategoryId={categoryId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

/**
 * Controles de tarjeta en catálogo (MODO EDICIÓN): Editar abre el modal;
 * Agotado/Disponible alterna la disponibilidad manual (el producto sigue
 * visible, sin compra). Mock/provisional → aviso sin persistir.
 */
export function CatalogProductControls({
  productId,
  slug,
  soldOut = false,
}: {
  productId: number | string
  slug: string
  soldOut?: boolean
}) {
  const active = useEditActive()
  const refreshStorefront = useRefreshStorefront()
  const token = useAuth((s) => s.token)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!active) return null
  const isMock =
    typeof productId !== 'number' || slug.startsWith('mock-')

  async function toggleSoldOut() {
    if (
      !window.confirm(
        soldOut
          ? '¿Marcar como Disponible? Volverá a estar comprable.'
          : '¿Marcar como Agotado? Seguirá visible pero sin compra.',
      )
    ) {
      return
    }
    if (!token) return
    setBusy(true)
    try {
      const res = await fetch(`/api/edit-mode/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ soldOut: !soldOut }),
      })
      if (!res.ok) throw new Error('No se pudo guardar')
      // Primero se avisa a las listas que dependen del dato (ej. productos
      // ocultos): la tarjeta puede desmontarse al refrescar y este modal con ella.
      notifyProductsChanged()
      await refreshStorefront()
    } finally {
      setBusy(false)
    }
  }

  const pill =
    'inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5C9A8] bg-[#F9EFE2]/95 px-2.5 py-1 text-[11px] font-medium text-[#8A5A33] shadow-sm transition-colors hover:bg-[#F3E2CC] disabled:opacity-50'
  // Toggle Agotado/Disponible: misma métrica compacta que Editar, pero
  // apagado (beige neutro, borde sutil, texto muted, baja prominencia).
  const togglePill =
    'inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5DDD1] bg-[#FCF8F1]/95 px-2.5 py-1 text-[11px] font-medium text-[#7A6A5D] shadow-sm transition-colors hover:bg-[#F3EADB] disabled:opacity-50'
  return (
    <>
      <span className="absolute bottom-2 left-2 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(true)
          }}
          className={pill}
          aria-label="Editar producto"
        >
          <PencilIcon />
          Editar
        </button>
        {!isMock ? (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void toggleSoldOut()
            }}
            className={togglePill}
            aria-label={soldOut ? 'Marcar como Disponible' : 'Marcar como Agotado'}
          >
            {soldOut ? 'Disponible' : 'Agotado'}
          </button>
        ) : null}
      </span>
      {open ? (
        isMock ? (
          <ModalShell title="Producto provisional" onClose={() => setOpen(false)}>
            <div className="overflow-y-auto px-5 py-4">
              <p className="text-sm leading-relaxed text-[#5A4A3E]">
                Este producto es un relleno provisional de muestra y no
                existe en el sistema, por eso no se puede guardar.
              </p>
              <div className="mt-5 flex justify-end">
                <Button type="button" onClick={() => setOpen(false)}>
                  Entendido
                </Button>
              </div>
            </div>
          </ModalShell>
        ) : (
          <ProductEditModal
            productId={productId as number}
            onClose={() => setOpen(false)}
          />
        )
      ) : null}
    </>
  )
}

const TAG_GROUPS: Array<{
  kind: 'aroma' | 'ritual' | 'other'
  label: string
  empty: string
}> = [
  { kind: 'aroma', label: 'Aromas', empty: 'Sin aromas disponibles.' },
  { kind: 'ritual', label: 'Rituales', empty: 'Sin rituales disponibles.' },
  { kind: 'other', label: 'Otros', empty: 'Sin opciones disponibles.' },
]

type ProductState = 'active' | 'soldout' | 'hidden'

/** Estado comercial único: Activo, Agotado (visible, sin compra) u Oculto. */
function stateFrom(active: boolean, soldOut: boolean): ProductState {
  if (!active) return 'hidden'
  return soldOut ? 'soldout' : 'active'
}

const PRODUCT_STATES: Array<{ value: ProductState; label: string; title?: string }> = [
  { value: 'active', label: 'Activo' },
  { value: 'soldout', label: 'Agotado', title: 'Visible en catálogo y PDP, sin compra' },
  { value: 'hidden', label: 'Oculto', title: 'No se muestra en la tienda' },
]

/** Entrada de precio: solo dígitos y hasta 2 decimales (acepta coma o punto). */
function cleanPriceInput(raw: string): string | null {
  return /^\d*([.,]\d{0,2})?$/.test(raw) ? raw : null
}

/** Entrada de stock: solo dígitos. */
function cleanStockInput(raw: string): string | null {
  return /^\d*$/.test(raw) ? raw : null
}

export function ProductEditModal({
  productId,
  presetCategoryId,
  onClose,
}: {
  /** Edición: id numérico existente. Creación: undefined. */
  productId?: number
  /** Creación: categoría preseleccionada (editable). */
  presetCategoryId?: number
  onClose: () => void
}) {
  const refreshStorefront = useRefreshStorefront()
  const token = useAuth((s) => s.token)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pending, setPending] = useState<{ file: File; url: string } | null>(
    null,
  )

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [state, setState] = useState<ProductState>('active')
  const [featured, setFeatured] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])
  const [descriptionText, setDescriptionText] = useState('')
  const [descriptionEditable, setDescriptionEditable] = useState(
    productId === undefined,
  )
  const [images, setImages] = useState<Thumb[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [tags, setTags] = useState<Option[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [cats, tagList] = await Promise.all([
          fetchDocs('/api/categories?limit=100&depth=0', 'title'),
          fetchDocs('/api/product-tags?limit=100&depth=0', 'name'),
        ])
        if (cancelled) return
        setCategories(cats)
        setTags(tagList)
        if (productId === undefined) {
          if (presetCategoryId !== undefined) {
            setCategoryId(String(presetCategoryId))
          }
          return
        }
        const productRes = await fetch(`/api/products/${productId}?depth=1`)
        if (!productRes.ok) throw new Error('No se pudo cargar el producto')
        const p = (await productRes.json()) as Record<string, unknown>
        if (cancelled) return
        setTitle(typeof p.title === 'string' ? p.title : '')
        setPrice(p.price !== undefined && p.price !== null ? String(p.price) : '')
        setStock(p.stock !== undefined && p.stock !== null ? String(p.stock) : '')
        setState(stateFrom(p.active !== false, p.soldOut === true))
        setFeatured(p.featured === true)
        const catId = asId(p.category)
        setCategoryId(catId !== null ? String(catId) : '')
        const tagListIds = Array.isArray(p.tags)
          ? p.tags
              .map((t) => asId(t))
              .filter((n): n is number => n !== null)
          : []
        setTagIds(tagListIds)
        const editable = isSimpleLexical(p.description)
        setDescriptionEditable(editable)
        setDescriptionText(editable ? lexicalToPlainText(p.description) : '')
        const thumbs: Thumb[] = Array.isArray(p.images)
          ? p.images.flatMap((img) => {
              const id = asId(img)
              if (id === null) return []
              const url =
                img !== null && typeof img === 'object' && 'url' in img
                  ? ((img as { url?: unknown }).url ?? null)
                  : null
              return [{ id, url: typeof url === 'string' ? url : null }]
            })
          : []
        setImages(thumbs)
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'No se pudo cargar',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [productId, presetCategoryId])

  /** Reemplaza la selección de un grupo de tags (aromas/rituales/otros). */
  function setTagGroup(groupIds: number[], next: number[]) {
    setTagIds((prev) => [...prev.filter((t) => !groupIds.includes(t)), ...next])
  }

  const clearPending = useCallback(() => {
    setPending((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  function handleSelect(file: File) {
    setSaveError('')
    if (!file.type.startsWith('image/')) {
      setSaveError('Solo se permiten imágenes')
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      setSaveError('La imagen supera los 6MB')
      return
    }
    clearPending()
    setPending({ file, url: URL.createObjectURL(file) })
  }

  useEffect(() => {
    return () => {
      clearPending()
    }
  }, [clearPending])

  async function handleUpload(file: File) {
    if (!token) {
      setSaveError('Sesión vencida. Volvé a iniciar sesión.')
      return
    }
    setUploading(true)
    setSaveError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('alt', title || file.name)
      const res = await fetch('/api/edit-mode/product-images', {
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
      setImages((prev) => [...prev, { id: data.id as number, url: data.url ?? null }])
      clearPending()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo subir')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setSaveError('Sesión vencida. Volvé a iniciar sesión.')
      return
    }
    if (!title.trim()) {
      setSaveError('El nombre es requerido')
      return
    }
    if (!categoryId) {
      setSaveError('La categoría es requerida')
      return
    }
    if (!/^\d+([.,]\d{0,2})?$/.test(price.trim())) {
      setSaveError(price.trim() === '' ? 'El precio es requerido' : 'Precio inválido')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const payload = {
        title,
        price: price.trim().replace(',', '.'),
        stock: stock === '' ? '0' : stock,
        active: state !== 'hidden',
        featured,
        soldOut: state === 'soldout',
        category: categoryId,
        tags: tagIds,
        images: images.map((i) => i.id),
        ...(descriptionEditable ? { descriptionText } : {}),
      }
      const res =
        productId === undefined
          ? await fetch('/api/edit-mode/products', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/edit-mode/products/${productId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            })
      const data = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo guardar')
      // Primero se avisa a las listas que dependen del dato (ej. productos
      // ocultos): la tarjeta puede desmontarse al refrescar y este modal con ella.
      notifyProductsChanged()
      await refreshStorefront()
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <ModalShell
      title={productId === undefined ? 'Agregar producto' : 'Editar producto'}
      onClose={onClose}
    >
      {loading ? (
        <p className="px-5 py-8 text-sm text-[#7A6A5D]">Cargando producto…</p>
      ) : loadError ? (
        <div className="px-5 py-4">
          <p role="alert" className="text-sm text-red-700">
            {loadError}
          </p>
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pe-title">Nombre / título</Label>
              <Input
                id="pe-title"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pe-price">Precio</Label>
                <Input
                  id="pe-price"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={price}
                  onChange={(e) => {
                    const next = cleanPriceInput(e.target.value)
                    if (next !== null) setPrice(next)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pe-stock">Stock</Label>
                <Input
                  id="pe-stock"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={stock}
                  onChange={(e) => {
                    const next = cleanStockInput(e.target.value)
                    if (next !== null) setStock(next)
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="pe-category">Categoría</Label>
                <select
                  id="pe-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Seleccionar…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Estado</legend>
              <div className="flex flex-wrap gap-4">
                {PRODUCT_STATES.map((opt) => (
                  <label
                    key={opt.value}
                    className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#38271D]"
                    title={opt.title}
                  >
                    <input
                      type="radio"
                      name="pe-state"
                      value={opt.value}
                      checked={state === opt.value}
                      onChange={() => setState(opt.value)}
                      className="h-4 w-4 accent-[#B85C33]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#38271D]">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-[#B85C33]"
                />
                Destacado
              </label>
            </fieldset>

            {TAG_GROUPS.map((g) => {
              const groupTags = tags.filter((t) =>
                g.kind === 'other'
                  ? t.kind !== 'aroma' && t.kind !== 'ritual'
                  : t.kind === g.kind,
              )
              if (groupTags.length === 0 && g.kind === 'other') return null
              const ids = groupTags.map((t) => t.id)
              return (
                <MultiSelect
                  key={g.kind}
                  id={`pe-tags-${g.kind}`}
                  label={g.label}
                  options={groupTags.map((t) => ({ id: t.id, label: t.label }))}
                  selected={tagIds.filter((id) => ids.includes(id))}
                  onChange={(next) => setTagGroup(ids, next)}
                  emptyText={g.empty}
                />
              )
            })}

            <div className="space-y-1.5">
              <Label htmlFor="pe-description">Descripción</Label>
              <textarea
                id="pe-description"
                value={descriptionText}
                rows={4}
                maxLength={4000}
                disabled={!descriptionEditable}
                placeholder={
                  descriptionEditable
                    ? 'Descripción del producto'
                    : 'Protegida por formato avanzado'
                }
                onChange={(e) => setDescriptionText(e.target.value)}
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {!descriptionEditable ? (
                <p className="text-xs text-[#7A6A5D]">
                  Esta descripción tiene formato avanzado y está protegida:
                  no se modificará al guardar.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium">Imágenes</span>
              {images.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {images.map((img) => (
                    <span key={img.id} className="relative block">
                      {img.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.url}
                          alt=""
                          className="h-16 w-16 rounded-md border border-[#E5DDD1] object-cover"
                        />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-md border border-[#E5DDD1] text-[10px] text-[#7A6A5D]">
                          #{img.id}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) => prev.filter((i) => i.id !== img.id))
                        }
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#38271D] text-[10px] font-bold text-white"
                        aria-label="Quitar imagen del producto"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7A6A5D]">Sin imágenes.</p>
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
                    if (f) handleSelect(f)
                  }}
                />
                <span className="rounded-full border border-[#E5C9A8] bg-[#F9EFE2] px-3 py-1.5 text-xs">
                  Seleccionar imagen
                </span>
              </label>
              {pending ? (
                <div className="flex items-center gap-3 rounded-md border border-[#E5DDD1] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={safeImageSrc(pending.url)}
                    alt="Vista previa"
                    className="h-16 w-16 rounded-md border border-[#E5DDD1] object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-xs text-[#38271D]">
                      {pending.file.name}
                    </span>
                    <span className="text-[11px] text-[#7A6A5D]">
                      {(pending.file.size / 1024).toFixed(0)} KB · vista previa
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => void handleUpload(pending.file)}
                        className="rounded-full bg-[#B85C33] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                      >
                        {uploading ? 'Subiendo…' : 'Confirmar subida'}
                      </button>
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={clearPending}
                        className="rounded-full border border-[#E5DDD1] px-3 py-1 text-[11px] font-medium text-[#7A6A5D] disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {saveError ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {saveError}
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
            <Button type="submit" disabled={saving || uploading}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  )
}
