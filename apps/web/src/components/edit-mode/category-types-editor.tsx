'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModalShell } from './edit-modal'
import { TrashIcon } from './edit-button'
import { editModeRequest } from './api'
import { ImagePicker } from './tipo-image-picker'

/** Orden de las categorías principales: el del menú; el resto, por título. */
const MAIN_ORDER = ['velas', 'aromas', 'wax-melts', 'quemadores', 'packs', 'regalarte']

interface MainCategory {
  id: number
  slug: string
  title: string
}

interface TipoDoc {
  id: number
  title: string
  slug: string
  description: string
  image: { id: number; url: string | null } | null
  sortOrder: number
  active: boolean
  seoTitle: string
  seoDescription: string
}

interface Draft {
  title: string
  description: string
  image: { id: number | null; url: string | null }
  imageTouched: boolean
  sortOrder: string
  active: boolean
  seoTitle: string
  seoDescription: string
}

type InnerTab = 'info' | 'productos' | 'seo'
const NEW = 'new'

export function sortMainCategories(list: MainCategory[]): MainCategory[] {
  const rank = (c: MainCategory) => {
    const i = MAIN_ORDER.indexOf(c.slug)
    return i === -1 ? MAIN_ORDER.length : i
  }
  return [...list].sort(
    (a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, 'es'),
  )
}

function draftFrom(t: TipoDoc): Draft {
  return {
    title: t.title,
    description: t.description,
    image: { id: t.image?.id ?? null, url: t.image?.url ?? null },
    imageTouched: false,
    sortOrder: String(t.sortOrder),
    active: t.active,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
  }
}

function emptyDraft(tipos: TipoDoc[]): Draft {
  const next = tipos.reduce((max, t) => Math.max(max, t.sortOrder + 1), 0)
  return {
    title: '',
    description: '',
    image: { id: null, url: null },
    imageTouched: false,
    sortOrder: String(next),
    active: true,
    seoTitle: '',
    seoDescription: '',
  }
}

