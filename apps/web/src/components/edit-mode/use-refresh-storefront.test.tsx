import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useRefreshStorefront } from './use-refresh-storefront'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const { refreshStorefrontAction } = await import('@/app/actions/refresh-storefront')

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.setState({ user: null, token: 'tok' })
})

describe('useRefreshStorefront', () => {
  it('primero expira el caché del servidor (acción con el token) y después refresca', async () => {
    const order: string[] = []
    vi.mocked(refreshStorefrontAction).mockImplementation(async () => {
      order.push('accion')
      return { ok: true }
    })
    refresh.mockImplementation(() => order.push('refresh'))
    const { result } = renderHook(() => useRefreshStorefront())
    await result.current()
    expect(refreshStorefrontAction).toHaveBeenCalledWith('tok')
    expect(order).toEqual(['accion', 'refresh'])
  })

  it('si la acción falla igual refresca (el guardado ya ocurrió)', async () => {
    vi.mocked(refreshStorefrontAction).mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useRefreshStorefront())
    await result.current()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('sin sesión no llama a la acción pero refresca', async () => {
    useAuth.setState({ user: null, token: null })
    const { result } = renderHook(() => useRefreshStorefront())
    await result.current()
    expect(refreshStorefrontAction).not.toHaveBeenCalled()
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
