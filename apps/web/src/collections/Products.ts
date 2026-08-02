import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    description:
      'Catálogo único de productos REGALARTE. No existen catálogos paralelos para mayoristas: el flag isWholesaleAvailable define qué productos aplican precio B2B.',
    defaultColumns: [
      'title',
      'category',
      'price',
      'stock',
      'isSolistica',
      'isWholesaleAvailable',
      'active',
      'featured',
    ],
    group: 'Catálogo',
    listSearchableFields: ['title', 'slug', 'sku'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Título',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Descripción',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          label: 'Precio minorista',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'compareAtPrice',
          type: 'number',
          min: 0,
          label: 'Precio tachado',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'wholesalePrice',
          type: 'number',
          min: 0,
          label: 'Precio mayorista',
          admin: {
            width: '50%',
            description: 'Si está vacío y el producto mayorista, no aplica precio B2B.',
          },
        },
        {
          name: 'isWholesaleAvailable',
          type: 'checkbox',
          defaultValue: false,
          label: 'Disponible mayorista',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sku',
          type: 'text',
          label: 'SKU',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'stock',
          type: 'number',
          min: 0,
          defaultValue: 0,
          label: 'Stock',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'active',
          type: 'checkbox',
          defaultValue: true,
          label: 'Activo',
          admin: {
            width: '25%',
          },
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          label: 'Destacado',
          admin: {
            width: '25%',
          },
        },
        {
          name: 'isSolistica',
          type: 'checkbox',
          defaultValue: false,
          label: 'Universo Solística',
          admin: {
            width: '25%',
            description:
              'Marca el producto como parte del universo Solística. No es un catálogo paralelo: sigue siendo un producto REGALARTE.',
          },
        },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 0,
          label: 'Orden',
          admin: {
            width: '25%',
          },
        },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      required: true,
      label: 'Categoría',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'product-tags',
      hasMany: true,
      label: 'Tags',
    },
    {
      name: 'attributes',
      type: 'relationship',
      relationTo: 'product-attributes',
      hasMany: true,
      label: 'Atributos',
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'product-images',
      hasMany: true,
      label: 'Imágenes',
    },
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO · Título',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'SEO · Descripción',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
