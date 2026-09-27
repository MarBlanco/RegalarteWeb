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

  it('sin token no verifica nada', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(
      <AuthProvider>
        <span>hijo</span>
      </AuthProvider>,
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(useAuth.getState().isLoading).toBe(false)
  })
})
