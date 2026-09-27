import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { PdpEditButton, type PdpSnapshot } from './pdp-edit-drawer'

const STAFF = {
  id: '2',
  email: 'guale@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
}

const PILOT: PdpSnapshot = {
  id: 32,
  slug: 'vela-vainilla-ambar',
  title: 'Vela Vainilla & Ámbar',
  price: 38900,
  active: true,
  seoDescription: 'Vainilla · Ámbar · Almizcle',
  tagsDetail: [{ id: 1, name: 'Vainilla' }],
  imagesDetail: [],
  description: null,
  editorial: {
    'como-usar': ['Usar así'],
    detalles: ['Detalle'],
    gifting: ['Regalo'],
    faq: ['Pregunta'],
  },
  attributesDetail: [
    { id: 10, name: 'Salida', values: ['Vainilla'] },
    { id: 11, name: 'Corazón', values: ['Cacao'] },
    { id: 12, name: 'Fondo', values: ['Sándalo'] },
  ],
}

beforeEach(() => {
  useAuth.setState({ user: null, token: null })
  vi.unstubAllGlobals()
})

describe('PDP piloto — un solo botón Editar + drawer', () => {
  it('staff ve un único Editar solo en el piloto', () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    const { container } = render(
      <PdpEditButton product={PILOT} mode="principal" />,
    )
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Editar producto' }),
    ).toBeInTheDocument()
  })

  it('otros productos no muestran el botón', () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    const { container } = render(
      <PdpEditButton product={{ ...PILOT, slug: 'otra-vela' }} mode="principal" />,
    )
    expect(container.textContent).toBe('')
  })

  it('retail no ve el botón', () => {
    useAuth.setState({ user: { ...STAFF, role: 'retail' }, token: 'tok' })
    const { container } = render(
      <PdpEditButton product={PILOT} mode="principal" />,
    )
    expect(container.textContent).toBe('')
  })

  it('el drawer abre con 3 solapas y guarda todo', async () => {    useAuth.setState({ user: STAFF, token: 'tok' })
    const calls: Array<{ url: string; method: string; body: unknown }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (String(url).startsWith('/api/product-tags')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ docs: [] }),
          })
        }
        calls.push({
          url: String(url),
          method: init?.method ?? 'GET',
          body: init?.body ? JSON.parse(String(init.body)) : null,
        })
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        })
      }),
    )
    render(<PdpEditButton product={PILOT} mode="principal" />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))

    expect(screen.getByRole('tab', { name: 'Información principal' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Notas aromáticas' }))
    expect(screen.getByLabelText('Salida')).toHaveValue('Vainilla')
    fireEvent.change(screen.getByLabelText('Salida'), {
      target: { value: 'Vainilla, azúcar' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => {
      const put = calls.find((c) => c.url === '/api/edit-mode/products/32')
      expect(put?.method).toBe('PUT')
      expect(
        (put?.body as { title?: string })?.title,
      ).toBe('Vela Vainilla & Ámbar')
      const note = calls.find((c) => c.url === '/api/edit-mode/attributes/10')
      expect(note?.method).toBe('PUT')
      expect(note?.body).toEqual({ values: ['Vainilla', 'azúcar'] })
    })
  })

  it('click fuera cierra, click dentro mantiene abierto', () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ docs: [] }),
      }),
    )
    const { container } = render(
      <PdpEditButton product={PILOT} mode="principal" />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const backdrop = container.querySelector(
      'div.fixed.inset-0.z-\\[99\\]',
    ) as HTMLElement
    expect(backdrop).not.toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Notas aromáticas' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(backdrop)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('botón 2 abre las 6 pestañas sin info/notas', () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ docs: [] }),
      }),
    )
    render(<PdpEditButton product={PILOT} mode="contenido" />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))
    for (const label of [
      'Descripción',
      'Características',
      'Cómo usar',
      'Detalles',
      'Gifting',
      'Preguntas frecuentes',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
    expect(
      screen.queryByRole('tab', { name: 'Información principal' }),
    ).toBeNull()
    expect(
      screen.queryByRole('tab', { name: 'Notas aromáticas' }),
    ).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Cómo usar' }))
    expect(screen.getByLabelText('Cómo usar')).toHaveValue('Usar así')
  })
})
