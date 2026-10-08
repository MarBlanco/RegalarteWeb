import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { CartDrawer } from './cart-drawer'
import { useCartStore } from '@/lib/cart'
import { useCartUIStore } from '@/lib/cart/ui-store'

const line = (id: number, name: string, price: number) => ({
  id: String(id),
  productId: String(id),
  slug: `p-${id}`,
  name,
  price,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  image: null,
  quantity: 1,
})

let catalog: Array<Record<string, unknown>> = []

beforeEach(() => {
  catalog = [
    { id: 1, active: true, stock: 5 },
    { id: 2, active: true, stock: 5 },
  ]
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => ({ ok: true, json: async () => ({ docs: catalog }) })),
  )
  useCartStore.setState({
    items: [line(1, 'Vela Uno', 10000), line(2, 'Vela Dos', 5000)],
    mode: 'RETAIL',
    hydrated: true,
  })
  useCartUIStore.setState({ isOpen: false })
})

afterEach(() => {
  useCartUIStore.setState({ isOpen: false })
  document.body.style.overflow = ''
  vi.unstubAllGlobals()
})

describe('CartDrawer — disponibilidad', () => {
  it('cerrado no consulta; al abrir revalida', async () => {
    render(<CartDrawer />)
    expect(fetch).not.toHaveBeenCalled()
    act(() => useCartUIStore.getState().open())
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })

  it('Activo → sin avisos; Agotado/Sin stock/Oculto/Eliminado → aviso por línea y total sin ese producto', async () => {
    render(<CartDrawer />)
    act(() => useCartUIStore.getState().open())
    await act(async () => {})
    expect(screen.queryByText(/ya no están disponibles/)).toBeNull()

    catalog = [catalog[0], { id: 2, active: true, soldOut: true, stock: 5 }]
    // revalidación al abrir de nuevo
    act(() => useCartUIStore.getState().close())
    act(() => useCartUIStore.getState().open())
    expect(await screen.findByText(/Agotado: este producto/)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Algunos productos ya no están disponibles')
    expect(screen.getAllByText(/10\.000/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/15\.000/)).toBeNull()
  })

  it.each([
    ['Sin stock', { id: 2, active: true, stock: 0 }, /Sin stock/],
    ['Oculto', { id: 2, active: false, stock: 5 }, /ya no está disponible\./],
  ])('%s → aviso en la línea', async (_n, doc, message) => {
    catalog = [catalog[0], doc]
    render(<CartDrawer />)
    act(() => useCartUIStore.getState().open())
    expect(await screen.findByText(message)).toBeInTheDocument()
  })

  it('producto eliminado → aviso', async () => {
    catalog = [catalog[0]]
    render(<CartDrawer />)
    act(() => useCartUIStore.getState().open())
    expect(await screen.findByText(/ya no está disponible\./)).toBeInTheDocument()
  })
})
