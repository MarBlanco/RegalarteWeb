import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  resetSiteContentCache,
  useAyudaSections,
  useFreeShippingThreshold,
  useSocialLinks,
} from './site-content-client'
import { DEFAULT_SOCIAL_LINKS } from './site-settings'
import { AYUDA_SECTIONS } from '@/components/help/ayuda-data'
import { FREE_SHIPPING_THRESHOLD } from './cart/shipping'

function stubGlobals(map: Record<string, unknown | null>) {
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    const slug = url.split('/api/globals/')[1]?.split('?')[0] ?? ''
    const data = map[slug]
    return data === null || data === undefined
      ? { ok: false, json: async () => null }
      : { ok: true, json: async () => data }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.unstubAllGlobals()
  resetSiteContentCache()
})

describe('hooks de contenido editable', () => {
  it('useSocialLinks parte de los defaults y adopta los enlaces guardados', async () => {
    stubGlobals({ 'site-settings': { instagramUrl: 'https://instagram.com/solistica' } })
    const { result } = renderHook(() => useSocialLinks())
    expect(result.current).toEqual(DEFAULT_SOCIAL_LINKS)
    await waitFor(() =>
      expect(result.current.instagram).toBe('https://instagram.com/solistica'),
    )
    expect(result.current.tiktok).toBe(DEFAULT_SOCIAL_LINKS.tiktok)
  })

  it('useAyudaSections adopta las secciones guardadas', async () => {
    stubGlobals({
      'ayuda-content': { sections: [{ sectionId: 'envios', title: 'Envíos nuevos', body: [] }] },
    })
    const { result } = renderHook(() => useAyudaSections())
    expect(result.current).toBe(AYUDA_SECTIONS)
    await waitFor(() => expect(result.current[0].title).toBe('Envíos nuevos'))
  })

  it('useFreeShippingThreshold usa el umbral configurado', async () => {
    stubGlobals({ 'commerce-settings': { free_shipping_threshold: 70000 } })
    const { result } = renderHook(() => useFreeShippingThreshold())
    expect(result.current).toBe(FREE_SHIPPING_THRESHOLD)
    await waitFor(() => expect(result.current).toBe(70000))
  })

  it('si la API falla se mantienen los valores por defecto', async () => {
    const fetchMock = stubGlobals({})
    const { result } = renderHook(() => useFreeShippingThreshold())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(result.current).toBe(FREE_SHIPPING_THRESHOLD)
  })

  it('hace una sola petición por global aunque se use varias veces', async () => {
    const fetchMock = stubGlobals({ 'site-settings': {} })
    renderHook(() => useSocialLinks())
    renderHook(() => useSocialLinks())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  })
})
