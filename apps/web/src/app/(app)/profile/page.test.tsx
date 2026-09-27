import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'
import ProfilePage from './page'

const STAFF = {
  id: '2',
  email: 'guale@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
  phone: '111',
  address: null,
  addresses: [],
}

beforeEach(() => {
  useAuth.setState({ user: null, token: null, isLoading: false })
  useEditMode.setState({ viewAsClient: false })
  vi.unstubAllGlobals()
})

describe('Mi cuenta — estados base', () => {
  it('espera la rehidratación antes de redirigir', () => {
    useAuth.setState({ user: null, token: null, isLoading: true })
    render(<ProfilePage />)
    expect(screen.getByText('Cargando tu sesión…')).toBeInTheDocument()
  })

  it('sin sesión resuelta redirige al login', () => {
    useAuth.setState({ user: null, token: null, isLoading: false })
    render(<ProfilePage />)
    expect(
      screen.getByText('Redirigiendo al inicio de sesión…'),
    ).toBeInTheDocument()
  })

  it('muestra datos, email bloqueado y sin WhatsApp', () => {
    useAuth.setState({ user: STAFF, token: 'tok', isLoading: false })
    render(<ProfilePage />)
    expect(screen.getByRole('heading', { name: 'Mi cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre y apellido')).toHaveValue('Guale')
    const email = screen.getByLabelText('Email')
    expect(email).toBeDisabled()
    expect(
      screen.getByText('El email no se puede modificar desde aquí.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('WhatsApp')).toBeNull()
    expect(screen.queryByText('Dirección principal')).toBeInTheDocument()
    expect(screen.queryByText('Otras direcciones')).toBeInTheDocument()
  })

  it('staff en modo cliente ve cómo volver a edición', () => {
    useAuth.setState({ user: STAFF, token: 'tok', isLoading: false })
    useEditMode.setState({ viewAsClient: true })
    render(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Modo Edición' }))
    expect(useEditMode.getState().viewAsClient).toBe(false)
  })

  it('logout limpia sesión y modo cliente', () => {
    useAuth.setState({ user: STAFF, token: 'tok', isLoading: false })
    useEditMode.setState({ viewAsClient: true })
    render(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(useAuth.getState().user).toBeNull()
    expect(useEditMode.getState().viewAsClient).toBe(false)
  })
})

describe('Mi cuenta — guardado con estado real', () => {
  it('deshabilitado sin cambios, activo con cambios, guarda y vuelve', async () => {
    useAuth.setState({ user: STAFF, token: 'tok', isLoading: false })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          doc: { name: 'Guale Nuevo', phone: '111', address: null, addresses: [] },
        }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<ProfilePage />)
    const save = screen.getByRole('button', { name: 'Guardar cambios' })
    expect(save).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Nombre y apellido'), {
      target: { value: 'Guale Nuevo' },
    })
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/2',
        expect.objectContaining({ method: 'PATCH' }),
      )
    })
    await waitFor(() => {
      expect(
        screen.getByText('Cambios guardados correctamente'),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).toBeDisabled()
    expect(useAuth.getState().user?.name).toBe('Guale Nuevo')
  })

  it('error conserva los datos introducidos', async () => {    useAuth.setState({ user: STAFF, token: 'tok', isLoading: false })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ errors: [{ message: 'Falla red' }] }),
      }),
    )
    render(<ProfilePage />)
    fireEvent.change(screen.getByLabelText('Nombre y apellido'), {
      target: { value: 'Otro Nombre' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Falla red')
    })
    expect(screen.getByLabelText('Nombre y apellido')).toHaveValue('Otro Nombre')
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).not.toBeDisabled()
  })

  it('403 indica sesión vencida en lugar del error crudo', async () => {
    useAuth.setState({ user: STAFF, token: 'tok', isLoading: false })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403, json: () => Promise.resolve({}) }),
    )
    render(<ProfilePage />)
    fireEvent.change(screen.getByLabelText('Nombre y apellido'), {
      target: { value: 'Otro Nombre' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Tu sesión venció. Volvé a iniciar sesión.',
      )
    })
    expect(screen.getByLabelText('Nombre y apellido')).toHaveValue('Otro Nombre')
  })
})

describe('Mi cuenta — teléfonos y direcciones', () => {
  it('teléfono alternativo aparece, se agrega y se elimina', () => {
    useAuth.setState({ user: STAFF, token: 'tok', isLoading: false })
    render(<ProfilePage />)
    expect(screen.queryByLabelText(/Teléfono alternativo/)).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar otro teléfono' }),
    )
    expect(screen.getByLabelText(/Teléfono alternativo/)).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Eliminar teléfono alternativo' }),
    )
    expect(screen.queryByLabelText('Teléfono alternativo')).toBeNull()
  })

  it('agregar dirección adicional valida y lista', () => {
    useAuth.setState({ user: STAFF, token: 'tok', isLoading: false })
    render(<ProfilePage />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar otra dirección' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar dirección' }),
    )
    expect(screen.getByText('Poné una etiqueta (ej. Trabajo)')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Etiqueta'), {
      target: { value: 'Trabajo' },
    })
    fireEvent.change(screen.getAllByLabelText('Calle')[1], {
      target: { value: 'Urquiza' },
    })
    fireEvent.change(screen.getAllByLabelText('Número')[1], {
      target: { value: '567' },
    })
    fireEvent.change(screen.getAllByLabelText('Código postal')[1], {
      target: { value: '3260' },
    })
    fireEvent.change(screen.getAllByLabelText('Localidad')[1], {
      target: { value: 'Concepción' },
    })
    fireEvent.change(screen.getAllByLabelText('Provincia')[1], {
      target: { value: 'Entre Ríos' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar dirección' }),
    )
    expect(screen.getByText('Trabajo')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Eliminar dirección/ }))
    expect(screen.queryByText('Trabajo')).toBeNull()
  })
})
