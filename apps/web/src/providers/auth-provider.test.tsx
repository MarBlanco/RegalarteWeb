import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { AuthProvider } from './auth-provider'

const ADMIN = {
  id: '1',
  email: 'martinblancodev@gmail.com',
  name: 'Martín',
  role: 'admin' as const,
  customer_type: 'RETAIL' as const,
}

beforeEach(() => {
  useAuth.setState({ user: null, token: null, isLoading: true })
  vi.unstubAllGlobals()
})

describe('AuthProvider — valida sesión persistida', () => {
  it('token inválido limpia la sesión muerta', async () => {
    useAuth.setState({ user: ADMIN, token: 'vencido' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: null }),
      }),
    )
    render(
      <AuthProvider>
        <span>hijo</span>
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(useAuth.getState().user).toBeNull()
      expect(useAuth.getState().token).toBeNull()
    })
    expect(screen.getByText('hijo')).toBeInTheDocument()
  })

  it('token válido conserva la sesión', async () => {
    useAuth.setState({ user: ADMIN, token: 'vivo' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: ADMIN }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <AuthProvider>
        <span>hijo</span>
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          headers: { Authorization: 'JWT vivo' },
        }),
      )
    })
    expect(useAuth.getState().user?.role).toBe('admin')
    expect(useAuth.getState().isLoading).toBe(false)
  })

  it('sin token adopta la sesión del panel (cookie)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: ADMIN, token: 'jwt-cookie' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <AuthProvider>
        <span>hijo</span>
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(useAuth.getState().token).toBe('jwt-cookie')
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({ credentials: 'same-origin' }),
    )
    expect(useAuth.getState().user?.role).toBe('admin')
    expect(useAuth.getState().isLoading).toBe(false)
  })

  it('sin token sigue "cargando" hasta resolver la cookie (los guards no redirigen antes)', async () => {
    let resolveMe: (v: unknown) => void = () => {}
    const fetchMock = vi.fn().mockReturnValue(new Promise((r) => (resolveMe = r)))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <AuthProvider>
        <span>hijo</span>
      </AuthProvider>,
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(useAuth.getState().isLoading).toBe(true)
    resolveMe({ ok: true, json: () => Promise.resolve({ user: ADMIN, token: 'jwt-cookie' }) })
    await waitFor(() => expect(useAuth.getState().isLoading).toBe(false))
    expect(useAuth.getState().user?.role).toBe('admin')
  })

  it('en StrictMode la ejecución descartada no baja "cargando" antes de resolver la cookie', async () => {
    const resolvers: Array<(v: unknown) => void> = []
    const fetchMock = vi.fn().mockImplementation(() => new Promise((r) => resolvers.push(r)))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <StrictMode>
        <AuthProvider>
          <span>hijo</span>
        </AuthProvider>
      </StrictMode>,
    )
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2))
    // Resuelve primero la ejecución descartada (sin sesión): no debe liberar a los guards.
    resolvers[0]({ ok: true, json: () => Promise.resolve({ user: null }) })
    await new Promise((r) => setTimeout(r, 20))
    expect(useAuth.getState().isLoading).toBe(true)
    resolvers[1]({ ok: true, json: () => Promise.resolve({ user: ADMIN, token: 'jwt-cookie' }) })
    await waitFor(() => expect(useAuth.getState().isLoading).toBe(false))
    expect(useAuth.getState().user?.role).toBe('admin')
  })

  it('sin token y sin sesión de panel queda como visitante', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: null }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <AuthProvider>
        <span>hijo</span>
      </AuthProvider>,
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(useAuth.getState().user).toBeNull()
    expect(useAuth.getState().token).toBeNull()
    expect(useAuth.getState().isLoading).toBe(false)
  })
})
