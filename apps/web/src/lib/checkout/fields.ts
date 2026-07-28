/**
 * Checkout: tipos de campos y configuracion UI.
 * Mantener fuente de verdad para los fields del formulario.
 */

export interface FieldDef {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea'
  placeholder?: string
  required: boolean
  autoComplete?: string
  helpText?: string
}

export const CUSTOMER_FIELDS: FieldDef[] = [
  {
    id: 'customer.firstName',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Juan',
    required: true,
    autoComplete: 'given-name',
  },
  {
    id: 'customer.lastName',
    label: 'Apellido',
    type: 'text',
    placeholder: 'Pérez',
    required: true,
    autoComplete: 'family-name',
  },
  {
    id: 'customer.email',
    label: 'Email',
    type: 'email',
    placeholder: 'tu@email.com',
    required: true,
    autoComplete: 'email',
  },
  {
    id: 'customer.phone',
    label: 'Teléfono',
    type: 'tel',
    placeholder: '+54 11 5555 5555',
    required: true,
    autoComplete: 'tel',
  },
]

export const ADDRESS_FIELDS: FieldDef[] = [
  {
    id: 'address.province',
    label: 'Provincia',
    type: 'text',
    placeholder: 'Buenos Aires',
    required: true,
    autoComplete: 'address-level1',
  },
  {
    id: 'address.city',
    label: 'Ciudad',
    type: 'text',
    placeholder: 'CABA',
    required: true,
    autoComplete: 'address-level2',
  },
  {
    id: 'address.street',
    label: 'Dirección',
    type: 'text',
    placeholder: 'Av. Siempre Viva 742',
    required: true,
    autoComplete: 'street-address',
  },
  {
    id: 'address.postalCode',
    label: 'Código postal',
    type: 'text',
    placeholder: 'C1414',
    required: true,
    autoComplete: 'postal-code',
  },
]

export const NOTES_FIELDS: FieldDef[] = [
  {
    id: 'notes.message',
    label: 'Observaciones',
    type: 'textarea',
    placeholder: 'Indicaciones especiales, dedicatoria, horario de entrega preferido…',
    required: false,
  },
]
