import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import {
  FilterTagAddButton,
  FilterTagRowControls,
} from './filter-tag-edit-controls'

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
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('Opciones de filtro — visibilidad por rol', () => {
  it('sin staff no hay "+ Agregar" ni controles por fila', () => {
    render(
      <>
        <FilterTagAddButton kind="aroma" />
        <FilterTagRowControls
          tag={{ id: 11, name: 'Vainilla', color: null }}
          kind="aroma"
        />
      </>,
    )
    expect(screen.queryByText('+ Agregar')).toBeNull()
    expect(screen.queryByRole('button', { name: /Editar/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Eliminar/ })).toBeNull()
  })

  it('staff agrega un aroma (POST con grupo)', async () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 30, slug: 'sandalo' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<FilterTagAddButton kind="aroma" />)
    fireEvent.click(screen.getByText('+ Agregar'))
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Sándalo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/edit-mode/product-tags',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Sándalo', kind: 'aroma' }),
        }),
      )
    })
  })

  it('staff elimina una opción (DELETE con confirmación)', async () => {
    useAuth.setState({ user: STAFF, token: 'tok' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 22, deleted: true }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <FilterTagRowControls
        tag={{ id: 22, name: 'Energía', color: null }}
        kind="ritual"
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Eliminar Energía' }),
    )
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/edit-mode/product-tags/22',
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })
})
