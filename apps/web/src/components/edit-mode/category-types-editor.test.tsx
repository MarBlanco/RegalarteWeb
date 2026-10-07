import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'
import { CategoryTypesEditor, sortMainCategories } from './category-types-editor'
import { CategoryTypesEditorHost } from './tipo-edit-controls'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const STAFF = {
  id: '2',
  email: 'guale@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
}

const MAINS = [
  { id: 4, slug: 'aromas', title: 'Aromas' },
  { id: 3, slug: 'velas', title: 'Velas' },
  { id: 9, slug: 'jabones', title: 'Jabones' },
]

const tipo = (id: number, title: string, extra: Record<string, unknown> = {}) => ({
  id,
  title,
  slug: title.toLowerCase().replace(/\s+/g, '-'),
  description: `Desc ${title}`,
  image: null,
  sortOrder: id,
  active: true,
  seoTitle: '',
  seoDescription: '',
  ...extra,
})

const TIPOS: Record<number, ReturnType<typeof tipo>[]> = {
  3: [tipo(41, 'Vela Clásica'), tipo(42, 'Vela en Lata', { active: false })],
  4: [tipo(46, 'Difusores'), tipo(47, 'Home Sprays')],
  9: [],
}

interface Call {
  url: string
  method: string
  body: Record<string, unknown> | null
}

function stubFetch(
  respond: (call: Call) => unknown = () => ({ id: 99 }),
  products: Array<{ id: number; title: string; active?: boolean }> = [],
) {
  const calls: Call[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (url.startsWith('/api/categories?')) {
        return { ok: true, json: async () => ({ docs: MAINS }) }
      }
      if (url.startsWith('/api/products?')) {
        return { ok: true, json: async () => ({ docs: products }) }
      }
      const call: Call = {
        url,
        method,
        body: init?.body ? JSON.parse(init.body as string) : null,
      }
      calls.push(call)
      const list = /parent=(\d+)/.exec(url)
      if (method === 'GET' && list) {
        return { ok: true, json: async () => ({ docs: TIPOS[Number(list[1])] ?? [] }) }
      }
      return { ok: true, json: async () => respond(call) }
    }),
  )
  return calls
}

async function openEditor(props: { categoryId?: number; tipoId?: number } = {}) {
  const onClose = vi.fn()
  render(
    <CategoryTypesEditor
      initialCategoryId={props.categoryId}
      initialTipoId={props.tipoId}
      onClose={onClose}
    />,
  )
  await screen.findByLabelText('Nombre')
  return onClose
}

const tipoOptions = () =>
  within(screen.getByLabelText('Tipo')).getAllByRole('option').map((o) => o.textContent)

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  useAuth.setState({ user: STAFF, token: 'tok' })
  useEditMode.setState({ viewAsClient: false })
})

describe('sortMainCategories', () => {
  it('ordena como el menú y deja las demás al final por título', () => {
    expect(sortMainCategories(MAINS).map((c) => c.slug)).toEqual(['velas', 'aromas', 'jabones'])
  })
})

