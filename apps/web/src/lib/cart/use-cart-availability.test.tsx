import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCartStore } from './store'
import { AVAILABILITY_POLL_MS, useCartAvailability } from './use-cart-availability'

const line = (id: number, quantity = 1) => ({
  id: String(id),
  productId: String(id),
  slug: `p-${id}`,
  name: `Producto ${id}`,
  price: 1000,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  image: null,
  quantity,
})

type Doc = { id: number; active?: boolean; soldOut?: boolean; stock?: number }
let catalog: Doc[] = []
let fail = false

function stubFetch() {
  const fn = vi.fn().mockImplementation(async () => {
    if (fail) return { ok: false, json: async () => ({}) }
    return { ok: true, json: async () => ({ docs: catalog }) }
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  catalog = [
    { id: 1, active: true, soldOut: false, stock: 5 },
    { id: 2, active: true, soldOut: false, stock: 5 },
  ]
  fail = false
  useCartStore.setState({ items: [line(1), line(2)], mode: 'RETAIL', hydrated: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useCartAvailability', () => {
  it('Activo con stock → nada bloqueado', async () => {
    stubFetch()
    const { result } = renderHook(() => useCartAvailability())
    await waitFor(() => expect(result.current.checked).toBe(true))
    expect(result.current.hasUnavailable).toBe(false)
  })

  it.each([
    ['Agotado', { id: 2, active: true, soldOut: true, stock: 5 }, 'soldout'],
    ['sin stock', { id: 2, active: true, stock: 0 }, 'nostock'],
    ['oculto', { id: 2, active: false, stock: 5 }, 'hidden'],
  ])('%s → ese ítem queda no comprable y el otro no', async (_n, doc, reason) => {
    catalog = [{ id: 1, active: true, stock: 5 }, doc as Doc]
    stubFetch()
    const { result } = renderHook(() => useCartAvailability())
    await waitFor(() => expect(result.current.hasUnavailable).toBe(true))
    expect(Object.fromEntries(result.current.reasons)).toEqual({ '2': reason })
  })

  it('producto eliminado → no comprable', async () => {
    catalog = [{ id: 1, active: true, stock: 5 }]
    stubFetch()
    const { result } = renderHook(() => useCartAvailability())
    await waitFor(() => expect(result.current.reasons.get('2')).toBe('deleted'))
  })

  it('ids no numéricos (productos de relleno) no se consultan ni se bloquean', async () => {
    useCartStore.setState({ items: [{ ...line(1), id: 'mock-1', productId: 'mock-1' }] })
    const fetchMock = stubFetch()
    const { result } = renderHook(() => useCartAvailability())
    await waitFor(() => expect(result.current.checked).toBe(true))
    expect(result.current.hasUnavailable).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('cambios mientras el carrito está abierto: el sondeo detecta que un producto dejó de estar disponible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    stubFetch()
    const { result } = renderHook(() => useCartAvailability())
    await waitFor(() => expect(result.current.checked).toBe(true))
    expect(result.current.hasUnavailable).toBe(false)

    catalog = [{ id: 1, active: true, stock: 5 }, { id: 2, active: true, soldOut: true, stock: 5 }]
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AVAILABILITY_POLL_MS + 10)
    })
    await waitFor(() => expect(result.current.reasons.get('2')).toBe('soldout'))

    // y vuelve a estar comprable cuando se repone
    catalog = [{ id: 1, active: true, stock: 5 }, { id: 2, active: true, soldOut: false, stock: 5 }]
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AVAILABILITY_POLL_MS + 10)
    })
    await waitFor(() => expect(result.current.hasUnavailable).toBe(false))
  })

  it('al volver a la ventana revalida de inmediato', async () => {
    const fetchMock = stubFetch()
    const { result } = renderHook(() => useCartAvailability())
    await waitFor(() => expect(result.current.checked).toBe(true))
    const calls = fetchMock.mock.calls.length
    catalog = [{ id: 1, active: true, stock: 5 }, { id: 2, active: false, stock: 5 }]
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    await waitFor(() => expect(result.current.reasons.get('2')).toBe('hidden'))
    expect(fetchMock.mock.calls.length).toBeGreaterThan(calls)
  })

  it('si agregan un producto al carrito se vuelve a consultar', async () => {
    const fetchMock = stubFetch()
    const { result } = renderHook(() => useCartAvailability())
    await waitFor(() => expect(result.current.checked).toBe(true))
    const calls = fetchMock.mock.calls.length
    catalog = [...catalog, { id: 3, active: true, soldOut: true }]
    act(() => {
      useCartStore.setState({ items: [line(1), line(2), line(3)] })
    })
    await waitFor(() => expect(result.current.reasons.get('3')).toBe('soldout'))
    expect(fetchMock.mock.calls.length).toBeGreaterThan(calls)
  })

  it('si la consulta falla conserva el último resultado y lo informa', async () => {
    catalog = [{ id: 1, active: true, stock: 5 }, { id: 2, active: true, soldOut: true }]
    stubFetch()
    const { result } = renderHook(() => useCartAvailability())
    await waitFor(() => expect(result.current.reasons.get('2')).toBe('soldout'))
    fail = true
    await act(async () => {
      await result.current.refresh()
    })
    expect(result.current.failed).toBe(true)
    expect(result.current.reasons.get('2')).toBe('soldout')
  })

  it('deshabilitado no consulta', async () => {
    const fetchMock = stubFetch()
    renderHook(() => useCartAvailability(false))
    await new Promise((r) => setTimeout(r, 20))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
