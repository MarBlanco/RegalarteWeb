import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CartDrawer } from './cart-drawer'
import { useCartUIStore } from '@/lib/cart/ui-store'

function backdrop(container: HTMLElement): HTMLElement | null {
  return container.querySelector('div.absolute.inset-0')
}

beforeEach(() => {
  useCartUIStore.setState({ isOpen: false })
  vi.restoreAllMocks()
})

afterEach(() => {
  useCartUIStore.setState({ isOpen: false })
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

describe('CartDrawer — overlay y scroll', () => {
  it('cerrado: el backdrop no intercepta clicks', () => {
    const { container } = render(<CartDrawer />)
    expect(backdrop(container)).not.toHaveClass('pointer-events-auto')
  })

  it('abierto: el backdrop intercepta y cierra al clickearlo', () => {
    const { container } = render(<CartDrawer />)
    act(() => {
      useCartUIStore.getState().open()
    })
    const bd = backdrop(container)
    expect(bd).toHaveClass('pointer-events-auto')
    fireEvent.click(bd!)
    expect(useCartUIStore.getState().isOpen).toBe(false)
    expect(backdrop(container)).not.toHaveClass('pointer-events-auto')
  })

  it('click dentro del panel no cierra', () => {
    render(<CartDrawer />)
    act(() => {
      useCartUIStore.getState().open()
    })
    fireEvent.click(screen.getByText('Tu carrito'))
    expect(useCartUIStore.getState().isOpen).toBe(true)
  })

  it('al cerrar restaura exactamente el scroll previo sin saltos', () => {
    Object.defineProperty(window, 'scrollY', {
      value: 250,
      configurable: true,
      writable: true,
    })
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    render(<CartDrawer />)
    act(() => {
      useCartUIStore.getState().open()
    })
    expect(document.body.style.overflow).toBe('hidden')
    act(() => {
      useCartUIStore.getState().close()
    })
    expect(document.body.style.overflow).toBe('')
    expect(scrollTo).toHaveBeenCalledWith(0, 250)

    Object.defineProperty(window, 'scrollY', {
      value: 0,
      configurable: true,
      writable: true,
    })
  })
})
