import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CartDrawer } from './cart-drawer'
import { useCartStore } from '@/lib/cart'
import { useCartUIStore } from '@/lib/cart/ui-store'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }))
  useCartStore.setState({ items: [], mode: 'RETAIL', hydrated: true })
  useCartUIStore.setState({ isOpen: false })
})

afterEach(() => {
  useCartUIStore.setState({ isOpen: false })
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  vi.unstubAllGlobals()
})

describe('CartDrawer — carrito vacío', () => {
  it('la salida lleva al inicio, no al catálogo', () => {
    render(<CartDrawer />)
    act(() => {
      useCartUIStore.getState().open()
    })
    const cta = screen.getByRole('link', { name: 'Ir al inicio' })
    expect(cta).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: /catálogo/i })).toBeNull()
  })
})
