'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEditActive } from '@/hooks/use-edit-mode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PencilIcon, TrashIcon } from './edit-button'
import { notifyProductsChanged } from './api'
import {
  isSimpleLexical,
  lexicalToPlainText,
} from '@/lib/product-edit'
import type { PdpTabId } from '@/lib/pdp-content'

/**
 * Piloto MODO EDICIÓN en PDP: solo este slug tiene drawer.
 * No replicar a otros productos hasta aprobación.
 */
export const PDP_EDIT_PILOT_SLUGS = ['vela-vainilla-ambar']

export interface PdpSnapshot {
  id: number
  slug: string
  title: string
  price: number
  active: boolean
  seoDescription: string | null
  tagsDetail: Array<{ id: number; name: string }>
  imagesDetail: Array<{ id: number; url: string | null }>
  description: unknown
  attributesDetail: Array<{ id: number; name: string; values: string[] }>
  editorial: Partial<Record<PdpTabId, string[]>>
}

interface TagOption {
  id: number
  name: string
}

function findAttr(
  attrs: PdpSnapshot['attributesDetail'],
  ...needles: string[]
): { id: number; text: string } | null {
  for (const a of attrs) {
    const name = a.name.toLowerCase()
    if (needles.some((n) => name.includes(n))) {
      return { id: a.id, text: a.values.filter(Boolean).join(', ') }
    }
  }
  return null
}

type Tab =
  | 'info'
  | 'notas'
  | 'descripcion'
  | 'caracteristicas'
  | PdpTabId

interface TabDef {
  id: Tab
  label: string
}

const ALL_TABS: TabDef[] = [
  { id: 'info', label: 'Información principal' },
  { id: 'notas', label: 'Notas aromáticas' },
  { id: 'descripcion', label: 'Descripción' },
  { id: 'caracteristicas', label: 'Características' },
  { id: 'como-usar', label: 'Cómo usar' },
  { id: 'detalles', label: 'Detalles' },
  { id: 'gifting', label: 'Gifting' },
  { id: 'faq', label: 'Preguntas frecuentes' },
]

/** Botón 1 (título): solo Información + Notas. Botón 2 (bloque): 6 tabs. */
export type PdpEditMode = 'principal' | 'contenido'

const MODE_TABS: Record<PdpEditMode, Tab[]> = {
  principal: ['info', 'notas'],
  contenido: [
    'descripcion',
    'caracteristicas',
    'como-usar',
    'detalles',
    'gifting',
    'faq',
  ],
}

/**
 * Botón Editar del PDP piloto (un único botón por bloque). Solo staff/admin
 * y solo el producto piloto. Los clientes nunca lo ven.
 */
