import type { GlobalConfig } from 'payload'

/**
 * Modo Edición Guale — Contenido comercial de la Home.
 *
 * Singleton (Global) con los textos e imágenes comerciales editables de la
 * Home: slides del Hero, beneficios, intro y títulos/descripciones de las
 * secciones por categoría. Los valores por defecto viven en
 * `src/lib/home-content.ts` (idénticos al diseño actual); este global solo
 * persiste los cambios que Guale guarda desde el Modo Edición.
 *
 * Acceso (mismo patrón que CommerceSettings y Users):
 *   - read:   público (la storefront debe leerlo para renderizar la Home).
 *   - update: únicamente admin/staff. La ruta `/api/home-content` (PUT)
 *             revalida el rol server-side vía `payload.auth()` con el JWT;
 *             ocultar los botones en el cliente NO es el control de seguridad.
 *
 * Alcance: SOLO Home. No se exponen configuraciones técnicas, usuarios,
 * permisos, credenciales ni integraciones.
 */
export const HomeContent: GlobalConfig = {
  slug: 'home-content',
  label: 'Contenido de la Home',
  admin: {
    group: 'Contenido',
    description:
      'Textos e imágenes comerciales de la Home (Modo Edición Guale). Modificable únicamente por admin y staff.',
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
      name: 'heroSlides',
      type: 'array',
      label: 'Slides del Hero',
      minRows: 1,
      admin: {
        description: 'Imagen, título, descripción y texto del botón de cada slide.',
      },
      fields: [
        {
          name: 'image',
          type: 'text',
          required: true,
          label: 'Imagen (URL o ruta)',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Título',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Descripción',
        },
        {
          name: 'ctaText',
          type: 'text',
          label: 'Texto del botón',
          admin: {
            description: 'Vacío = texto derivado de la categoría ("EXPLORAR ...").',
          },
        },
        {
          name: 'category',
          type: 'select',
          required: true,
          label: 'Categoría destino',
          options: [
            { label: 'Velas', value: 'velas' },
            { label: 'Aromas', value: 'aromas' },
            { label: 'Wax-Melts', value: 'wax-melts' },
            { label: 'Quemadores', value: 'quemadores' },
            { label: 'Packs', value: 'packs' },
            { label: 'Regalarte', value: 'regalarte' },
          ],
        },
      ],
    },
    {
      name: 'intro',
      type: 'group',
      label: 'Intro debajo del Hero',
      fields: [
        { name: 'title', type: 'text', label: 'Título' },
        { name: 'description', type: 'textarea', label: 'Descripción' },
      ],
    },
    {
      name: 'benefits',
      type: 'array',
      label: 'Beneficios',
      admin: {
        description: 'Títulos y textos de la tira de beneficios de la Home.',
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          label: 'Ícono',
          options: [
            { label: 'Envíos', value: 'shipping' },
            { label: 'Packaging', value: 'packaging' },
            { label: 'Pagos', value: 'payment' },
            { label: 'Hoja / Bienestar', value: 'leaf' },
            { label: 'Atención', value: 'support' },
          ],
        },
        { name: 'title', type: 'text', required: true, label: 'Título' },
        { name: 'description', type: 'textarea', label: 'Texto' },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Secciones por categoría',
      admin: {
        description: 'Título y texto comercial de cada sección de la Home.',
      },
      fields: [
        {
          name: 'categorySlug',
          type: 'select',
          required: true,
          label: 'Categoría',
          options: [
            { label: 'Velas', value: 'velas' },
            { label: 'Aromas', value: 'aromas' },
            { label: 'Wax-Melts', value: 'wax-melts' },
            { label: 'Quemadores', value: 'quemadores' },
            { label: 'Packs', value: 'packs' },
            { label: 'Regalarte', value: 'regalarte' },
          ],
        },
        { name: 'title', type: 'text', required: true, label: 'Título' },
        { name: 'description', type: 'textarea', label: 'Texto' },
      ],
    },
  ],
}
