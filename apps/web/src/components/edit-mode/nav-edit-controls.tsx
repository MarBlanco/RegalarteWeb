'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEditActive } from '@/hooks/use-edit-mode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModalShell } from './edit-modal'
import { PencilIcon, TrashIcon } from './edit-button'
import { editModeRequest } from './api'
import {
  MAX_NAV_ITEMS,
  MAX_NAV_LABEL,
  isInternalPath,
  newNavKey,
  toEditorItems,
  type NavCategoryOption,
  type NavEditorItem,
} from '@/lib/navigation'

const OTHER_PATH = 'path'

interface NavEditorData {
  stored: unknown
  categories: NavCategoryOption[]
}

const isFixed = (item: NavEditorItem) =>
  item.destinationType === 'path' && item.path === '/'

function destinationText(item: NavEditorItem, categories: NavCategoryOption[]) {
  if (item.destinationType === 'path') return item.path || '—'
  const cat = categories.find((c) => c.id === item.categoryId)
  return cat ? `/catalogo?category=${cat.slug}` : 'Elegí una categoría'
}

function validate(items: NavEditorItem[]): string {
  if (items.length === 0) return 'Agregá al menos una opción'
  for (const item of items) {
    const label = item.label.trim()
    if (!label) return 'Cada opción necesita un texto'
    if (item.destinationType === 'path') {
      if (!isInternalPath(item.path.trim())) {
        return `"${label}": la ruta debe empezar con /`
      }
    } else if (item.categoryId === null) {
      return `"${label}": elegí una categoría`
    }
  }
  return ''
}

