'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEditActive } from '@/hooks/use-edit-mode'
import { formatPrice } from '@/lib/format'
import { editModeRequest, notifyProductsChanged } from './api'
import { ProductEditButton } from './product-edit-modal'
import { useRefreshStorefront } from './use-refresh-storefront'

interface HiddenProduct {
  id: number
  title: string
  slug: string
  price: number
  stock: number | null
  soldOut: boolean
  imageUrl: string | null
}

/**
 * Productos en estado Oculto de la categoría/tipo actual (solo MODO EDICIÓN).
 * El catálogo público no lista los ocultos, así que sin esta tira un producto
 * puesto en Oculto no se podría volver a encontrar: desde acá se reactiva
 * (vuelve a Activo y a la tienda) o se abre su editor completo.
 */
export function HiddenProductsStrip({
  categoryId,
}: Readonly<{ categoryId?: number }>) {
  const active = useEditActive()
  const refreshStorefront = useRefreshStorefront()
  const token = useAuth((s) => s.token)
  const [items, setItems] = useState<HiddenProduct[]>([])
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  const latest = useRef(0)

  const load = useCallback(async () => {
    if (!token || categoryId === undefined) return
    // Si cambia la categoría con pedidos en vuelo, solo vale el último.
    const ticket = ++latest.current
    try {
      const data = await editModeRequest<{ docs: HiddenProduct[]; total?: number }>(
        `/api/edit-mode/products?category=${categoryId}`,
        'GET',
        null,
        token,
      )
      if (ticket !== latest.current) return
      setItems(data.docs)
      setTotal(data.total ?? data.docs.length)
      setError('')
    } catch (err) {
      if (ticket !== latest.current) return
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos ocultos')
    }
  }, [token, categoryId])

  useEffect(() => {
    if (active) void load()
  }, [active, load])

  useEffect(() => {
    window.addEventListener('products-changed', load)
    return () => window.removeEventListener('products-changed', load)
  }, [load])

  async function reactivate(id: number) {
    if (!token) return
    setBusy(id)
    setError('')
    try {
      await editModeRequest(`/api/edit-mode/products/${id}`, 'PUT', { active: true }, token)
      // Primero se avisa a las listas que dependen del dato (ej. productos
      // ocultos): la tarjeta puede desmontarse al refrescar y este modal con ella.
      notifyProductsChanged()
      await refreshStorefront()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reactivar')
    } finally {
      setBusy(null)
    }
  }

  if (!active || categoryId === undefined) return null
  if (items.length === 0) {
    return error ? (
      <p role="alert" className="mt-4 text-xs text-red-700">
        {error}
      </p>
    ) : null
  }

  return (
    <div className="mt-6 rounded-lg border border-dashed border-[#C9A24B] bg-[#FCF8F1] p-4">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A6A5D]">
        <span>Productos ocultos</span>
        <span className="rounded-full bg-[#EFE7DD] px-2 py-0.5 text-[10px] font-bold">
          {total}
        </span>
      </p>
      <ul className="space-y-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-md border border-[#EBDFD1] bg-white/70 p-2"
          >
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-[#F4EDE4]">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="h-full w-full object-cover opacity-70" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[#38271D]">{p.title}</span>
              <span className="block text-xs text-[#7A6A5D]">
                {formatPrice(p.price)} · Oculto
              </span>
            </span>
            <button
              type="button"
              disabled={busy === p.id}
              onClick={() => void reactivate(p.id)}
              aria-label={`Reactivar ${p.title}`}
              className="rounded-full border border-[#B85C33] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#B85C33] hover:bg-white disabled:opacity-50"
            >
              Reactivar
            </button>
            <ProductEditButton productId={p.id} slug={p.slug} />
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      {total > items.length ? (
        <p className="mt-2 text-xs text-[#7A6A5D]">
          Mostrando {items.length} de {total}. Reactivá o editá estos para ver el resto.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-[#7A6A5D]">
        Los productos ocultos no se muestran en la tienda; sus datos se conservan.
        Al reactivarlos vuelven a aparecer.
      </p>
    </div>
  )
}
