import type { GlobalConfig } from 'payload'

/**
 * Modo Edición — Contenido editorial global de las pestañas del PDP.
 *
 * Las pestañas "Cómo usar", "Detalles", "Gifting" y "Preguntas frecuentes"
 * son contenido editorial ÚNICO (igual para todos los productos). Antes
 * vivían hardcodeadas en `pdp-mock.ts`; ahora ese archivo aporta solo los
 * valores por defecto (ver `src/lib/pdp-content.ts`) y este global persiste
 * los cambios de Guale. Sin duplicar datos por producto.
 *
 * Acceso (mismo patrón que HomeContent/CommerceSettings):
 *   - read:   público (el PDP debe leerlo para renderizar).
 *   - update: únicamente admin/staff (el PUT revalida JWT y rol).
 */
export const PdpContent: GlobalConfig = {
  slug: 'pdp-content',
  label: 'Contenido editorial del PDP',
  admin: {
    group: 'Contenido',
    description:
      'Textos editoriales de las pestañas del PDP (Modo Edición Guale). Modificable únicamente por admin y staff.',
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
      name: 'comoUsar',
      type: 'textarea',
      label: 'Cómo usar (párrafos separados por línea en blanco)',
    },
    {
      name: 'detalles',
      type: 'textarea',
      label: 'Detalles (párrafos separados por línea en blanco)',
    },
    {
      name: 'gifting',
      type: 'textarea',
      label: 'Gifting (párrafos separados por línea en blanco)',
    },
    {
      name: 'faq',
      type: 'textarea',
      label: 'Preguntas frecuentes (párrafos separados por línea en blanco)',
    },
  ],
}
