/**
 * Datos del sitio editables (global `site-settings`).
 *
 * Los defaults son EXACTAMENTE los valores que antes estaban hardcodeados en
 * el footer y en la sección Contacto de Ayuda: sin cambios guardados nada
 * cambia en la tienda.
 */

export interface SocialLinks {
  instagram: string
  tiktok: string
  facebook: string
  whatsapp: string
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: 'https://instagram.com',
  tiktok: 'https://tiktok.com',
  facebook: 'https://facebook.com',
  whatsapp: 'https://wa.me/5491158582146',
}

function pickUrl(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^https:\/\/[^\s]+$/.test(value.trim())
    ? value.trim()
    : fallback
}

/** Global guardado → enlaces válidos (https) con fallback a los defaults. */
export function resolveSocialLinks(stored: unknown): SocialLinks {
  const s =
    stored && typeof stored === 'object'
      ? (stored as Record<string, unknown>)
      : {}
  return {
    instagram: pickUrl(s.instagramUrl, DEFAULT_SOCIAL_LINKS.instagram),
    tiktok: pickUrl(s.tiktokUrl, DEFAULT_SOCIAL_LINKS.tiktok),
    facebook: pickUrl(s.facebookUrl, DEFAULT_SOCIAL_LINKS.facebook),
    whatsapp: pickUrl(s.whatsappUrl, DEFAULT_SOCIAL_LINKS.whatsapp),
  }
}
