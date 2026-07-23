import type { CollectionConfig } from 'payload'

export const Attributes: CollectionConfig = {
  slug: 'attributes',
  admin: {
    useAsTitle: 'name',
    group: 'Catálogo',
    defaultColumns: ['name', 'type', 'isFilterable', 'group'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'staff',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'staff',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'text',
      options: [
        { label: 'Texto', value: 'text' },
        { label: 'Selección', value: 'select' },
        { label: 'Número', value: 'number' },
        { label: 'Booleano', value: 'boolean' },
      ],
      label: 'Tipo',
    },
    {
      name: 'values',
      type: 'array',
      label: 'Valores permitidos',
      admin: {
        condition: (data) => data?.type === 'select',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
        },
      ],
    },
    {
      name: 'unit',
      type: 'text',
      label: 'Unidad',
      admin: {
        description: 'Ej: cm, kg, ml, unidades',
      },
    },
    {
      name: 'isRequired',
      type: 'checkbox',
      defaultValue: false,
      label: 'Obligatorio',
    },
    {
      name: 'isFilterable',
      type: 'checkbox',
      defaultValue: true,
      label: 'Filtruble',
      admin: {
        description: 'Mostrar como filtro en catálogo',
      },
    },
    {
      name: 'group',
      type: 'text',
      label: 'Grupo',
      admin: {
        description: 'Agrupación visual (ej: Dimensiones, Material, Ocasion)',
      },
    },
  ],
  timestamps: true,
}