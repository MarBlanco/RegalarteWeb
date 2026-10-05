import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findActiveCoupon } from './coupon-service'

vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))

const { getPayload } = await import('payload')

function withDocs(docs: unknown[]) {
  const find = vi.fn().mockResolvedValue({ docs })
  vi.mocked(getPayload).mockResolvedValue({ find } as never)
  return find
}

beforeEach(() => vi.clearAllMocks())

describe('findActiveCoupon', () => {
  it('busca por código normalizado solo entre cupones activos, sin pasar por access', async () => {
    const find = withDocs([{ code: 'REGALARTE10', percent: 10, active: true }])
    const coupon = await findActiveCoupon('  regalarte10 ')
    expect(coupon).toEqual({ code: 'REGALARTE10', percent: 10 })
    const args = find.mock.calls[0][0]
    expect(args.collection).toBe('coupons')
    expect(args.overrideAccess).toBe(true)
    expect(args.where).toEqual({
      and: [{ code: { equals: 'REGALARTE10' } }, { active: { equals: true } }],
    })
  })

  it('código desconocido o vacío devuelve null (y vacío ni consulta la DB)', async () => {
    const find = withDocs([])
    expect(await findActiveCoupon('NOPE')).toBeNull()
    find.mockClear()
    expect(await findActiveCoupon('   ')).toBeNull()
    expect(find).not.toHaveBeenCalled()
  })

  it('un documento con porcentaje inválido no aplica', async () => {
    withDocs([{ code: 'X', percent: 500, active: true }])
    expect(await findActiveCoupon('X')).toBeNull()
  })
})
