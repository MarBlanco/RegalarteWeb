/**
 * Datos del sitio editables (global `site-settings`).
 *
 * Los defaults son las cuentas oficiales de Solística (Instagram, TikTok y
 * Facebook); WhatsApp conserva el valor que estaba hardcodeado. Lo que se
 * guarde en el admin prevalece sobre estos valores.
 */

export interface SocialLinks {
  instagram: string
  tiktok: string
  facebook: string
  whatsapp: string
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: 'https://www.instagram.com/solistica_oficial/',
  tiktok: 'https://www.tiktok.com/@solistica_oficial',
  facebook: 'https://www.facebook.com/profile.php?id=100090514800368',
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
