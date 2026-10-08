import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchUnavailable,
  numericProductIds,
  unavailableMessage,
  unavailableReason,
} from './availability'

beforeEach(() => vi.unstubAllGlobals())

describe('unavailableReason', () => {
  it('Activo con stock disponible → comprable', () => {
    expect(unavailableReason({ id: 1, active: true, soldOut: false, stock: 5 })).toBeNull()
    expect(unavailableReason({ id: 1 })).toBeNull()
  })

  it('Agotado → no comprable', () => {
    expect(unavailableReason({ id: 1, active: true, soldOut: true, stock: 5 })).toBe('soldout')
  })

  it('sin stock → no comprable', () => {
    expect(unavailableReason({ id: 1, active: true, stock: 0 })).toBe('nostock')
  })

  it('oculto/despublicado → no comprable', () => {
    expect(unavailableReason({ id: 1, active: false, stock: 5 })).toBe('hidden')
  })

  it('eliminado (no existe) → no comprable', () => {
    expect(unavailableReason(undefined)).toBe('deleted')
  })

  it('despublicado tiene prioridad sobre agotado', () => {
    expect(unavailableReason({ id: 1, active: false, soldOut: true })).toBe('hidden')
  })
})

describe('unavailableMessage', () => {
  it('es claro para cada motivo', () => {
    expect(unavailableMessage('soldout')).toMatch(/Agotado/)
    expect(unavailableMessage('nostock')).toMatch(/Sin stock/)
    expect(unavailableMessage('hidden')).toMatch(/ya no está disponible/)
    expect(unavailableMessage('deleted')).toMatch(/ya no está disponible/)
  })
})

describe('numericProductIds', () => {
  it('conserva solo ids numéricos positivos, sin repetir', () => {
    expect(numericProductIds(['4', '4', 'mock-1', '0', '-2', '7.5', '9'])).toEqual([4, 9])
  })
})

describe('fetchUnavailable', () => {
  it('consulta una sola vez por ids únicos y devuelve solo los no comprables', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [
          { id: 1, active: true, soldOut: false, stock: 3 },
          { id: 2, active: true, soldOut: true, stock: 3 },
          { id: 3, active: true, stock: 0 },
          { id: 4, active: false, stock: 9 },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const out = await fetchUnavailable([1, 2, 3, 4, 5, 2])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('where[id][in]=1,2,3,4,5')
    expect(Object.fromEntries(out)).toEqual({ 2: 'soldout', 3: 'nostock', 4: 'hidden', 5: 'deleted' })
  })

  it('sin ids no consulta', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await fetchUnavailable([])).size).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lanza si la consulta falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    await expect(fetchUnavailable([1])).rejects.toThrow()
  })
})
