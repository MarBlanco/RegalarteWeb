/**
 * Modo Edición Guale — Contenido comercial de la Home.
 *
 * - `DEFAULT_HOME_CONTENT`: valores idénticos al diseño actual hardcodeado.
 *   La Home se ve EXACTAMENTE igual hasta que Guale guarde cambios.
 * - `getHomeContent()`: lee el global `home-content` vía Payload Local API
 *   (server) y fusiona lo guardado sobre los defaults. Si la DB no responde,
 *   devuelve los defaults (la tienda nunca se rompe).
 * - `canEditHomeContent()`: gate de rol (admin/staff). Se usa en el API
 *   route (server, contra el usuario verificado del JWT) y como gate visual
 *   en el cliente. El control real es el del servidor.
 * - `sanitizeHomeContentPatch()`: valida y blanquea el cuerpo del PUT:
 *   solo claves conocidas, strings acotados y enums válidos.
 */

export type HomeCategorySlug =
  | 'velas'
  | 'aromas'
  | 'wax-melts'
  | 'quemadores'
  | 'packs'
  | 'regalarte'

export type HomeBenefitIcon =
  | 'shipping'
  | 'packaging'
  | 'payment'
  | 'leaf'
  | 'support'

export interface HomeHeroSlide {
  image: string
  title: string
  description: string
  ctaText: string
  category: HomeCategorySlug
}

export interface HomeIntro {
  title: string
  description: string
}

export interface HomeBenefit {
  icon: HomeBenefitIcon
  title: string
  description: string
}

export interface HomeSectionMeta {
  categorySlug: HomeCategorySlug
  title: string
  description: string
}

export interface HomeContentData {
  heroSlides: HomeHeroSlide[]
  intro: HomeIntro
  benefits: HomeBenefit[]
  sections: HomeSectionMeta[]
}

export const HOME_CATEGORY_SLUGS: readonly HomeCategorySlug[] = [
  'velas',
  'aromas',
  'wax-melts',
  'quemadores',
  'packs',
  'regalarte',
]

const BENEFIT_ICONS: readonly HomeBenefitIcon[] = [
  'shipping',
  'packaging',
  'payment',
  'leaf',
  'support',
]

export const DEFAULT_HOME_CONTENT: HomeContentData = {
  heroSlides: [
    {
      image: '/assets/hero/hero-solistica-1.jpeg',
      title: 'Aromas que transforman tu casa en tu lugar feliz.',
      description:
        'Velas, home sprays, difusores y wax melts para rituales cotidianos, perfumar tus espacios y regalar bienestar.',
      ctaText: '',
      category: 'velas',
    },
    {
      image: '/assets/hero/hero-solistica-2.jpeg',
      title: 'Diseño y calidez para cada rincón del hogar.',
      description:
        'Descubrí nuestra selección artesanal creada con ceras vegetales y fragancias de alta duración.',
      ctaText: '',
      category: 'aromas',
    },
    {
      image: '/assets/hero/hero-solistica-3.jpeg',
      title: 'Esencias que perfuman tu hogar.',
      description:
        'Wax melts de cera vegetal en aromas intensos para hornillos y difusores.',
      ctaText: '',
      category: 'wax-melts',
    },
    {
      image: '/assets/hero/hero-solistica-1.jpeg',
      title: 'Calidez que se enciende.',
      description:
        'Quemadores de cerámica, vidrio y metal para disfrutar tus wax melts favoritos.',
      ctaText: '',
      category: 'quemadores',
    },
    {
      image: '/assets/hero/hero-solistica-3.jpeg',
      title: 'El regalo perfecto para momentos especiales.',
      description:
        'Packs de regalaría únicos pensados para sorprender y emocionar a quienes más querés.',
      ctaText: '',
      category: 'packs',
    },
    {
      image: '/assets/hero/hero-solistica-2.jpeg',
      title: 'Regalar también es un ritual.',
      description:
        'Cajas, packs y detalles listos para emocionar a quienes más querés.',
      ctaText: '',
      category: 'regalarte',
    },
  ],
  intro: {
    title: 'Aromas que transforman lo cotidiano.',
    description:
      'Pequeños rituales para disfrutar, regalar y hacer de tu hogar un lugar especial.',
  },
  benefits: [
    {
      icon: 'shipping',
      title: 'Envíos a todo el país',
      description: 'Recibí en la puerta de tu casa',
    },
    {
      icon: 'packaging',
      title: 'Packaging premium',
      description: 'Listo para regalar',
    },
    {
      icon: 'payment',
      title: 'Pagos seguros',
      description: 'Múltiples medios de pago',
    },
    {
      icon: 'leaf',
      title: 'Aromas que inspiran',
      description: 'Bienestar todos los días',
    },
  ],
  sections: [
    {
      categorySlug: 'velas',
      title: 'VELAS',
      description: 'Luz cálida para momentos únicos.',
    },
    {
      categorySlug: 'aromas',
      title: 'AROMAS',
      description: 'Fragancias que acompañan tu día.',
    },
    {
      categorySlug: 'wax-melts',
      title: 'WAX-MELTS',
      description: 'Esencias pequeñas que duran más.',
    },
    {
      categorySlug: 'quemadores',
      title: 'QUEMADORES',
      description: 'Belleza y calidez en cada detalle.',
    },
    {
      categorySlug: 'packs',
      title: 'PACKS',
      description: 'Regalos listos para emocionar.',
    },
    {
      categorySlug: 'regalarte',
      title: 'REGALARTE',
      description: 'Detalles que dicen todo.',
    },
  ],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown, max = 500): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, max)
}

