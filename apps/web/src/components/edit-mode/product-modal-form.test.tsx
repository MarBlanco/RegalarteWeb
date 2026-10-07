import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { ProductEditButton } from './product-edit-modal'
import { MultiSelect } from './multi-select'
import { ModalShell } from './edit-modal'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const PRODUCT = {
  id: 99,
  title: 'Vela Test',
  price: 30000,
  compareAtPrice: 45000,
  stock: 100,
  active: true,
  featured: true,
  soldOut: false,
  category: { id: 3, title: 'Velas' },
  tags: [{ id: 11 }, { id: 12 }],
  images: [],
  description: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Desc', format: 0 }] }] } },
}

const TAGS = [
  { id: 11, name: 'Ámbar', kind: 'aroma' },
  { id: 12, name: 'Vainilla', kind: 'aroma' },
  { id: 13, name: 'Cacao', kind: 'aroma' },
  { id: 21, name: 'Energía', kind: 'ritual' },
  { id: 22, name: 'Relajación', kind: 'ritual' },
]

let saved: Record<string, unknown> | null = null

function mockFetch(product: Record<string, unknown> = PRODUCT) {
  saved = null
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const u = String(url)
      if (init?.method === 'PUT') {
        saved = JSON.parse(init.body as string)
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      }
      if (u.startsWith('/api/products/')) return Promise.resolve({ ok: true, json: () => Promise.resolve(product) })
      if (u.startsWith('/api/categories')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ docs: [{ id: 3, title: 'Velas' }] }) })
      if (u.startsWith('/api/product-tags')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ docs: TAGS }) })
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    }),
  )
}

async function openEditor(product?: Record<string, unknown>) {
  mockFetch(product)
  render(<ProductEditButton productId={99} slug="vela-test" />)
  fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))
  await waitFor(() => expect(screen.getByLabelText('Nombre / título')).toHaveValue('Vela Test'))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  useAuth.setState({
    user: { id: '2', email: 'g@example.com', name: 'Guale', role: 'staff', customer_type: 'RETAIL' },
    token: 'tok',
  })
})

describe('Editar producto — precio y stock', () => {
  it('no existe "Precio tachado" y los campos no son numéricos con spinner', async () => {
    await openEditor()
    expect(screen.queryByLabelText('Precio tachado')).toBeNull()
    for (const label of ['Precio', 'Stock']) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveAttribute('type', 'text')
      expect(input).not.toHaveAttribute('step')
    }
  })

  it('permite borrar, escribir y reemplazar el valor (precio con coma o punto, stock entero)', async () => {
    await openEditor()
    const price = screen.getByLabelText('Precio')
    fireEvent.change(price, { target: { value: '' } })
    expect(price).toHaveValue('')
    fireEvent.change(price, { target: { value: '1234,5' } })
    expect(price).toHaveValue('1234,5')
    fireEvent.change(price, { target: { value: '12a' } })
    expect(price).toHaveValue('1234,5') // caracteres inválidos no entran
    fireEvent.change(price, { target: { value: '99.999' } })
    expect(price).toHaveValue('1234,5') // más de 2 decimales no entra

    const stock = screen.getByLabelText('Stock')
    fireEvent.change(stock, { target: { value: '' } })
    fireEvent.change(stock, { target: { value: '7' } })
    expect(stock).toHaveValue('7')
    fireEvent.change(stock, { target: { value: '7.5' } })
    expect(stock).toHaveValue('7')
  })

  it('guarda precio con punto decimal, sin precio tachado, y exige precio', async () => {
    await openEditor()
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El precio es requerido')
    expect(saved).toBeNull()
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '1500,50' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    await waitFor(() => expect(saved).not.toBeNull())
    expect(saved).toMatchObject({ price: '1500.50', stock: '100' })
    expect(saved).not.toHaveProperty('compareAtPrice')
  })
})

