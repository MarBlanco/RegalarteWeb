/**
 * Contenido de Ayuda editable (global `ayuda-content`). Se lee en el
 * navegador desde el REST público (ver `site-content-client.ts`).
 *
 * Los defaults son `AYUDA_SECTIONS` (el contenido que estaba hardcodeado):
 * sin secciones guardadas la página y los enlaces del pie no cambian.
 */

import { AYUDA_SECTIONS, type AyudaSection } from '@/components/help/ayuda-data'

export type { AyudaSection }

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function internalHref(value: unknown): string | null {
  const href = text(value)
  return href.startsWith('/') && !href.startsWith('//') ? href : null
}

/**
 * Global guardado → secciones renderizables. Se descartan las secciones
 * inválidas (sin id/título o con id repetido); si no queda ninguna se usan
 * los defaults. La numeración ("01", "02", …) es posicional.
 */
export function normalizeAyudaSections(stored: unknown): AyudaSection[] {
  const raw =
    stored && typeof stored === 'object'
      ? (stored as { sections?: unknown }).sections
      : null
  if (!Array.isArray(raw)) return AYUDA_SECTIONS

  const seen = new Set<string>()
  const out: AyudaSection[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const id = text(r.sectionId)
    const title = text(r.title)
    if (!ID_RE.test(id) || !title || seen.has(id)) continue
    seen.add(id)

    const body = Array.isArray(r.body)
      ? r.body
          .map((b) => text((b as { text?: unknown } | null)?.text))
          .filter((t) => t.length > 0)
      : []
    const ctaLabel = text(r.ctaLabel)
    const ctaHref = internalHref(r.ctaHref)

    out.push({
      id,
      number: String(out.length + 1).padStart(2, '0'),
      title,
      intro: text(r.intro),
      body,
      ...(ctaLabel && ctaHref ? { cta: { label: ctaLabel, href: ctaHref } } : {}),
    })
  }
  return out.length > 0 ? out : AYUDA_SECTIONS
}
