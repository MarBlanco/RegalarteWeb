/**
 * Modo Edición — Contenido editorial global de las pestañas del PDP.
 *
 * Fuente de verdad única para "Cómo usar", "Detalles", "Gifting" y
 * "Preguntas frecuentes". Los defaults son idénticos al contenido actual
 * hardcodeado (`MOCK_TABS` en pdp-mock.ts): sin cambios guardados, el PDP
 * se ve EXACTAMENTE igual.
 */

export type PdpTabId = 'como-usar' | 'detalles' | 'gifting' | 'faq'

export const PDP_TAB_IDS: readonly PdpTabId[] = [
  'como-usar',
  'detalles',
  'gifting',
  'faq',
]

export type PdpContentData = Record<PdpTabId, string[]>

function paragraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

export const DEFAULT_PDP_CONTENT: PdpContentData = {
  'como-usar': [
    'Encendé la vela y dejala arder al menos hasta que la cera se derrita de forma pareja en toda la superficie. Así evitás que se forme túnel y prolongás su vida útil.',
    'Antes de cada uso, cortá la mecha a unos 5 mm y mantenela centrada.',
  ],
  detalles: [
    'Cera vegetal de soja, mecha 100% de algodón sin plomo y fragancias de alta calidad.',
    'Cada pieza es vertida a mano, por lo que pueden existir leves variaciones que la hacen única.',
  ],
  gifting: [
    'Presentación lista para regalar con packaging premium y papel de seda.',
    'Podés agregar una tarjeta con mensaje personalizado en el checkout.',
  ],
  faq: [
    '¿Cuánto dura encendida? Entre 40 y 45 horas según el tamaño, con un uso correcto.',
    '¿La cera es apta para veganos? Sí, es 100% cera vegetal de soja.',
    '¿Hacen envíos a todo el país? Sí, con seguimiento en cada pedido.',
  ],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Valida y blanquea el cuerpo del PUT. Solo las 4 claves conocidas, texto
 * plano acotado. Devuelve `null` sin cambios válidos.
 */
export function sanitizePdpContentPatch(
  body: unknown,
): Partial<Record<PdpTabId, string>> | null {
  if (!isRecord(body)) return null
  const patch: Partial<Record<PdpTabId, string>> = {}
  for (const id of PDP_TAB_IDS) {
    const value = body[id]
    if (value === undefined) continue
    if (typeof value !== 'string') return null
    const text = value.trim().slice(0, 4000)
    if (!text) continue
    patch[id] = text
  }
  return Object.keys(patch).length > 0 ? patch : null
}

/**
 * Lee el global `pdp-content` (server) y lo fusiona sobre los defaults.
 * Ante cualquier fallo devuelve los defaults (el PDP nunca se rompe).
 */
export async function getPdpContent(): Promise<PdpContentData> {
  try {
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })
    const stored = await payload.findGlobal({
      slug: 'pdp-content',
      depth: 0,
    })
    if (!stored || typeof stored !== 'object') return DEFAULT_PDP_CONTENT
    const record = stored as unknown as Record<string, unknown>
    const out = { ...DEFAULT_PDP_CONTENT }
    for (const id of PDP_TAB_IDS) {
      const value = record[id]
      if (typeof value === 'string' && value.trim()) {
        const parts = paragraphs(value)
        if (parts.length > 0) out[id] = parts
      }
    }
    return out
  } catch {
    return DEFAULT_PDP_CONTENT
  }
}