describe('Editar producto — estado', () => {
  it('Activo / Agotado / Oculto son excluyentes y Destacado es independiente', async () => {
    await openEditor()
    const group = screen.getByRole('group', { name: 'Estado' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.map((r) => (r as HTMLInputElement).labels?.[0]?.textContent?.trim())).toEqual([
      'Activo',
      'Agotado',
      'Oculto',
    ])
    expect(screen.getByRole('radio', { name: 'Activo' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: 'Agotado' }))
    expect(screen.getByRole('radio', { name: 'Agotado' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Activo' })).not.toBeChecked()
    expect(radios.filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1)
    // Destacado no depende del estado
    expect(screen.getByRole('checkbox', { name: 'Destacado' })).toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Destacado' }))
    expect(screen.getByRole('radio', { name: 'Agotado' })).toBeChecked()
  })

  it.each([
    ['Activo', { active: true, soldOut: false }],
    ['Agotado', { active: true, soldOut: true }],
    ['Oculto', { active: false, soldOut: false }],
  ])('guardar como %s envía solo esa combinación', async (label, expected) => {
    await openEditor()
    fireEvent.click(screen.getByRole('radio', { name: label }))
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    await waitFor(() => expect(saved).not.toBeNull())
    expect(saved).toMatchObject(expected)
  })

  it('un producto guardado como inactivo abre en Oculto y el agotado en Agotado', async () => {
    await openEditor({ ...PRODUCT, active: false, soldOut: true })
    expect(screen.getByRole('radio', { name: 'Oculto' })).toBeChecked()
  })
})

describe('Editar producto — aromas y rituales', () => {
  it('cerrado muestra los aromas elegidos; abierto permite marcar y quitar varios', async () => {
    await openEditor()
    const aromas = screen.getByRole('button', { name: 'Aromas' })
    expect(aromas).toHaveTextContent('Ámbar, Vainilla')
    fireEvent.click(aromas)
    const list = screen.getByRole('listbox', { name: 'Aromas' })
    expect(within(list).getAllByRole('checkbox').map((c) => (c as HTMLInputElement).labels?.[0]?.textContent?.trim())).toEqual([
      'Ámbar',
      'Vainilla',
      'Cacao',
    ])
    fireEvent.click(within(list).getByRole('checkbox', { name: 'Cacao' }))
    expect(aromas).toHaveTextContent('Ámbar, Vainilla, Cacao')
    fireEvent.click(within(list).getByRole('checkbox', { name: 'Ámbar' }))
    fireEvent.click(within(list).getByRole('checkbox', { name: 'Vainilla' }))
    expect(aromas).toHaveTextContent('Cacao')
  })

  it('rituales usa el mismo patrón y guardar combina ambos grupos', async () => {
    await openEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Rituales' }))
    const list = screen.getByRole('listbox', { name: 'Rituales' })
    fireEvent.click(within(list).getByRole('checkbox', { name: 'Energía' }))
    fireEvent.click(within(list).getByRole('checkbox', { name: 'Relajación' }))
    expect(screen.getByRole('button', { name: 'Rituales' })).toHaveTextContent('Energía, Relajación')
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    await waitFor(() => expect(saved).not.toBeNull())
    expect((saved?.tags as number[]).slice().sort()).toEqual([11, 12, 21, 22])
  })

  it('Escape cierra el desplegable pero no el modal', async () => {
    await openEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Aromas' }))
    expect(screen.getByRole('listbox', { name: 'Aromas' })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Aromas' }), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByLabelText('Nombre / título')).toBeInTheDocument()
  })
})

describe('MultiSelect', () => {
  it('sin opciones muestra el texto vacío y sin selección el placeholder', () => {
    render(<MultiSelect id="ms" label="Aromas" options={[]} selected={[]} onChange={() => {}} emptyText="Nada" />)
    const trigger = screen.getByRole('button', { name: 'Aromas' })
    expect(trigger).toHaveTextContent('Seleccionar…')
    fireEvent.click(trigger)
    expect(screen.getByText('Nada')).toBeInTheDocument()
  })

  it('cierra al hacer clic fuera', () => {
    render(
      <div>
        <MultiSelect id="ms" label="Aromas" options={[{ id: 1, label: 'A' }]} selected={[]} onChange={() => {}} />
        <p>fuera</p>
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Aromas' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByText('fuera'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})

describe('ModalShell — cierre por fondo', () => {
  it('seleccionar texto dentro del panel y soltar sobre el fondo NO cierra el modal', () => {
    const onClose = vi.fn()
    render(
      <ModalShell title="Prueba" onClose={onClose}>
        <input aria-label="campo" />
      </ModalShell>,
    )
    const backdrop = screen.getByRole('presentation')
    // arrastre: mousedown dentro del panel, mouseup/click sobre el fondo
    fireEvent.mouseDown(screen.getByLabelText('campo'))
    fireEvent.click(backdrop)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('un clic real sobre el fondo sí cierra, y el panel no', () => {
    const onClose = vi.fn()
    render(
      <ModalShell title="Prueba" onClose={onClose}>
        <input aria-label="campo" />
      </ModalShell>,
    )
    const backdrop = screen.getByRole('presentation')
    fireEvent.mouseDown(screen.getByLabelText('campo'))
    fireEvent.click(screen.getByLabelText('campo'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(backdrop)
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
