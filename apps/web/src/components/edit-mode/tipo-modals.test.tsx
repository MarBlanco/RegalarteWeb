import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'
import {
  TipoAddButton,
  TipoItemControls,
  singularNoun,
} from './tipo-edit-controls'
import type { Tipo } from '@/components/catalog/catalog-tipos'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const STAFF = {
  id: '2',
  email: 'guale@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
}

const tipo = (id: number, name: string, sortOrder: number, extra: Partial<Tipo> = {}): Tipo => ({
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  tagline: '',
  description: `Desc ${name}`,
  image: '/img/x.jpg',
  count: 0,
  real: true,
  categoryId: id,
  sortOrder,
  ...extra,
})

interface Call {
  url: string
  method: string
  body: Record<string, unknown> | null
}

function stubFetch(respond: (c: Call) => unknown = () => ({ id: 99 })) {
  const calls: Call[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const call: Call = {
        url,
        method: init?.method ?? 'GET',
        body: init?.body ? JSON.parse(init.body as string) : null,
      }
      calls.push(call)
      return { ok: true, json: async () => respond(call) }
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

describe('singularNoun', () => {
  it.each([
    ['Velas', 'vela'],
    ['Aromas', 'aroma'],
    ['Wax-Melts', 'wax-melt'],
    ['Quemadores', 'quemador'],
    ['Packs', 'pack'],
    ['Regalarte', 'regalarte'],
  ])('%s → %s', (input, expected) => {
    expect(singularNoun(input)).toBe(expected)
  })
})

describe('Modal "Nuevo tipo de [categoría]"', () => {
  it('usa la categoría del contexto, sin selector de categoría ni de orden', async () => {
    const calls = stubFetch()
    render(<TipoAddButton categoryId={3} categoryTitle="Velas" />)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar tipo' }))
    const dialog = screen.getByRole('dialog', { name: 'Nuevo tipo de vela' })
    expect(within(dialog).queryAllByRole('combobox')).toHaveLength(0)
    expect(within(dialog).queryAllByRole('tab')).toHaveLength(0)
    const order = within(dialog).getByLabelText('Orden de aparición')
    expect(order).toBeDisabled()
    expect(order).toHaveValue('Automático (se asignará al guardar)')

    fireEvent.change(within(dialog).getByLabelText('Nombre'), { target: { value: 'Vela Bubble' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Crear tipo' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].url).toBe('/api/edit-mode/categories')
    expect(calls[0].method).toBe('POST')
    expect(calls[0].body).toMatchObject({ title: 'Vela Bubble', parent: 3, active: true })
    expect(calls[0].body).not.toHaveProperty('sortOrder')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('permite crearlo oculto y exige nombre', async () => {
    const calls = stubFetch()
    render(<TipoAddButton categoryId={3} categoryTitle="Velas" />)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar tipo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear tipo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El nombre es requerido')
    expect(calls).toHaveLength(0)
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Oculto' } })
    fireEvent.click(screen.getByRole('switch', { name: 'Visible en catálogo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear tipo' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].body).toMatchObject({ active: false })
  })

  it('no aparece para cliente', () => {
    useAuth.setState({ user: { ...STAFF, role: 'retail' }, token: 'tok' })
    render(<TipoAddButton categoryId={3} categoryTitle="Velas" />)
    expect(screen.queryByRole('button', { name: 'Agregar tipo' })).toBeNull()
  })
})

describe('Modal "Editar tipo"', () => {
  const tipos = [tipo(41, 'Vela Clásica', 1), tipo(43, 'Vela en Lata', 2)]

  it('edita solo nombre, descripción, imagen, orden y visibilidad', async () => {
    const calls = stubFetch()
    render(<TipoItemControls tipo={tipos[0]} tipos={tipos} index={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar tipo Vela Clásica' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar tipo: Vela Clásica' })
    expect(within(dialog).queryAllByRole('combobox')).toHaveLength(0)
    expect(within(dialog).queryAllByRole('tab')).toHaveLength(0)
    expect(within(dialog).getByLabelText('Orden de aparición')).toHaveValue(1)
    expect(within(dialog).getByRole('switch', { name: 'Visible en catálogo' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(dialog).getByText('Cambiar imagen')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Nombre'), { target: { value: 'Vela Nueva' } })
    fireEvent.change(within(dialog).getByLabelText('Descripción'), { target: { value: 'Otra' } })
    fireEvent.change(within(dialog).getByLabelText('Orden de aparición'), { target: { value: '2' } })
    fireEvent.click(within(dialog).getByRole('switch', { name: 'Visible en catálogo' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true))
    const put = calls.find((c) => c.method === 'PUT')
    expect(put?.url).toBe('/api/edit-mode/categories/41')
    expect(put?.body).toMatchObject({
      title: 'Vela Nueva',
      description: 'Otra',
      sortOrder: 2,
      active: false,
    })
    expect(put?.body).not.toHaveProperty('image')
  })

  it('un tipo oculto abre con la visibilidad en OFF y se reactiva', async () => {
    const calls = stubFetch()
    const hidden = tipo(50, 'Vela Oculta', 3, { active: false })
    render(<TipoItemControls tipo={hidden} tipos={[hidden]} index={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar tipo Vela Oculta' }))
    const sw = screen.getByRole('switch', { name: 'Visible en catálogo' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(sw)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true))
    expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ active: true })
  })

  it('Cancelar cierra sin guardar y Eliminar tipo usa la regla existente', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const calls = stubFetch(() => ({ deleted: true }))
    render(<TipoItemControls tipo={tipos[0]} tipos={tipos} index={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar tipo Vela Clásica' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(calls).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Editar tipo Vela Clásica' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar tipo', exact: true }))
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE')).toBe(true))
    expect(calls.find((c) => c.method === 'DELETE')?.url).toBe('/api/edit-mode/categories/41')
  })
})
