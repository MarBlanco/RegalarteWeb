/**
 * MOCK visual para la página de detalle de producto (CAT-04).
 * Solo se usa cuando el CMS no provee esos datos. No modifica el modelo CMS.
 */

export interface MockNotes {
  salida: string
  corazon: string
  fondo: string
  ritualTitle: string
  ritualText: string
}

export const MOCK_NOTES: MockNotes = {
  salida: 'Vainilla, leche tibia, azúcar rubia',
  corazon: 'Cacao, caramelo, flor de vainilla',
  fondo: 'Sándalo, ámbar, almizcle suave',
  ritualTitle: 'Ritual de noche',
  ritualText:
    'Encendela al final del día para bajar el ritmo y crear tu momento de calma.',
}

export interface MockTab {
  id: string
  label: string
  title: string
  body: string[]
}

export const MOCK_TABS: MockTab[] = [
  {
    id: 'como-usar',
    label: 'Cómo usar',
    title: 'Cómo usar',
    body: [
      'Encendé la vela y dejala arder al menos hasta que la cera se derrita de forma pareja en toda la superficie. Así evitás que se forme túnel y prolongás su vida útil.',
      'Antes de cada uso, cortá la mecha a unos 5 mm y mantenela centrada.',
    ],
  },
  {
    id: 'detalles',
    label: 'Detalles',
    title: 'Detalles',
    body: [
      'Cera vegetal de soja, mecha 100% de algodón sin plomo y fragancias de alta calidad.',
      'Cada pieza es vertida a mano, por lo que pueden existir leves variaciones que la hacen única.',
    ],
  },
  {
    id: 'gifting',
    label: 'Gifting',
    title: 'Gifting',
    body: [
      'Presentación lista para regalar con packaging premium y papel de seda.',
      'Podés agregar una tarjeta con mensaje personalizado en el checkout.',
    ],
  },
  {
    id: 'faq',
    label: 'Preguntas frecuentes',
    title: 'Preguntas frecuentes',
    body: [
      '¿Cuánto dura encendida? Entre 40 y 45 horas según el tamaño, con un uso correcto.',
      '¿La cera es apta para veganos? Sí, es 100% cera vegetal de soja.',
      '¿Hacen envíos a todo el país? Sí, con seguimiento en cada pedido.',
    ],
  },
]

export interface MockFeature {
  title: string
  text: string
}

export const MOCK_FEATURES: MockFeature[] = [
  { title: 'Duración aprox.', text: '40 a 45 horas' },
  { title: 'Cera 100% vegetal', text: 'Sin parafina' },
  { title: 'Mecha de algodón', text: 'Sin plomo' },
  { title: 'Hecho en Argentina', text: 'Con amor' },
]
