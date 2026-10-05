'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_SOCIAL_LINKS,
  resolveSocialLinks,
  type SocialLinks,
} from '@/lib/site-settings'
import { normalizeAyudaSections, type AyudaSection } from '@/lib/ayuda-content'
import { AYUDA_SECTIONS } from '@/components/help/ayuda-data'
import {
  FREE_SHIPPING_THRESHOLD,
  resolveFreeShippingThreshold,
} from '@/lib/cart/shipping'

/**
 * Lectura en el navegador de los globals públicos (REST de Payload). Parten
 * de los defaults y se actualizan al llegar la respuesta; una sola petición
 * por global y por carga de página.
 */
const cache = new Map<string, Promise<unknown>>()

function loadGlobal(slug: string): Promise<unknown> {
  let p = cache.get(slug)
  if (!p) {
    p = fetch(`/api/globals/${slug}?depth=0`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
    cache.set(slug, p)
  }
  return p
}

/** Solo para tests. */
export function resetSiteContentCache() {
  cache.clear()
}

export function useSocialLinks(): SocialLinks {
  const [links, setLinks] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS)
  useEffect(() => {
    let alive = true
    void loadGlobal('site-settings').then((data) => {
      if (alive && data) setLinks(resolveSocialLinks(data))
    })
    return () => {
      alive = false
    }
  }, [])
  return links
}

export function useAyudaSections(): AyudaSection[] {
  const [sections, setSections] = useState<AyudaSection[]>(AYUDA_SECTIONS)
  useEffect(() => {
    let alive = true
    void loadGlobal('ayuda-content').then((data) => {
      if (alive && data) setSections(normalizeAyudaSections(data))
    })
    return () => {
      alive = false
    }
  }, [])
  return sections
}

/** Umbral de envío gratis de la configuración de la tienda. */
export function useFreeShippingThreshold(): number {
  const [threshold, setThreshold] = useState<number>(FREE_SHIPPING_THRESHOLD)
  useEffect(() => {
    let alive = true
    void loadGlobal('commerce-settings').then((data) => {
      if (!alive || !data) return
      setThreshold(
        resolveFreeShippingThreshold(
          (data as { free_shipping_threshold?: unknown }).free_shipping_threshold,
        ),
      )
    })
    return () => {
      alive = false
    }
  }, [])
  return threshold
}
