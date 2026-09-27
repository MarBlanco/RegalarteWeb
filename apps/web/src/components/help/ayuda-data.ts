/**
 * Contenido de ayuda. Textos generales basados en el flujo real de la app
 * (catálogo → carrito → checkout → Mercado Pago); sin precios, tiempos ni
 * políticas inventadas.
 */
export interface AyudaSection {
  id: string
  number: string
  title: string
  intro: string
  body: string[]
  cta?: { label: string; href: string }
}

export const AYUDA_SECTIONS: AyudaSection[] = [
  {
    id: 'como-comprar',
    number: '01',
    title: 'Cómo comprar',
    intro: 'Comprar es simple y seguro.',
    body: [
      'Explorá el catálogo y elegí tus productos por categoría.',
      'Agregalos al carrito con el botón “Agregar al carrito”.',
      'Revisá tu pedido en el carrito y ajustá cantidades si lo necesitás.',
      'Completá tus datos y dirección en el checkout.',
      'Confirmá el pedido y continuá al pago con Mercado Pago.',
    ],
    cta: { label: 'Ir al catálogo', href: '/catalogo' },
  },
  {
    id: 'envios',
    number: '02',
    title: 'Envíos',
    intro: 'Recibí tu pedido donde estés.',
    body: [
      'Hacemos envíos a todo el país.',
      'El costo y los plazos se calculan en el checkout según tu dirección.',
      'Te pediremos los datos de envío al confirmar el pedido.',
    ],
  },
  {
    id: 'cambios-devoluciones',
    number: '03',
    title: 'Cambios y devoluciones',
    intro: 'Queremos que quedes conforme con tu compra.',
    body: [
      'Si tu pedido llega con algún inconveniente, escribinos desde Contacto.',
      'Contanos tu número de pedido y qué ocurrió.',
      'Te responderemos con los pasos a seguir.',
    ],
    cta: { label: 'Ir a Contacto', href: '/ayuda#contacto' },
  },
  {
    id: 'preguntas-frecuentes',
    number: '04',
    title: 'Preguntas frecuentes',
    intro: 'Las dudas más comunes, resueltas.',
    body: [
      '¿Cómo pago mi pedido? A través de Mercado Pago al finalizar el checkout.',
      '¿Necesito una cuenta para comprar? Creá tu cuenta o iniciá sesión para comprar y seguir tus pedidos.',
      '¿Dónde veo el estado de mi pedido? En Mis compras, desde el menú de tu cuenta.',
      'Consultá el total final en el checkout antes de confirmar tu pedido.',
    ],
  },
  {
    id: 'contacto',
    number: '05',
    title: 'Contacto',
    intro: 'Estamos para ayudarte.',
    body: [
      'Escribinos por nuestras redes y te respondemos a la brevedad.',
    ],
  },
]
