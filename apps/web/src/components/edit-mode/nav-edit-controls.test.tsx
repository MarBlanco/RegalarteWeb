import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'
import { NavEditButton } from './nav-edit-controls'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

const STAFF = {
  id: '2',
  email: 'guale@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
}

const CATEGORIES = [
  { id: 2, slug: 'velas', title: 'Velas' },
  { id: 9, slug: 'jabones', title: 'Jabones', parent: null },
  { id: 20, slug: 'vela-clasica', title: 'Vela Clásica', parent: 2 },
]
const STORED = {
  items: [
    { label: 'Inicio', destinationType: 'path', path: '/', active: true },
    { label: 'Velas', destinationType: 'category', category: { id: 2, slug: 'velas' }, active: true },
  ],
}

function stubFetch(put = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })) {
  const fetchMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') return put(init)
    return { ok: true, json: async () => ({ stored: STORED, categories: CATEGORIES }) }
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, put }
}

const rowLabels = () =>
  screen.getAllByTestId('nav-row').map((r) => r.querySelector('span.flex-1')?.textContent?.trim())

async function openEditor() {
  fireEvent.click(screen.getByRole('button', { name: 'Editar navegación' }))
  await screen.findAllByTestId('nav-row')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  useAuth.setState({ user: null, token: null })
  useEditMode.setState({ viewAsClient: false })
})

describe('NavEditButton — visibilidad por rol', () => {
  it('anónimo, cliente y staff en "modo cliente" no lo ven', () => {
    const { rerender } = render(<NavEditButton />)
    expect(screen.queryByRole('button', { name: 'Editar navegación' })).toBeNull()
    useAuth.setState({ user: { ...STAFF, role: 'retail' }, token: 'tok' })
    rerender(<NavEditButton />)
    expect(screen.queryByRole('button', { name: 'Editar navegación' })).toBeNull()
    useAuth.setState({ user: STAFF, token: 'tok' })
    useEditMode.setState({ viewAsClient: true })
    rerender(<NavEditButton />)
    expect(screen.queryByRole('button', { name: 'Editar navegación' })).toBeNull()
  })

  it('staff y admin lo ven', () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    const { rerender } = render(<NavEditButton />)
    expect(screen.getByRole('button', { name: 'Editar navegación' })).toBeInTheDocument()
    useAuth.setState({ user: { ...STAFF, role: 'admin' }, token: 'tok' })
    rerender(<NavEditButton />)
    expect(screen.getByRole('button', { name: 'Editar navegación' })).toBeInTheDocument()
  })
})

describe('Editor de navegación', () => {
  beforeEach(() => useAuth.setState({ user: STAFF, token: 'tok' }))

  it('Inicio es fija: sin eliminar ni editar', async () => {
    stubFetch()
    render(<NavEditButton />)
    await openEditor()
    expect(screen.queryByRole('button', { name: 'Eliminar Inicio' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Editar Inicio' })).toBeDisabled()
    expect(screen.getByText('Fija (no se puede eliminar)')).toBeInTheDocument()
  })

  it('agrega, reordena, desactiva y guarda todo en un PUT', async () => {
    const { put } = stubFetch()
    render(<NavEditButton />)
    await openEditor()

    fireEvent.click(screen.getByRole('button', { name: '+ Agregar opción' }))
    fireEvent.change(screen.getByLabelText('Texto de la opción'), { target: { value: 'Jabones' } })
    fireEvent.change(screen.getByLabelText('Destino de la opción'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Subir Jabones' }))
    expect(rowLabels()).toEqual(['Inicio', 'Jabones', 'Velas'])

    fireEvent.click(screen.getByRole('switch', { name: 'Desactivar Velas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(put).toHaveBeenCalled())
    const body = JSON.parse(put.mock.calls[0][0].body)
    expect(body.items).toEqual([
      { label: 'Inicio', destinationType: 'path', categoryId: null, path: '/', active: true, accent: false },
      { label: 'Jabones', destinationType: 'category', categoryId: 9, path: '', active: true, accent: false },
      { label: 'Velas', destinationType: 'category', categoryId: 2, path: '', active: false, accent: false },
    ])
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('el selector lista las categorías reales: primer nivel y tipos agrupados', async () => {
    stubFetch()
    render(<NavEditButton />)
    await openEditor()
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar opción' }))
    const select = screen.getByLabelText('Destino de la opción') as HTMLSelectElement
    expect([...select.options].map((o) => o.textContent)).toEqual([
      'Elegí una categoría…',
      'Velas',
      'Jabones',
      'Vela Clásica',
      'Otra ruta interna…',
    ])
    expect(select.querySelector('optgroup')?.getAttribute('label')).toBe('Velas')
  })

  it('permite cambiar el destino a una ruta interna', async () => {
    const { put } = stubFetch()
    render(<NavEditButton />)
    await openEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Velas' }))
    fireEvent.change(screen.getByLabelText('Destino de la opción'), { target: { value: 'path' } })
    fireEvent.change(screen.getByLabelText('Ruta interna'), { target: { value: '/ayuda' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(put).toHaveBeenCalled())
    expect(JSON.parse(put.mock.calls[0][0].body).items[1]).toMatchObject({
      destinationType: 'path',
      path: '/ayuda',
    })
  })

  it('quitar una opción la saca de la lista', async () => {
    stubFetch()
    render(<NavEditButton />)
    await openEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Velas' }))
    expect(rowLabels()).toEqual(['Inicio'])
  })

  it('valida antes de enviar: sin texto o sin categoría no hay PUT', async () => {
    const { put } = stubFetch()
    render(<NavEditButton />)
    await openEditor()
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar opción' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Cada opción necesita un texto')
    fireEvent.change(screen.getByLabelText('Texto de la opción'), { target: { value: 'Nueva' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('elegí una categoría')
    expect(put).not.toHaveBeenCalled()
  })

  it('muestra el error del servidor al guardar', async () => {
    stubFetch(vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Sin permiso' }) }))
    render(<NavEditButton />)
    await openEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin permiso')
  })

  it('reordena arrastrando una fila sobre otra', async () => {
    stubFetch()
    render(<NavEditButton />)
    await openEditor()
    const rows = screen.getAllByTestId('nav-row')
    fireEvent.dragStart(rows[1])
    fireEvent.drop(rows[0])
    expect(rowLabels()).toEqual(['Velas', 'Inicio'])
  })

  it('Cancelar cierra sin guardar', async () => {
    const { put } = stubFetch()
    render(<NavEditButton />)
    await openEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryAllByTestId('nav-row')).toHaveLength(0)
    expect(put).not.toHaveBeenCalled()
  })
})
