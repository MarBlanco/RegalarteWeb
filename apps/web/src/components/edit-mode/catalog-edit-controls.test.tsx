import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { TipoAddButton } from './tipo-edit-controls'
import { HiddenTiposStrip } from './tipo-edit-controls'
import { CatalogProductControls } from './product-edit-modal'
import { CatalogAsideFilters } from '@/components/catalog/catalog-aside'

const STAFF = {
  id: '2',
  email: 'guale@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
}

beforeEach(() => {
  useAuth.setState({ user: null, token: null })
  vi.unstubAllGlobals()
})

describe('Catálogo dinámico — visibilidad por rol', () => {
  it('"+ Agregar tipo" vive fuera del scroll (sin solape posible)', () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    const { container } = render(<TipoAddButton categoryId={3} />)
    const button = screen.getByRole('button', { name: 'Agregar tipo' })
    expect(button).toBeInTheDocument()
    expect(button.closest('nav')).toBeNull()
    expect(container.querySelector('.sticky')).toBeNull()
  })

  it('filtros colapsables en móvil, fijos en desktop', () => {
    const { container } = render(<CatalogAsideFilters />)
    expect(screen.getByText('Filtrar productos')).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: 'Filtros' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelector('form')).toBeNull()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(container.querySelector('form')).not.toBeNull()
  })

  it('tira de ocultos: staff ve reactivables, retail nada', async () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            docs: [
              {
                id: 77,
                title: 'Tipo Oculto',
                slug: 'tipo-oculto',
                description: 'd',
                active: false,
                image: null,
                sortOrder: 9,
              },
            ],
          }),
      }),
    )
    const { container } = render(<HiddenTiposStrip parentId={3} />)
    expect(await screen.findByText('Tipos ocultos')).toBeInTheDocument()
    expect(screen.getByText('Tipo Oculto')).toBeInTheDocument()
    expect(screen.getByText('Oculto')).toBeInTheDocument()
    expect(container.querySelector('nav')).toBeNull()
  })

  it('retail no recibe tira de ocultos', () => {
    useAuth.setState({ user: { ...STAFF, role: 'retail' }, token: 'tok' })
    const { container } = render(<HiddenTiposStrip parentId={3} />)
    expect(container.textContent).toBe('')
  })

  it('retail no ve agregar ni controles de tarjeta', () => {
    useAuth.setState({
      user: { ...STAFF, role: 'retail' },
      token: 'tok',
    })
    render(
      <>
        <TipoAddButton categoryId={3} />
        <CatalogProductControls productId={4} slug="vela-x" />
      </>,
    )
    expect(screen.queryByRole('button', { name: 'Agregar tipo' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar producto' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Marcar como Agotado' }),
    ).toBeNull()
  })

  it('Agotado alterna disponibilidad sin ocultar (soldOut)', async () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 4, soldOut: true }),
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CatalogProductControls productId={4} slug="vela-x" />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Marcar como Agotado' }),
    )
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/edit-mode/products/4',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ soldOut: true }),
        }),
      )
    })
  })

  it('toggle Agotado: pill compacta apagada, igual métrica que Editar', () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    render(<CatalogProductControls productId={4} slug="vela-x" />)
    const toggle = screen.getByRole('button', {
      name: 'Marcar como Agotado',
    })
    const editar = screen.getByRole('button', { name: 'Editar producto' })
    // Misma métrica compacta.
    for (const cls of ['rounded-full', 'px-2.5', 'py-1', 'text-[11px]']) {
      expect(toggle).toHaveClass(cls)
      expect(editar).toHaveClass(cls)
    }
    // Apagado: beige neutro, borde sutil, texto muted (no terracota).
    expect(toggle).toHaveClass('bg-[#FCF8F1]/95', 'border-[#E5DDD1]', 'text-[#7A6A5D]')
    expect(toggle).not.toHaveClass('text-[#8A5A33]')
  })

  it('Disponible restaura la compra (soldOut=false)', async () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 4, soldOut: false }),
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <CatalogProductControls productId={4} slug="vela-x" soldOut />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Marcar como Disponible' }),
    )
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/edit-mode/products/4',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ soldOut: false }),
        }),
      )
    })
  })
})
