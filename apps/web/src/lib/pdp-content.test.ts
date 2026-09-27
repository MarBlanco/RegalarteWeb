import { describe, it, expect, vi } from 'vitest'
import {
  DEFAULT_PDP_CONTENT,
  getPdpContent,
  sanitizePdpContentPatch,
} from './pdp-content'

// Sin DB: getPayload falla y la función debe devolver defaults.
vi.mock('payload', () => ({
  getPayload: () => Promise.reject(new Error('sin DB en unit test')),
}))

describe('PDP editorial — sanitización del PUT', () => {
  it('acepta claves conocidas con texto', () => {
    expect(
      sanitizePdpContentPatch({ faq: 'P1\n\nP2', gifting: 'G' }),
    ).toEqual({ faq: 'P1\n\nP2', gifting: 'G' })
  })

  it('rechaza vacío, no-strings y claves desconocidas', () => {
    expect(sanitizePdpContentPatch(null)).toBeNull()
    expect(sanitizePdpContentPatch({})).toBeNull()
    expect(sanitizePdpContentPatch({ role: 'admin' })).toBeNull()
    expect(sanitizePdpContentPatch({ faq: 123 })).toBeNull()
    expect(sanitizePdpContentPatch({ faq: '   ' })).toBeNull()
  })
})

describe('PDP editorial — defaults idénticos al diseño actual', () => {
  it('las 4 tabs tienen contenido', () => {
    for (const id of ['como-usar', 'detalles', 'gifting', 'faq'] as const) {
      expect(DEFAULT_PDP_CONTENT[id].length).toBeGreaterThan(0)
    }
  })

  it('sin DB devuelve defaults (nunca rompe)', async () => {
    const content = await getPdpContent()
    expect(content).toEqual(DEFAULT_PDP_CONTENT)
  }, 30000)
})
