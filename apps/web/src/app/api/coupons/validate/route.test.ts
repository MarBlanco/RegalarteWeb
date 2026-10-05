import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/orders/coupon-service', () => ({
  findActiveCoupon: vi.fn(),
}))

const { findActiveCoupon } = await import('@/lib/orders/coupon-service')

function req(body: unknown, raw = false) {
  return new Request('http://localhost/api/coupons/validate', {
    method: 'POST',
    body: raw ? (body as string) : JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/coupons/validate', () => {
  it('cupón activo devuelve code y percent (nada más)', async () => {
    vi.mocked(findActiveCoupon).mockResolvedValue({ code: 'REGALARTE10', percent: 10 })
    const res = await POST(req({ code: 'regalarte10' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ valid: true, code: 'REGALARTE10', percent: 10 })
  })

  it('cupón desconocido o inactivo responde 404 sin datos', async () => {
    vi.mocked(findActiveCoupon).mockResolvedValue(null)
    const res = await POST(req({ code: 'NOPE' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ valid: false })
  })

  it('cuerpo inválido responde 400 sin consultar', async () => {
    expect((await POST(req('no-json', true))).status).toBe(400)
    expect((await POST(req({}))).status).toBe(400)
    expect((await POST(req({ code: 123 }))).status).toBe(400)
    expect((await POST(req({ code: 'x'.repeat(65) }))).status).toBe(400)
    expect(findActiveCoupon).not.toHaveBeenCalled()
  })

  it('error de la DB responde 500 sin filtrar detalles', async () => {
    vi.mocked(findActiveCoupon).mockRejectedValue(new Error('db caída'))
    const res = await POST(req({ code: 'X' }))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ valid: false })
  })
})