describe('Editor central de categorías y tipos', () => {
  it('una solapa por categoría principal; abre en la del tipo y lo selecciona', async () => {
    stubFetch()
    await openEditor({ categoryId: 3, tipoId: 41 })
    const tabs = within(screen.getByRole('tablist', { name: 'Categorías' })).getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Velas', 'Aromas', 'Jabones'])
    expect(screen.getByRole('tab', { name: 'Velas' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Vela Clásica')
    expect(tipoOptions()).toEqual(['Vela Clásica', 'Vela en Lata (oculto)', '+ Agregar tipo…'])
  })

  it('cada solapa muestra los tipos reales de su categoría', async () => {
    stubFetch()
    await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.click(screen.getByRole('tab', { name: 'Aromas' }))
    await waitFor(() => expect(screen.getByLabelText('Nombre')).toHaveValue('Difusores'))
    expect(tipoOptions()).toEqual(['Difusores', 'Home Sprays', '+ Agregar tipo…'])
    fireEvent.click(screen.getByRole('tab', { name: 'Jabones' }))
    await waitFor(() => expect(tipoOptions()).toEqual(['+ Agregar tipo…']))
    expect(screen.getByRole('button', { name: 'Crear tipo' })).toBeInTheDocument()
  })

  it('edita un tipo existente: PUT con nombre, descripción, orden y visibilidad', async () => {
    const calls = stubFetch()
    await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Vela Clásica Plus' } })
    fireEvent.change(screen.getByLabelText('Orden de aparición'), { target: { value: '7' } })
    fireEvent.click(screen.getByRole('switch', { name: 'Visible en catálogo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByRole('status')
    const put = calls.find((c) => c.method === 'PUT')
    expect(put?.url).toBe('/api/edit-mode/categories/41')
    expect(put?.body).toMatchObject({
      title: 'Vela Clásica Plus',
      description: 'Desc Vela Clásica',
      sortOrder: 7,
      active: false,
    })
    expect(put?.body).not.toHaveProperty('image')
    expect(refresh).toHaveBeenCalled()
  })

  it('"+ Agregar tipo…" crea un tipo asociado a la categoría seleccionada', async () => {
    const calls = stubFetch()
    await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'new' } })
    await waitFor(() => expect(screen.getByLabelText('Nombre')).toHaveValue(''))
    expect(screen.getByLabelText('Orden de aparición')).toHaveValue(43)
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Vela Bubble' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear tipo' }))
    await screen.findByRole('status')
    const post = calls.find((c) => c.method === 'POST')
    expect(post?.url).toBe('/api/edit-mode/categories')
    expect(post?.body).toMatchObject({ title: 'Vela Bubble', parent: 3, active: true })
    expect(post?.body).not.toHaveProperty('slug')
    expect(screen.getByRole('status')).toHaveTextContent('Tipo creado')
  })

  it('crear exige nombre y no envía nada si falta', async () => {
    const calls = stubFetch()
    await openEditor({ categoryId: 9 })
    fireEvent.click(screen.getByRole('button', { name: 'Crear tipo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El nombre es requerido')
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it('la solapa Productos lista los productos del tipo; en un tipo nuevo está deshabilitada', async () => {
    stubFetch(undefined, [{ id: 1, title: 'Vela Vainilla' }, { id: 2, title: 'Vela Oculta', active: false }])
    await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.click(screen.getByRole('tab', { name: 'Productos' }))
    expect(await screen.findByText('Vela Vainilla')).toBeInTheDocument()
    expect(screen.getByText('Oculto')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'new' } })
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Productos' })).toBeDisabled())
  })

  it('SEO se envía al guardar', async () => {
    const calls = stubFetch()
    await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.click(screen.getByRole('tab', { name: 'SEO' }))
    fireEvent.change(screen.getByLabelText('Título SEO'), { target: { value: 'Velas clásicas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByRole('status')
    expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ seoTitle: 'Velas clásicas' })
  })

  it('elimina con confirmación y avisa si solo se ocultó', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const calls = stubFetch((c) => (c.method === 'DELETE' ? { deactivated: true } : {}))
    await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar tipo' }))
    await screen.findByRole('status')
    expect(calls.find((c) => c.method === 'DELETE')?.url).toBe('/api/edit-mode/categories/41')
    expect(screen.getByRole('status')).toHaveTextContent('se ocultó en lugar de borrarse')
  })

  it('si el usuario no confirma, no elimina', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const calls = stubFetch()
    await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar tipo' }))
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false)
  })

  it('muestra el error del servidor al guardar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.startsWith('/api/categories?')) return { ok: true, json: async () => ({ docs: MAINS }) }
        if ((init?.method ?? 'GET') === 'GET') return { ok: true, json: async () => ({ docs: TIPOS[3] }) }
        return { ok: false, json: async () => ({ error: 'Sin permiso' }) }
      }),
    )
    await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin permiso')
  })

  it('Cancelar cierra el editor', async () => {
    stubFetch()
    const onClose = await openEditor({ categoryId: 3, tipoId: 41 })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('CategoryTypesEditorHost', () => {
  it('se abre con el evento del lápiz y solo en Modo Edición', async () => {
    stubFetch()
    const { unmount } = render(<CategoryTypesEditorHost />)
    window.dispatchEvent(
      new CustomEvent('open-category-types-editor', { detail: { categoryId: 3, tipoId: 41 } }),
    )
    expect(await screen.findByLabelText('Nombre')).toHaveValue('Vela Clásica')
    unmount()

    useAuth.setState({ user: { ...STAFF, role: 'retail' }, token: 'tok' })
    render(<CategoryTypesEditorHost />)
    window.dispatchEvent(
      new CustomEvent('open-category-types-editor', { detail: { categoryId: 3 } }),
    )
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByLabelText('Nombre')).toBeNull()
  })
})
