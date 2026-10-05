import type { GlobalConfig } from 'payload'

/**
 * Contenido de la página de Ayuda (/ayuda y enlaces del pie de página).
 *
 * Antes hardcodeado en `components/help/ayuda-data.ts`; esos valores siguen
 * siendo los defaults: sin secciones guardadas la página no cambia.
 *
 * Acceso: lectura pública; edición admin/staff.
 */
export const AyudaContent: GlobalConfig = {
  slug: 'ayuda-content',
  label: 'Contenido de Ayuda',
  admin: {
    group: 'Contenido',
    description:
      'Secciones de la página de Ayuda. Sin secciones guardadas se usa el contenido por defecto.',
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
    {
      name: 'sections',
      type: 'array',
      label: 'Secciones',
      labels: { singular: 'Sección', plural: 'Secciones' },
      fields: [
        {
          name: 'sectionId',
          type: 'text',
          required: true,
          label: 'Identificador (ancla)',
          admin: {
            description: 'Minúsculas, números y guiones. Se usa en /ayuda#identificador.',
          },
          validate: (value: unknown) =>
            typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
              ? true
              : 'Usá minúsculas, números y guiones (ej: como-comprar)',
        },
        { name: 'title', type: 'text', required: true, label: 'Título' },
        { name: 'intro', type: 'text', label: 'Introducción' },
        {
          name: 'body',
          type: 'array',
          label: 'Párrafos',
          labels: { singular: 'Párrafo', plural: 'Párrafos' },
          fields: [
            { name: 'text', type: 'textarea', required: true, label: 'Texto' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'ctaLabel', type: 'text', label: 'Botón: texto' },
            {
              name: 'ctaHref',
              type: 'text',
              label: 'Botón: destino',
              admin: { description: 'Ruta interna, ej: /catalogo' },
            },
          ],
        },
      ],
    },
  ],
}
