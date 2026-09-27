import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'
import LoginPage from './page'

beforeEach(() => {
  useAuth.setState({ user: null, token: null })
  useEditMode.setState({ viewAsClient: false })
  vi.unstubAllGlobals()
})

describe('Login — pantalla dividida', () => {
  it('muestra panel visual y formulario con los flujos existentes', () => {
    render(<LoginPage />)
    expect(
      screen.getByRole('heading', { name: 'Bienvenida' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ingresá a tu cuenta para continuar.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }),
    ).toHaveAttribute('href', '/auth/forgot-password')
    expect(
      screen.getByRole('button', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute(
      'href',
      '/auth/register',
    )
    expect(
      screen.queryByRole('button', { name: /google/i }),
    ).toBeNull()
  })

  it('mostrar/ocultar alterna el tipo del campo contraseña', () => {
    render(<LoginPage />)
    const input = screen.getByLabelText('Contraseña')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('login exitoso guarda sesión con la forma real de Payload (user, no doc)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'Authenticated successfully.',
            token: 'jwt-token',
            exp: 123,
            user: {
              id: 2,
              email: 'solisticaoficial@gmail.com',
              name: 'Guale',
              role: 'staff',
              customer_type: 'RETAIL',
            },
          }),
      }),
    )
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'solisticaoficial@gmail.com' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secreta' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull()
      expect(useAuth.getState().user?.role).toBe('staff')
      expect(useAuth.getState().user?.email).toBe(
        'solisticaoficial@gmail.com',
      )
      expect(useAuth.getState().token).toBe('jwt-token')
    })
  })

  it('login exitoso resetea el modo cliente heredado', async () => {
    useEditMode.setState({ viewAsClient: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: 'tok',
            user: {
              id: 2,
              email: 'solisticaoficial@gmail.com',
              name: 'Guale',
              role: 'staff',
              customer_type: 'RETAIL',
            },
          }),
      }),
    )
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'solisticaoficial@gmail.com' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secreta' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => {
      expect(useAuth.getState().user?.role).toBe('staff')
      expect(useEditMode.getState().viewAsClient).toBe(false)
    })
  })

  it('ver como cliente no destruye la sesión', () => {
    useAuth.setState({
      user: {
        id: '2',
        email: 'guale@example.com',
        name: 'Guale',
        role: 'staff',
        customer_type: 'RETAIL',
      },
      token: 'tok',
    })
    useEditMode.setState({ viewAsClient: true })
    expect(useAuth.getState().user?.role).toBe('staff')
    expect(useAuth.getState().token).toBe('tok')
    useEditMode.setState({ viewAsClient: false })
    expect(useAuth.getState().user?.role).toBe('staff')
  })
})

describe('Login — errores', () => {
  it('credenciales inválidas muestran el error sin romper', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({ errors: [{ message: 'Email o contraseña incorrectos' }] }),
      }),
    )
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'nadie@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'incorrecta' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Email o contraseña incorrectos',
      )
    })
  })
})