export function PdpEditButton({
  product,
  mode,
  className = '',
}: {
  product: PdpSnapshot
  mode: PdpEditMode
  className?: string
}) {
  const active = useEditActive()
  const [open, setOpen] = useState(false)
  if (!active) return null
  if (!PDP_EDIT_PILOT_SLUGS.includes(product.slug)) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5C9A8] bg-[#F9EFE2] px-2.5 py-1 text-[11px] font-medium text-[#8A5A33] shadow-sm transition-colors hover:bg-[#F3E2CC] ${className}`}
        aria-label="Editar producto"
      >
        <PencilIcon />
        Editar
      </button>
      {open ? (
        <PdpEditDrawer
          product={product}
          mode={mode}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

function PdpEditDrawer({
  product,
  mode,
  onClose,
}: {
  product: PdpSnapshot
  mode: PdpEditMode
  onClose: () => void
}) {
  const router = useRouter()
  const token = useAuth((s) => s.token)
  const visibleTabs = ALL_TABS.filter((t) => MODE_TABS[mode].includes(t.id))
  const [tab, setTab] = useState<Tab>(MODE_TABS[mode][0])
  const doInfo = MODE_TABS[mode].includes('info')
  const doNotas = MODE_TABS[mode].includes('notas')
  const doDesc = MODE_TABS[mode].includes('descripcion')
  const doCarac = MODE_TABS[mode].includes('caracteristicas')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pending, setPending] = useState<{ file: File; url: string } | null>(
    null,
  )

  const [title, setTitle] = useState(product.title)
  const [summary, setSummary] = useState(product.seoDescription ?? '')
  const [price, setPrice] = useState(String(product.price))
  const [visible, setVisible] = useState(product.active !== false)
  const [tagIds, setTagIds] = useState<number[]>(
    product.tagsDetail.map((t) => t.id),
  )
  const [allTags, setAllTags] = useState<TagOption[]>([])
  const [images, setImages] = useState<Array<{ id: number; url: string | null }>>(
    product.imagesDetail.map((i) => ({ id: i.id, url: i.url })),
  )

  const salida = findAttr(product.attributesDetail, 'salida')
  const corazon = findAttr(product.attributesDetail, 'coraz', 'corazo')
  const fondo = findAttr(product.attributesDetail, 'fondo', 'base')
  const [salidaText, setSalidaText] = useState(salida?.text ?? '')
  const [corazonText, setCorazonText] = useState(corazon?.text ?? '')
  const [fondoText, setFondoText] = useState(fondo?.text ?? '')

  const descEditable = isSimpleLexical(product.description)
  const [descText, setDescText] = useState(
    descEditable ? lexicalToPlainText(product.description) : '',
  )

  const [caracTexts, setCaracTexts] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    for (const a of product.attributesDetail) {
      initial[a.id] = a.values.filter(Boolean).join(', ')
    }
    return initial
  })

  const [editorial, setEditorial] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    const source = product.editorial ?? {}
    for (const id of ['como-usar', 'detalles', 'gifting', 'faq'] as const) {
      initial[id] = (source[id] ?? []).join('\n\n')
    }
    return initial
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    async function loadTags() {
      try {
        const res = await fetch('/api/product-tags?limit=100&depth=0')
        if (!res.ok) return
        const data = (await res.json()) as {
          docs?: Array<{ id: unknown; name: unknown }>
        }
        if (cancelled) return
        setAllTags(
          (data.docs ?? []).flatMap((d) =>
            typeof d.id === 'number' && typeof d.name === 'string'
              ? [{ id: d.id, name: d.name }]
              : [],
          ),
        )
      } catch {
        /* tags opcionales: el editor sigue funcionando */
      }
    }
    void loadTags()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      setPending((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return null
      })
    }
  }, [])

  function toggleTag(id: number) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  function handleSelect(file: File) {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes')
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      setError('La imagen supera los 6MB')
      return
    }
    setPending((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
    setPending({ file, url: URL.createObjectURL(file) })
  }

  async function uploadPending(): Promise<{ id: number; url: string | null } | null> {
    if (!pending || !token) return null
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', pending.file)
      form.append('alt', title || pending.file.name)
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
      const uploaded = { id: data.id, url: data.url ?? null }
      setImages((prev) => {
        const rest = prev.slice(1)
        return [uploaded, ...rest]
      })
      setPending((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return null
      })
      return uploaded
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir')
      return null
    } finally {
      setUploading(false)
    }
  }

  async function authedJson(
    path: string,
    method: string,
    body: Record<string, unknown>,
  ) {
    const res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    if (!res.ok) throw new Error(data?.error ?? 'No se pudo guardar')
  }

  async function handleSave() {
    if (!token) {
      setError('Sesión vencida. Volvé a iniciar sesión.')
      return
    }
    if (!title.trim()) {
      setError('El nombre es requerido')
      return
    }
    setSaving(true)
    setError('')
    try {
      let imageIds = images.map((i) => i.id)
      if (pending) {
        const uploaded = await uploadPending()
        if (!uploaded) {
          setSaving(false)
          return
        }
        imageIds = [uploaded.id, ...images.slice(1).map((i) => i.id)]
      }
      const attrUpdates: Array<{ id: number; text: string }> = []
      if (doNotas) {
        if (salida) attrUpdates.push({ id: salida.id, text: salidaText })
        if (corazon) attrUpdates.push({ id: corazon.id, text: corazonText })
        if (fondo) attrUpdates.push({ id: fondo.id, text: fondoText })
      }
      if (doCarac) {
        for (const a of product.attributesDetail) {
          const text = caracTexts[a.id] ?? ''
          if (!attrUpdates.some((u) => u.id === a.id)) {
            attrUpdates.push({ id: a.id, text })
          }
        }
      }

      const productPatch: Record<string, unknown> = {}
      if (doInfo) {
        productPatch.title = title.trim()
        productPatch.price = price
        productPatch.active = visible
        productPatch.seoDescription = summary.trim()
        productPatch.tags = tagIds
        productPatch.images = imageIds
      }
      if (doDesc && descEditable) {
        productPatch.descriptionText = descText
      }
      if (Object.keys(productPatch).length > 0) {
        await authedJson(`/api/edit-mode/products/${product.id}`, 'PUT', productPatch)
      }
      for (const note of attrUpdates) {
        await authedJson(`/api/edit-mode/attributes/${note.id}`, 'PUT', {
          values: note.text
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
        })
      }
      if (doCarac || mode === 'contenido') {
        const editorialPatch: Record<string, string> = {}
        for (const id of ['como-usar', 'detalles', 'gifting', 'faq'] as const) {
          if (MODE_TABS[mode].includes(id)) {
            editorialPatch[id] = editorial[id] ?? ''
          }
        }
        if (Object.keys(editorialPatch).length > 0) {
          await authedJson('/api/pdp-content', 'PUT', editorialPatch)
        }
      }
      router.refresh()
      notifyProductsChanged()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const mainImage = pending ? pending.url : (images[0]?.url ?? null)

  return (
    <>
      {/* Click fuera cierra. Transparente: no altera el diseño del PDP. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[99] cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Editar producto ${product.title}`}
        className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-md flex-col border-l border-[#EBDFD1] bg-white shadow-2xl"
      >
      <div className="flex items-start justify-between border-b border-[#E5DDD1] px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-normal text-[#38271D]">
            Editar producto
          </h2>
          <p className="mt-0.5 truncate text-sm text-[#7A6A5D]">
            {product.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar editor"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#7A6A5D] hover:bg-[#F5EFE7]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div role="tablist" aria-label="Secciones del editor" className="flex gap-1 overflow-x-auto overflow-y-clip border-b border-[#E5DDD1] px-5">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-2 py-3 text-[13px] font-medium transition-colors ${
              tab === t.id
                ? 'border-[#B85C33] text-[#38271D]'
                : 'border-transparent text-[#7A6A5D] hover:text-[#38271D]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'info' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Imagen principal</span>
              <div className="flex items-center gap-3">
                {mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mainImage}
                    alt=""
                    className="h-20 w-20 rounded-md border border-[#E5DDD1] object-cover"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-[#E5DDD1] text-[10px] text-[#7A6A5D]">
                    Sin imagen
                  </span>
                )}
                <div className="flex flex-col gap-2">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-[#E5C9A8] bg-[#F9EFE2] px-3 py-1.5 text-xs font-medium text-[#8A5A33]">
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <path d="M12 3v12" />
                    </svg>
                    {pending ? 'Cambiar selección' : 'Cambiar imagen'}
                  </label>
                  {images.length > 0 && !pending ? (
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.slice(1))}
                      className="inline-flex w-fit items-center gap-1 text-xs text-[#8A3A33] underline underline-offset-2"
                    >
                      <TrashIcon />
                      Quitar principal
                    </button>
                  ) : null}
                </div>
              </div>
              {pending ? (
                <p className="text-xs text-[#7A6A5D]">
                  Vista previa local: se subirá al guardar los cambios.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pdp-title">Nombre del producto</Label>
              <Input
                id="pdp-title"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pdp-summary">Aromas (resumen)</Label>
              <Input
                id="pdp-summary"
                value={summary}
                maxLength={300}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium">Etiquetas de aroma</span>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-[#E5DDD1] p-2">
                {allTags.length === 0 ? (
                  <p className="text-xs text-[#7A6A5D]">Sin etiquetas.</p>
                ) : (
                  allTags.map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center gap-2 text-sm text-[#38271D]"
                    >
                      <input
                        type="checkbox"
                        checked={tagIds.includes(t.id)}
                        onChange={() => toggleTag(t.id)}
                        className="h-4 w-4 accent-[#B85C33]"
                      />
                      {t.name}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pdp-price">Precio</Label>
              <Input
                id="pdp-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 rounded-lg border border-[#EBDFD1] bg-[#FCF8F1] p-3">
              <button
                type="button"
                role="switch"
                aria-checked={visible}
                aria-label="Visible en la tienda"
                onClick={() => setVisible((v) => !v)}
                className="flex w-full items-center gap-2.5 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${visible ? 'bg-[#B85C33]' : 'bg-[#D8CFC2]'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${visible ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </span>
                <span className="text-sm font-semibold text-[#38271D]">
                  Visible en la tienda
                </span>
              </button>
              <p className="mt-1.5 text-xs leading-relaxed text-[#7A6A5D]">
                Si desactivas esta opción, el producto no se mostrará en el
                catálogo, pero no se eliminará.
              </p>
            </div>
          </div>
        ) : null}

        {tab === 'notas' ? (
          <div className="space-y-4">
            <NotaField
              id="pdp-salida"
              label="Salida"
              value={salidaText}
              disabled={salida === null}
              onChange={setSalidaText}
            />
            <NotaField
              id="pdp-corazon"
              label="Corazón"
              value={corazonText}
              disabled={corazon === null}
              onChange={setCorazonText}
            />
            <NotaField
              id="pdp-fondo"
              label="Fondo"
              value={fondoText}
              disabled={fondo === null}
              onChange={setFondoText}
            />
            {salida === null && corazon === null && fondo === null ? (
              <p className="text-xs text-[#7A6A5D]">
                Este producto no tiene notas vinculadas.
              </p>
            ) : null}
          </div>
        ) : null}

        {tab === 'descripcion' ? (
          <div className="space-y-1.5">
            <Label htmlFor="pdp-desc">Descripción</Label>
            <textarea
              id="pdp-desc"
              value={descText}
              rows={8}
              maxLength={4000}
              disabled={!descEditable}
              placeholder={
                descEditable ? 'Descripción del producto' : 'Protegida por formato avanzado'
              }
              onChange={(e) => setDescText(e.target.value)}
              className="flex min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {!descEditable ? (
              <p className="text-xs text-[#7A6A5D]">
                Esta descripción tiene formato avanzado y está protegida:
                no se modificará al guardar.
              </p>
            ) : null}
          </div>
        ) : null}

        {tab === 'caracteristicas' ? (
          <div className="space-y-4">
            {product.attributesDetail.length === 0 ? (
              <p className="text-xs text-[#7A6A5D]">
                Este producto no tiene características vinculadas.
              </p>
            ) : (
              product.attributesDetail.map((a) => (
                <div key={a.id} className="space-y-1.5">
                  <Label htmlFor={`pdp-carac-${a.id}`}>{a.name}</Label>
                  <textarea
                    id={`pdp-carac-${a.id}`}
                    value={caracTexts[a.id] ?? ''}
                    rows={2}
                    maxLength={600}
                    placeholder="Valores separados por coma"
                    onChange={(e) =>
                      setCaracTexts((v) => ({ ...v, [a.id]: e.target.value }))
                    }
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === 'como-usar' ||
        tab === 'detalles' ||
        tab === 'gifting' ||
        tab === 'faq' ? (
          <div className="space-y-1.5">
            <Label htmlFor={`pdp-ed-${tab}`}>
              {visibleTabs.find((t) => t.id === tab)?.label ?? tab}
            </Label>
            <textarea
              id={`pdp-ed-${tab}`}
              value={editorial[tab] ?? ''}
              rows={8}
              maxLength={4000}
              placeholder="Párrafos separados por línea en blanco"
              onChange={(e) =>
                setEditorial((v) => ({ ...v, [tab]: e.target.value }))
              }
              className="flex min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-[#7A6A5D]">
              Contenido editorial global: se muestra igual en todos los
              productos.
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2 border-t border-[#E5DDD1] px-5 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saving || uploading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || uploading}
          className="flex-1 bg-[#B85C33] hover:bg-[#9E4E2B]"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
      </div>
    </>
  )
}

function NotaField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string
  label: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        rows={3}
        maxLength={600}
        disabled={disabled}
        placeholder={disabled ? 'Sin notas vinculadas' : `Notas de ${label.toLowerCase()}`}
        onChange={(e) => onChange(e.target.value)}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}
