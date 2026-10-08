import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import CartPage from './page'
import { useCartStore } from '@/lib/cart'
import { AVAILABILITY_POLL_MS } from '@/lib/cart/use-cart-availability'

const line = (id: number, name: string, price: number, quantity = 1) => ({
  id: String(id),
  productId: String(id),
  slug: `p-${id}`,
  name,
  price,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  image: null,
  quantity,
})

type Doc = { id: number; active?: boolean; soldOut?: boolean; stock?: number }
let catalog: Doc[] = []

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (url: string) => {
      if (String(url).startsWith('/api/products?where[id]')) {
        return { ok: true, json: async () => ({ docs: catalog }) }
      }
      return { ok: false, json: async () => ({}) }
    }),
  )
}

beforeEach(() => {
  catalog = [
    { id: 1, active: true, soldOut: false, stock: 9 },
    { id: 2, active: true, soldOut: false, stock: 9 },
  ]
  stubFetch()
  useCartStore.setState({
    items: [line(1, 'Vela Uno', 10000), line(2, 'Vela Dos', 5000, 2)],
    mode: 'RETAIL',
    hydrated: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const continueCta = () => screen.getByText(/^Continuar →$/)

describe('Carrito — disponibilidad de los productos', () => {
  it('Activo + stock → comprable: "Continuar" lleva al checkout y no hay avisos', async () => {
    render(<CartPage />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    await act(async () => {})
    expect(continueCta().closest('a')).toHaveAttribute('href', '/checkout')
    expect(screen.queryByText(/ya no están disponibles/)).toBeNull()
  })

  it.each([
    ['Agotado', { id: 2, active: true, soldOut: true, stock: 9 }, /Agotado: este producto/],
    ['Sin stock', { id: 2, active: true, soldOut: false, stock: 0 }, /Sin stock: este producto/],
    ['Oculto', { id: 2, active: false, soldOut: false, stock: 9 }, /Este producto ya no está disponible/],
  ])('%s → se avisa, no se puede continuar y no suma al total', async (_n, doc, message) => {
    catalog = [catalog[0], doc]
    render(<CartPage />)
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('ya no están disponibles')
    const cta = continueCta()
    expect(cta.closest('a')).toBeNull()
    expect(cta.closest('button')).toBeDisabled()
    expect(screen.getByText('Quitá los productos no disponibles para continuar.')).toBeInTheDocument()
    // total solo de lo comprable: 10.000 (no 20.000)
    const summary = screen.getByRole('complementary', { name: 'Resumen del pedido' })
    expect(within(summary).getByText('Productos (1)')).toBeInTheDocument()
    expect(summary.textContent).toMatch(/10\.000/)
    expect(summary.textContent).not.toMatch(/20\.000/)
    // cantidades del ítem no disponible bloqueadas; las del otro no
    const rows = screen.getAllByRole('listitem').filter((li) => li.textContent?.includes('Vela'))
    const dos = rows.find((li) => li.textContent?.includes('Vela Dos'))!
    expect(within(dos).getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled()
    const uno = rows.find((li) => li.textContent?.includes('Vela Uno'))!
    expect(within(uno).getByRole('button', { name: 'Aumentar cantidad' })).toBeEnabled()
  })

  it('producto eliminado → no comprable', async () => {
    catalog = [catalog[0]]
    render(<CartPage />)
    expect(await screen.findByText(/Este producto ya no está disponible/)).toBeInTheDocument()
    expect(continueCta().closest('button')).toBeDisabled()
  })

  it('"Quitar no disponibles" deja solo lo comprable y habilita continuar', async () => {
    catalog = [catalog[0], { id: 2, active: true, soldOut: true }]
    render(<CartPage />)
    await screen.findByText(/Agotado: este producto/)
    fireEvent.click(screen.getByRole('button', { name: 'Quitar no disponibles' }))
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual(['1'])
    await waitFor(() => expect(continueCta().closest('a')).toHaveAttribute('href', '/checkout'))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('si ningún producto es comprable lo dice', async () => {
    catalog = [{ id: 1, active: false }, { id: 2, soldOut: true }]
    render(<CartPage />)
    expect(await screen.findByText('Ningún producto del carrito está disponible.')).toBeInTheDocument()
  })

  it('mientras el carrito está abierto detecta que un producto pasó a Agotado y lo bloquea', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<CartPage />)
    await act(async () => {})
    expect(continueCta().closest('a')).toHaveAttribute('href', '/checkout')

    catalog = [catalog[0], { id: 2, active: true, soldOut: true, stock: 9 }]
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AVAILABILITY_POLL_MS + 10)
    })
    expect(await screen.findByText(/Agotado: este producto/)).toBeInTheDocument()
    expect(continueCta().closest('button')).toBeDisabled()
  })
})
