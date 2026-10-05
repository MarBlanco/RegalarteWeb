import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import VerifyPage from './page'

const search = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useSearchParams: () => search,
}))

beforeEach(() => {
  vi.unstubAllGlobals()
  for (const k of Array.from(search.keys())) search.delete(k)
})

describe('Verify email', () => {
  it('llama al endpoint de Payload con el token en la ruta y muestra el éxito', async () => {
    search.set('token', 'abc 123')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    render(<VerifyPage />)
    expect(await screen.findByText('Email verificado')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/users/verify/abc%20123', {
      method: 'POST',
    })
  })

  it('token inválido muestra "Link inválido"', async () => {
    search.set('token', 'malo')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(<VerifyPage />)
    expect(await screen.findByText('Link inválido')).toBeInTheDocument()
  })

  it('sin token muestra "Link inválido" sin llamar a la API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<VerifyPage />)
    expect(await screen.findByText('Link inválido')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
