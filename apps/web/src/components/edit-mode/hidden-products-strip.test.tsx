import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'
import { HiddenProductsStrip } from './hidden-products-strip'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const { refreshStorefrontAction } = await import('@/app/actions/refresh-storefront')

const STAFF = {
  id: '2',
  email: 'g@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
}

const HIDDEN = [
  { id: 5, title: 'Vela Oculta', slug: 'vela-oculta', price: 4000, stock: 3, soldOut: false, imageUrl: null },
]

interface Call {
  url: string
  method: string
  body: Record<string, unknown> | null
}

function stubFetch(docs = HIDDEN) {
  const calls: Call[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? 'GET',
        body: init?.body ? JSON.parse(init.body as string) : null,
      })
      if (url.startsWith('/api/edit-mode/products?')) {
        return { ok: true, json: async () => ({ docs }) }
      }
      return { ok: true, json: async () => ({ id: 5 }) }
    }),
  )
  return calls
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  useAuth.setState({ user: STAFF, token: 'tok' })
  useEditMode.setState({ viewAsClient: false })
})

describe('Productos ocultos (Modo Edición)', () => {
  it('lista los ocultos de la categoría y permite reactivar: PUT active=true y refresco inmediato', async () => {
    const calls = stubFetch()
    render(<HiddenProductsStrip categoryId={3} />)
    expect(await screen.findByText('Vela Oculta')).toBeInTheDocument()
    expect(calls[0].url).toBe('/api/edit-mode/products?category=3')

    fireEvent.click(screen.getByRole('button', { name: 'Reactivar Vela Oculta' }))
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true))
    const put = calls.find((c) => c.method === 'PUT')!
    expect(put.url).toBe('/api/edit-mode/products/5')
    expect(put.body).toEqual({ active: true })
    await waitFor(() => expect(refreshStorefrontAction).toHaveBeenCalledWith('tok'))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('sin productos ocultos no muestra nada', async () => {
    stubFetch([])
    const { container } = render(<HiddenProductsStrip categoryId={3} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('cliente, anónimo y staff en modo cliente ni siquiera consultan', async () => {
    const calls = stubFetch()
    useAuth.setState({ user: { ...STAFF, role: 'retail' }, token: 'tok' })
    const { container, rerender } = render(<HiddenProductsStrip categoryId={3} />)
    useAuth.setState({ user: null, token: null })
    rerender(<HiddenProductsStrip categoryId={3} />)
    useAuth.setState({ user: STAFF, token: 'tok' })
    useEditMode.setState({ viewAsClient: true })
    rerender(<HiddenProductsStrip categoryId={3} />)
    await new Promise((r) => setTimeout(r, 30))
    expect(calls).toHaveLength(0)
    expect(container).toBeEmptyDOMElement()
  })

  it('se recarga cuando cambia un producto (evento products-changed)', async () => {
    const calls = stubFetch()
    render(<HiddenProductsStrip categoryId={3} />)
    await screen.findByText('Vela Oculta')
    const before = calls.length
    window.dispatchEvent(new CustomEvent('products-changed'))
    await waitFor(() => expect(calls.length).toBeGreaterThan(before))
  })
})
