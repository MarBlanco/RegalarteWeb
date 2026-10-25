import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CartDrawer } from './cart-drawer'
import { useCartStore } from '@/lib/cart'
import { useCartUIStore } from '@/lib/cart/ui-store'

const line = (id: number, name: string, quantity = 1) => ({
  id: String(id),
  productId: String(id),
  slug: `p-${id}`,
  name,
  price: 10000,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  image: null,
  quantity,
})

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        docs: [
          { id: 1, active: true, stock: 5 },
          { id: 2, active: true, stock: 5 },
        ],
      }),
    })),
  )
  useCartStore.setState({
    items: [line(1, 'Vela Uno'), line(2, 'Vela Dos', 2)],
    mode: 'RETAIL',
    hydrated: true,
  })
  useCartUIStore.setState({ isOpen: false })
})

afterEach(() => {
  useCartUIStore.setState({ isOpen: false })
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  vi.unstubAllGlobals()
})

function openDrawer() {
  render(<CartDrawer />)
  act(() => {
    useCartUIStore.getState().open()
  })
}

describe('CartDrawer — vaciar carrito pide confirmación', () => {
  it('el botón no vacía directo: abre la confirmación', () => {
    openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    expect(useCartStore.getState().items).toHaveLength(2)
    expect(screen.getByRole('alertdialog', { name: '¿Vaciar el carrito?' })).toHaveTextContent(
      '3 productos',
    )
  })

  it('confirmar vacía el carrito y cierra el diálogo', () => {
    openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar' }))
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('cancelar y Esc conservan el carrito; Esc no cierra el panel', () => {
    openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(useCartStore.getState().items).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(useCartStore.getState().items).toHaveLength(2)
    expect(useCartUIStore.getState().isOpen).toBe(true)
  })

  it('clic en el fondo cierra solo la confirmación', () => {
    openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar confirmación' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(useCartStore.getState().items).toHaveLength(2)
    expect(useCartUIStore.getState().isOpen).toBe(true)
  })

  it('si el panel se cierra, la confirmación pendiente se descarta', () => {
    openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    act(() => {
      useCartUIStore.getState().close()
    })
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(useCartStore.getState().items).toHaveLength(2)
  })
})