function Switch({
  checked,
  label,
  onChange,
}: Readonly<{ checked: boolean; label: string; onChange: (v: boolean) => void }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[#1F7A3E]' : 'bg-[#CFC6BA]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function Arrow({ up }: Readonly<{ up: boolean }>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <path d={up ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
    </svg>
  )
}

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function NavRow({
  item,
  index,
  total,
  categories,
  editing,
  onToggleEdit,
  onChange,
  onMove,
  onRemove,
  onDragStart,
  onDropOn,
}: Readonly<{
  item: NavEditorItem
  index: number
  total: number
  categories: NavCategoryOption[]
  editing: boolean
  onToggleEdit: () => void
  onChange: (patch: Partial<NavEditorItem>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onDragStart: () => void
  onDropOn: () => void
}>) {
  const fixed = isFixed(item)
  const shown = item.label.trim() || 'nueva opción'
  const destValue =
    item.destinationType === 'path' ? OTHER_PATH : String(item.categoryId ?? '')

  return (
    <li
      data-testid="nav-row"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onDropOn()
      }}
      className={`rounded-xl border border-[#E5DDD1] bg-[#FBF7F1] px-3 py-2.5 ${
        item.active ? '' : 'opacity-70'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="cursor-grab select-none text-[#9A8B7C]" aria-hidden="true" title="Arrastrar para reordenar">
          ⠿
        </span>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Subir ${shown}`}
            className="text-[#7A6A5D] hover:text-[#B85C33] disabled:opacity-30"
          >
            <Arrow up />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Bajar ${shown}`}
            className="text-[#7A6A5D] hover:text-[#B85C33] disabled:opacity-30"
          >
            <Arrow up={false} />
          </button>
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#38271D]">
          {shown}
          {item.accent ? (
            <span className="ml-2 rounded-full bg-[#F6E9D8] px-2 py-0.5 text-[10px] font-medium text-[#B85C33]">
              Destacada
            </span>
          ) : null}
        </span>
        <span className="hidden min-w-0 max-w-[40%] truncate rounded-md border border-[#E5DDD1] bg-white px-3 py-2 text-xs text-[#5A4A3D] sm:block">
          {destinationText(item, categories)}
        </span>
        {fixed ? (
          <span className="hidden rounded-full bg-[#F1DDD2] px-2.5 py-1 text-[10px] text-[#8A5A44] md:inline">
            Fija (no se puede eliminar)
          </span>
        ) : null}
        <Switch
          checked={item.active}
          label={`${item.active ? 'Desactivar' : 'Activar'} ${shown}`}
          onChange={(active) => onChange({ active })}
        />
        <span className="hidden w-14 text-xs text-[#38271D] sm:inline">
          {item.active ? 'Activo' : 'Inactivo'}
        </span>
        <button
          type="button"
          onClick={onToggleEdit}
          disabled={fixed}
          aria-label={`Editar ${shown}`}
          aria-expanded={editing}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5DDD1] bg-white text-[#5A4A3D] hover:bg-[#F5EFE7] disabled:opacity-40"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        {fixed ? (
          <span className="h-9 w-9" aria-hidden="true" />
        ) : (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar ${shown}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B23A2E] hover:bg-[#FBEAE7]"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing && !fixed ? (
        <div className="mt-3 grid gap-3 border-t border-[#E5DDD1] pt-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm text-[#38271D]">
            <span>Texto</span>
            <Input
              value={item.label}
              maxLength={MAX_NAV_LABEL}
              aria-label="Texto de la opción"
              placeholder="Ej. Jabones"
              onChange={(e) => onChange({ label: e.target.value })}
            />
          </label>
          <label className="space-y-1.5 text-sm text-[#38271D]">
            <span>Destino</span>
            <select
              value={destValue}
              aria-label="Destino de la opción"
              onChange={(e) =>
                e.target.value === OTHER_PATH
                  ? onChange({ destinationType: 'path', categoryId: null })
                  : onChange({
                      destinationType: 'category',
                      categoryId: Number(e.target.value),
                      path: '',
                    })
              }
              className={selectCls}
            >
              {item.destinationType === 'category' && item.categoryId === null ? (
                <option value="">Elegí una categoría…</option>
              ) : null}
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
              <option value={OTHER_PATH}>Otra ruta interna…</option>
            </select>
          </label>
          {item.destinationType === 'path' ? (
            <label className="space-y-1.5 text-sm text-[#38271D] sm:col-span-2">
              <span>Ruta interna</span>
              <Input
                value={item.path}
                aria-label="Ruta interna"
                placeholder="/catalogo?category=velas"
                onChange={(e) => onChange({ path: e.target.value })}
              />
            </label>
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#38271D] sm:col-span-2">
            <input
              type="checkbox"
              checked={item.accent}
              onChange={(e) => onChange({ accent: e.target.checked })}
              className="h-4 w-4 accent-[#B85C33]"
            />
            Destacada (color y símbolo de regalo)
          </label>
        </div>
      ) : null}
    </li>
  )
}

function NavEditor({ onClose }: Readonly<{ onClose: () => void }>) {
  const router = useRouter()
  const token = useAuth((s) => s.token)
  const [items, setItems] = useState<NavEditorItem[]>([])
  const [categories, setCategories] = useState<NavCategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!token) {
        setError('Sesión vencida. Volvé a iniciar sesión.')
        setLoading(false)
        return
      }
      try {
        const data = await editModeRequest<NavEditorData>(
          '/api/edit-mode/navigation',
          'GET',
          null,
          token,
        )
        if (!alive) return
        setCategories(data.categories)
        setItems(toEditorItems(data.stored, data.categories))
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'No se pudo cargar')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [token])

  function patch(key: string, change: Partial<NavEditorItem>) {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...change } : i)))
  }

  function moveBy(index: number, dir: -1 | 1) {
    setItems((list) => {
      const to = index + dir
      if (to < 0 || to >= list.length) return list
      const next = [...list]
      ;[next[index], next[to]] = [next[to], next[index]]
      return next
    })
  }

  function dropOn(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return
    setItems((list) => {
      const from = list.findIndex((i) => i.key === dragKey)
      const to = list.findIndex((i) => i.key === targetKey)
      if (from < 0 || to < 0) return list
      const next = [...list]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDragKey(null)
  }

  function addItem() {
    const key = newNavKey()
    setItems((list) => [
      ...list,
      {
        key,
        label: '',
        destinationType: 'category',
        categoryId: null,
        path: '',
        active: true,
        accent: false,
      },
    ])
    setEditingKey(key)
  }

  async function save() {
    const problem = validate(items)
    if (problem) {
      setError(problem)
      return
    }
    if (!token) {
      setError('Sesión vencida. Volvé a iniciar sesión.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await editModeRequest(
        '/api/edit-mode/navigation',
        'PUT',
        {
          items: items.map((i) => ({
            label: i.label.trim(),
            destinationType: i.destinationType,
            categoryId: i.categoryId,
            path: i.path.trim(),
            active: i.active,
            accent: i.accent,
          })),
        },
        token,
      )
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Editar navegación principal" onClose={onClose} wide>
      <div className="overflow-y-auto px-5 py-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-md text-sm text-[#7A6A5D]">
            Administrá las opciones del menú principal. Podés agregar, modificar,
            reordenar o desactivar ítems.
          </p>
          <Button
            type="button"
            onClick={addItem}
            disabled={loading || items.length >= MAX_NAV_ITEMS}
          >
            + Agregar opción
          </Button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-[#7A6A5D]">Cargando…</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((item, index) => (
              <NavRow
                key={item.key}
                item={item}
                index={index}
                total={items.length}
                categories={categories}
                editing={editingKey === item.key}
                onToggleEdit={() =>
                  setEditingKey((k) => (k === item.key ? null : item.key))
                }
                onChange={(change) => patch(item.key, change)}
                onMove={(dir) => moveBy(index, dir)}
                onRemove={() => setItems((list) => list.filter((i) => i.key !== item.key))}
                onDragStart={() => setDragKey(item.key)}
                onDropOn={() => dropOn(item.key)}
              />
            ))}
          </ul>
        )}

        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#E5DDD1] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving || loading}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

/**
 * Botón "Editar navegación" del header + modal. Solo en Modo Edición
 * (staff/admin sin "ver como cliente"); los clientes nunca lo ven. El
 * permiso real lo valida `/api/edit-mode/navigation` en el servidor.
 */
export function NavEditButton({ className = '' }: Readonly<{ className?: string }>) {
  const active = useEditActive()
  const [open, setOpen] = useState(false)
  if (!active) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar navegación"
        title="Editar navegación"
        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#B85C33]/60 bg-white/70 px-3.5 py-2 text-xs font-medium text-[#38271D] transition-colors hover:bg-[#F6E9D8] ${className}`}
      >
        <PencilIcon className="h-3.5 w-3.5" />
        <span className="hidden 2xl:inline">Editar navegación</span>
      </button>
      {/* Portal: el header usa backdrop-filter, que ancla los `fixed` a sí mismo. */}
      {open
        ? createPortal(<NavEditor onClose={() => setOpen(false)} />, document.body)
        : null}
    </>
  )
}