const textareaCls =
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function TipoProducts({ tipoId }: Readonly<{ tipoId: number }>) {
  const [items, setItems] = useState<Array<{ id: number; title: string; active?: boolean }> | null>(null)
  useEffect(() => {
    let alive = true
    fetch(
      `/api/products?where[category][equals]=${tipoId}&limit=100&depth=0&sort=title`,
    )
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs?: Array<{ id: number; title: string; active?: boolean }> }) => {
        if (alive) setItems(d.docs ?? [])
      })
      .catch(() => {
        if (alive) setItems([])
      })
    return () => {
      alive = false
    }
  }, [tipoId])

  if (items === null) return <p className="text-sm text-[#7A6A5D]">Cargando…</p>
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-[#7A6A5D]">Este tipo todavía no tiene productos.</p>
      ) : (
        <ul className="divide-y divide-[#EBDFD1] rounded-lg border border-[#EBDFD1]">
          {items.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm text-[#38271D]">
              <span>{p.title}</span>
              {p.active === false ? (
                <span className="text-xs text-[#7A6A5D]">Oculto</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-[#7A6A5D]">
        Para asociar productos a este tipo, elegilo como Categoría al crear o
        editar un producto.
      </p>
    </div>
  )
}

/**
 * Editor central de categorías y tipos (MODO EDICIÓN). Una solapa por
 * categoría principal; cada una muestra sus tipos reales (categorías hijas,
 * modelo existente) para editarlos o agregar uno nuevo asociado a ella.
 * El permiso real lo validan las rutas `/api/edit-mode/categories`.
 */
export function CategoryTypesEditor({
  initialCategoryId,
  initialTipoId,
  onClose,
}: Readonly<{
  initialCategoryId?: number
  initialTipoId?: number
  onClose: () => void
}>) {
  const router = useRouter()
  const token = useAuth((s) => s.token)
  const [mains, setMains] = useState<MainCategory[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId ?? null)
  const [tipos, setTipos] = useState<TipoDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>(
    initialTipoId === undefined ? NEW : String(initialTipoId),
  )
  const [draft, setDraft] = useState<Draft | null>(null)
  const [tab, setTab] = useState<InnerTab>('info')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Categorías principales reales (activas, sin padre).
  useEffect(() => {
    let alive = true
    fetch(
      '/api/categories?where[parent][exists]=false&where[active][equals]=true&limit=100&depth=0',
    )
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs?: MainCategory[] }) => {
        if (!alive) return
        const list = sortMainCategories(
          (d.docs ?? []).map((c) => ({ id: c.id, slug: c.slug, title: c.title })),
        )
        setMains(list)
        setCategoryId((cur) => cur ?? list[0]?.id ?? null)
      })
      .catch(() => {
        if (alive) setError('No se pudieron cargar las categorías')
      })
    return () => {
      alive = false
    }
  }, [])

  const loadTipos = useCallback(
    async (parent: number): Promise<TipoDoc[]> => {
      if (!token) throw new Error('Sesión vencida. Volvé a iniciar sesión.')
      const data = await editModeRequest<{ docs: TipoDoc[] }>(
        `/api/edit-mode/categories?parent=${parent}`,
        'GET',
        null,
        token,
      )
      return data.docs
    },
    [token],
  )

  // Tipos de la categoría seleccionada.
  useEffect(() => {
    if (categoryId === null) return
    let alive = true
    setLoading(true)
    setError('')
    loadTipos(categoryId)
      .then((docs) => {
        if (!alive) return
        setTipos(docs)
        setSelected((cur) => {
          if (cur !== NEW && docs.some((t) => String(t.id) === cur)) return cur
          return docs[0] ? String(docs[0].id) : NEW
        })
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'No se pudieron cargar los tipos')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [categoryId, loadTipos])

  const current = useMemo(
    () => tipos.find((t) => String(t.id) === selected) ?? null,
    [tipos, selected],
  )

  // El borrador sigue a la selección (otro tipo, o "+ Agregar tipo").
  useEffect(() => {
    if (loading) return
    setDraft(current ? draftFrom(current) : emptyDraft(tipos))
    if (!current) setTab('info')
  }, [current, loading, tipos])

  function patch(change: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...change } : d))
  }

  function broadcast() {
    router.refresh()
    window.dispatchEvent(new CustomEvent('tipos-changed'))
  }

  async function save() {
    if (!draft || categoryId === null || !token) return
    if (!draft.title.trim()) {
      setError('El nombre es requerido')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const common = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        sortOrder: draft.sortOrder === '' ? 0 : Number(draft.sortOrder),
        active: draft.active,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
      }
      let savedId: number
      if (current) {
        await editModeRequest(
          `/api/edit-mode/categories/${current.id}`,
          'PUT',
          { ...common, ...(draft.imageTouched ? { image: draft.image.id } : {}) },
          token,
        )
        savedId = current.id
      } else {
        const created = await editModeRequest<{ id: number }>(
          '/api/edit-mode/categories',
          'POST',
          {
            ...common,
            parent: categoryId,
            ...(draft.imageTouched && draft.image.id !== null ? { image: draft.image.id } : {}),
          },
          token,
        )
        savedId = created.id
      }
      const docs = await loadTipos(categoryId)
      setTipos(docs)
      setSelected(String(savedId))
      setNotice(current ? 'Cambios guardados' : 'Tipo creado')
      broadcast()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!current || categoryId === null || !token) return
    if (
      !window.confirm(
        `¿Eliminar el tipo "${current.title}"? Si tiene productos, se ocultará en lugar de borrarse.`,
      )
    ) {
      return
    }
    setSaving(true)
    setError('')
    try {
      const out = await editModeRequest<{ deactivated?: boolean }>(
        `/api/edit-mode/categories/${current.id}`,
        'DELETE',
        null,
        token,
      )
      const docs = await loadTipos(categoryId)
      setTipos(docs)
      setSelected(docs[0] ? String(docs[0].id) : NEW)
      setNotice(
        out.deactivated
          ? 'El tipo tenía productos: se ocultó en lugar de borrarse.'
          : 'Tipo eliminado',
      )
      broadcast()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar')
    } finally {
      setSaving(false)
    }
  }

  const innerTabs: Array<{ id: InnerTab; label: string }> = [
    { id: 'info', label: 'Información' },
    { id: 'productos', label: 'Productos' },
    { id: 'seo', label: 'SEO' },
  ]

  return (
    <ModalShell title="Editar tipo" onClose={onClose} wide>
      <div className="overflow-y-auto px-5 py-4">
        <div
          role="tablist"
          aria-label="Categorías"
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
        >
          {mains.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={categoryId === c.id}
              onClick={() => {
                setCategoryId(c.id)
                setSelected(NEW)
                setNotice('')
                setError('')
              }}
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                categoryId === c.id
                  ? 'border-[#B85C33] bg-[#FFF3EA] text-[#8A3F1E]'
                  : 'border-[#E5DDD1] bg-white text-[#5A4A3D] hover:bg-[#F5EFE7]'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {draft === null ? (
          <p className="py-8 text-center text-sm text-[#7A6A5D]">
            {error || 'Cargando…'}
          </p>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Secciones del tipo"
              className="mb-4 inline-flex gap-1 rounded-full bg-[#F5EFE7] p-1"
            >
              {innerTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  disabled={t.id === 'productos' && !current}
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                    tab === t.id ? 'bg-white font-medium text-[#B85C33] shadow-sm' : 'text-[#5A4A3D]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cte-tipo">Tipo</Label>
                <select
                  id="cte-tipo"
                  value={selected}
                  onChange={(e) => {
                    setSelected(e.target.value)
                    setNotice('')
                    setError('')
                  }}
                  className={selectCls}
                >
                  {tipos.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.title}
                      {t.active ? '' : ' (oculto)'}
                    </option>
                  ))}
                  <option value={NEW}>+ Agregar tipo…</option>
                </select>
              </div>

              {tab === 'info' ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="cte-title">Nombre</Label>
                    <Input
                      id="cte-title"
                      value={draft.title}
                      maxLength={80}
                      placeholder={current ? '' : 'Ej. Vela Bubble'}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cte-desc">Descripción</Label>
                    <textarea
                      id="cte-desc"
                      value={draft.description}
                      rows={3}
                      maxLength={600}
                      onChange={(e) => patch({ description: e.target.value })}
                      className={textareaCls}
                    />
                  </div>
                  <ImagePicker
                    value={draft.image}
                    onChange={(image) => patch({ image, imageTouched: true })}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cte-order">Orden de aparición</Label>
                      <Input
                        id="cte-order"
                        type="number"
                        min="0"
                        step="1"
                        value={draft.sortOrder}
                        onChange={(e) => patch({ sortOrder: e.target.value })}
                      />
                      <p className="text-xs text-[#7A6A5D]">
                        Define el orden en que se muestra este tipo en la tienda.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span id="cte-visible-label" className="text-sm font-medium">
                        Visible en catálogo
                      </span>
                      <div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={draft.active}
                          aria-labelledby="cte-visible-label"
                          onClick={() => patch({ active: !draft.active })}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                            draft.active ? 'bg-[#B85C33]' : 'bg-[#D8CFC2]'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              draft.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-[#7A6A5D]">
                        Si desactivás esta opción, este tipo no se mostrará en la
                        tienda, pero no se eliminará.
                      </p>
                    </div>
                  </div>
                </>
              ) : null}

              {tab === 'productos' && current ? <TipoProducts tipoId={current.id} /> : null}

              {tab === 'seo' ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="cte-seo-title">Título SEO</Label>
                    <Input
                      id="cte-seo-title"
                      value={draft.seoTitle}
                      maxLength={120}
                      onChange={(e) => patch({ seoTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cte-seo-desc">Descripción SEO</Label>
                    <textarea
                      id="cte-seo-desc"
                      value={draft.seoDescription}
                      rows={3}
                      maxLength={300}
                      onChange={(e) => patch({ seoDescription: e.target.value })}
                      className={textareaCls}
                    />
                  </div>
                </>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p role="status" className="mt-3 text-sm text-[#4F6B2E]">
                {notice}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DDD1] pt-4">
              {current ? (
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#B23A2E] hover:underline disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Eliminar tipo
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => void save()} disabled={saving || loading}>
                  {saving ? 'Guardando…' : current ? 'Guardar cambios' : 'Crear tipo'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  )
}
