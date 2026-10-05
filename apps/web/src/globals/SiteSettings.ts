import type { GlobalConfig } from 'payload'

/**
 * Datos del sitio visibles al cliente (pie de página).
 *
 * Los enlaces de redes se guardan aquí en lugar de estar hardcodeados en el
 * footer. Vacío = se usa el valor por defecto actual (ver `lib/site-settings`).
 *
 * Acceso (mismo patrón que CommerceSettings): lectura pública; edición
 * admin/staff.
 */
const httpsUrl = (value: unknown) => {
  if (value === undefined || value === null || value === '') return true
  return typeof value === 'string' && /^https:\/\/[^\s]+$/.test(value)
    ? true
    : 'Debe ser una URL que empiece con https://'
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Datos del sitio',
  admin: {
    group: 'Configuración',
    description:
      'Enlaces de redes sociales y de contacto (pie de página y página de Ayuda). Vacío = valor por defecto.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin' || u.role === 'staff'
    },
  },
  fields: [
    { name: 'instagramUrl', type: 'text', label: 'Instagram (URL)', validate: httpsUrl },
    { name: 'tiktokUrl', type: 'text', label: 'TikTok (URL)', validate: httpsUrl },
    { name: 'facebookUrl', type: 'text', label: 'Facebook (URL)', validate: httpsUrl },
    {
      name: 'whatsappUrl',
      type: 'text',
      label: 'WhatsApp (URL)',
      validate: httpsUrl,
      admin: { description: 'Enlace de contacto de la sección Contacto de Ayuda (ej: https://wa.me/549...).' },
    },
  ],
}