function cleanSlide(value: unknown): HomeHeroSlide | null {
  if (!isRecord(value)) return null
  const category = value.category
  if (
    typeof category !== 'string' ||
    !(HOME_CATEGORY_SLUGS as readonly string[]).includes(category)
  ) {
    return null
  }
  return {
    image: cleanText(value.image, 500),
    title: cleanText(value.title, 200),
    description: cleanText(value.description, 600),
    ctaText: cleanText(value.ctaText, 60),
    category: category as HomeCategorySlug,
  }
}

function cleanBenefit(value: unknown): HomeBenefit | null {
  if (!isRecord(value)) return null
  const icon = value.icon
  if (
    typeof icon !== 'string' ||
    !(BENEFIT_ICONS as readonly string[]).includes(icon)
  ) {
    return null
  }
  return {
    icon: icon as HomeBenefitIcon,
    title: cleanText(value.title, 80),
    description: cleanText(value.description, 200),
  }
}

function cleanSection(value: unknown): HomeSectionMeta | null {
  if (!isRecord(value)) return null
  const categorySlug = value.categorySlug
  if (
    typeof categorySlug !== 'string' ||
    !(HOME_CATEGORY_SLUGS as readonly string[]).includes(categorySlug)
  ) {
    return null
  }
  return {
    categorySlug: categorySlug as HomeCategorySlug,
    title: cleanText(value.title, 80),
    description: cleanText(value.description, 300),
  }
}

/**
 * Valida y blanquea un patch parcial para el PUT. Devuelve `null` si el
 * cuerpo no trae ninguna clave válida. Nunca propaga claves desconocidas.
 */
export function sanitizeHomeContentPatch(
  body: unknown,
): Partial<HomeContentData> | null {
  if (!isRecord(body)) return null
  const patch: Partial<HomeContentData> = {}

  if (Array.isArray(body.heroSlides)) {
    const slides = body.heroSlides
      .map(cleanSlide)
      .filter((s): s is HomeHeroSlide => s !== null)
      .slice(0, 12)
    if (slides.length > 0) patch.heroSlides = slides
  }

  if (isRecord(body.intro)) {
    patch.intro = {
      title: cleanText(body.intro.title, 200),
      description: cleanText(body.intro.description, 600),
    }
  }

  if (Array.isArray(body.benefits)) {
    const benefits = body.benefits
      .map(cleanBenefit)
      .filter((b): b is HomeBenefit => b !== null)
      .slice(0, 8)
    if (benefits.length > 0) patch.benefits = benefits
  }

  if (Array.isArray(body.sections)) {
    const sections = body.sections
      .map(cleanSection)
      .filter((s): s is HomeSectionMeta => s !== null)
      .slice(0, 12)
    if (sections.length > 0) patch.sections = sections
  }

  return Object.keys(patch).length > 0 ? patch : null
}

/** Roles habilitados para el Modo Edición (Guale opera con rol staff/admin). */
export function canEditHomeContent(
  user: { role?: string } | null | undefined,
): boolean {
  if (!user) return false
  return user.role === 'admin' || user.role === 'staff'
}

function mergeSlides(
  stored: unknown,
  fallback: HomeHeroSlide[],
): HomeHeroSlide[] {
  if (!Array.isArray(stored) || stored.length === 0) return fallback
  const cleaned = stored
    .map(cleanSlide)
    .filter((s): s is HomeHeroSlide => s !== null)
  return cleaned.length > 0 ? cleaned : fallback
}

function mergeBenefits(
  stored: unknown,
  fallback: HomeBenefit[],
): HomeBenefit[] {
  if (!Array.isArray(stored) || stored.length === 0) return fallback
  const cleaned = stored
    .map(cleanBenefit)
    .filter((b): b is HomeBenefit => b !== null)
  return cleaned.length > 0 ? cleaned : fallback
}

function mergeSections(
  stored: unknown,
  fallback: HomeSectionMeta[],
): HomeSectionMeta[] {
  if (!Array.isArray(stored) || stored.length === 0) return fallback
  const cleaned = stored
    .map(cleanSection)
    .filter((s): s is HomeSectionMeta => s !== null)
  return cleaned.length > 0 ? cleaned : fallback
}

/**
 * Lee el global `home-content` (server) y lo fusiona sobre los defaults.
 * Ante cualquier fallo (DB caída, global vacío) devuelve los defaults para
 * que la tienda nunca se rompa.
 */
export async function getHomeContent(): Promise<HomeContentData> {
  try {
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })
    const stored = await payload.findGlobal({
      slug: 'home-content',
      depth: 0,
    })
    if (!stored || typeof stored !== 'object') return DEFAULT_HOME_CONTENT
    const record = stored as unknown as Record<string, unknown>
    const intro = isRecord(record.intro) ? record.intro : {}
    return {
      heroSlides: mergeSlides(record.heroSlides, DEFAULT_HOME_CONTENT.heroSlides),
      intro: {
        title:
          typeof intro.title === 'string' && intro.title
            ? intro.title
            : DEFAULT_HOME_CONTENT.intro.title,
        description:
          typeof intro.description === 'string' && intro.description
            ? intro.description
            : DEFAULT_HOME_CONTENT.intro.description,
      },
      benefits: mergeBenefits(record.benefits, DEFAULT_HOME_CONTENT.benefits),
      sections: mergeSections(record.sections, DEFAULT_HOME_CONTENT.sections),
    }
  } catch {
    return DEFAULT_HOME_CONTENT
  }
}
