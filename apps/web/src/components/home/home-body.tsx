import React from 'react'
import Link from 'next/link'
import { ProductPlaceholder } from './product-placeholder'

export function SunEmblem({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  )
}

export function DecorativeDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="h-[1px] w-8 sm:w-10 bg-[#C45A37]/50" />
      <span className="h-1.5 w-1.5 rotate-45 bg-[#C45A37]" />
      <span className="h-[1px] w-8 sm:w-10 bg-[#C45A37]/50" />
    </div>
  )
}

export interface HomeProduct {
  id: string
  title: string
  subtitle?: string
  price: string
  slug: string
  category: 'velas' | 'aromas' | 'wax-melts' | 'quemadores' | 'packs' | 'regalarte'
}

export interface HomeCategoryData {
  id: string
  title: string
  description: string
  categorySlug: 'velas' | 'aromas' | 'wax-melts' | 'quemadores' | 'packs' | 'regalarte'
  products: HomeProduct[]
}

export function CategoryProductCard({ product }: { product: HomeProduct }) {
  return (
    <div className="group flex flex-col">
      <Link href={`/catalogo/${product.slug}`} className="block">
        <ProductPlaceholder category={product.category} title={product.title} />
      </Link>
      <div className="mt-3 flex flex-col text-left">
        <Link href={`/catalogo/${product.slug}`}>
          <h3 className="font-serif text-sm sm:text-base font-normal text-[#38271D] group-hover:text-[#C45A37] transition-colors leading-snug">
            {product.title}
          </h3>
        </Link>
        {product.subtitle ? (
          <p className="text-xs sm:text-sm text-[#8A786A] mt-0.5 min-h-[1.25rem]">
            {product.subtitle}
          </p>
        ) : (
          <div className="min-h-[1.25rem]" />
        )}
        <p className="text-sm sm:text-base font-bold text-[#C45A37] mt-1">
          {product.price}
        </p>
      </div>
    </div>
  )
}

export function HomeCategorySection({ data }: { data: HomeCategoryData }) {
  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
        {/* Left Column - Category Summary */}
        <div className="w-full lg:w-[220px] xl:w-[260px] flex-shrink-0 flex flex-col items-start text-left">
          <h2 className="font-serif text-2xl sm:text-3xl font-normal uppercase tracking-wider text-[#38271D]">
            {data.title}
          </h2>
          <DecorativeDivider className="my-3" />
          <p className="text-sm sm:text-base text-[#7A6A5D] leading-relaxed">
            {data.description}
          </p>
          <Link
            href={`/catalogo?category=${data.categorySlug}`}
            className="inline-flex items-center text-xs sm:text-sm font-medium tracking-wider text-[#C45A37] hover:text-[#9E4024] uppercase mt-4 sm:mt-6 gap-1 transition-colors"
          >
            VER COLECCIÓN <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Right Column - 4 Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 flex-1">
          {data.products.map((product) => (
            <CategoryProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function EditorialSeparator({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="w-full bg-[#EFE7DD] py-12 sm:py-16 px-4 my-6 sm:my-10 relative overflow-hidden text-center">
      {/* Subtle Leaf Pattern Background Effect */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#38271D_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 flex flex-col items-center">
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-normal text-[#38271D] leading-snug tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-[#7A6A5D] mt-2 font-normal">
            {subtitle}
          </p>
        )}
        <DecorativeDivider className="mt-4 justify-center" />
      </div>
    </div>
  )
}

const CATEGORIES_DATA: HomeCategoryData[] = [
  {
    id: 'velas',
    title: 'VELAS',
    categorySlug: 'velas',
    description: 'Luz cálida para momentos únicos.',
    products: [
      {
        id: 'vela-1',
        title: 'Vela Vainilla & Ámbar',
        subtitle: 'Cera vegetal',
        price: '$3.990,00',
        slug: 'vela-vainilla-ambar',
        category: 'velas',
      },
      {
        id: 'vela-2',
        title: 'Vela Sándalo & Cedro',
        subtitle: 'Cera vegetal',
        price: '$3.990,00',
        slug: 'vela-sandalo-cedro',
        category: 'velas',
      },
      {
        id: 'vela-3',
        title: 'Vela Bubble Canela',
        subtitle: 'Cera vegetal',
        price: '$3.990,00',
        slug: 'vela-bubble-canela',
        category: 'velas',
      },
      {
        id: 'vela-4',
        title: 'Vela Lavanda & Albahaca',
        subtitle: 'Cera vegetal',
        price: '$3.990,00',
        slug: 'vela-lavanda-albahaca',
        category: 'velas',
      },
    ],
  },
  {
    id: 'aromas',
    title: 'AROMAS',
    categorySlug: 'aromas',
    description: 'Fragancias que acompañan tu día.',
    products: [
      {
        id: 'aroma-1',
        title: 'Difusor Lino & Algodón',
        subtitle: '200 ml',
        price: '$4.590,00',
        slug: 'difusor-lino-algodon',
        category: 'aromas',
      },
      {
        id: 'aroma-2',
        title: 'Difusor Vainilla & Ambar',
        subtitle: '200 ml',
        price: '$4.590,00',
        slug: 'difusor-vainilla-ambar',
        category: 'aromas',
      },
      {
        id: 'aroma-3',
        title: 'Bruma Textil Lino & Ambar',
        subtitle: '200 ml',
        price: '$4.590,00',
        slug: 'bruma-textil-lino-ambar',
        category: 'aromas',
      },
      {
        id: 'aroma-4',
        title: 'Bruma Textil Jazmin & Limón',
        subtitle: '200 ml',
        price: '$3.290,00',
        slug: 'bruma-textil-jazmin-limon',
        category: 'aromas',
      },
    ],
  },
  {
    id: 'wax-melts',
    title: 'WAX-MELTS',
    categorySlug: 'wax-melts',
    description: 'Esencias pequeñas que duran más.',
    products: [
      {
        id: 'wax-1',
        title: 'Wax Melts Vainilla & Ambar',
        subtitle: '6 unidades',
        price: '$2.990,00',
        slug: 'wax-melts-vainilla-ambar',
        category: 'wax-melts',
      },
      {
        id: 'wax-2',
        title: 'Wax Melts Rosas & Té Blanco',
        subtitle: '6 unidades',
        price: '$2.990,00',
        slug: 'wax-melts-rosas-te-blanco',
        category: 'wax-melts',
      },
      {
        id: 'wax-3',
        title: 'Wax Melts Lavanda',
        subtitle: '6 unidades',
        price: '$2.990,00',
        slug: 'wax-melts-lavanda',
        category: 'wax-melts',
      },
      {
        id: 'wax-4',
        title: 'Wax Melts Sándalo & Cedro',
        subtitle: '5 unidades',
        price: '$2.990,00',
        slug: 'wax-melts-sandalo-cedro',
        category: 'wax-melts',
      },
    ],
  },
  {
    id: 'quemadores',
    title: 'QUEMADORES',
    categorySlug: 'quemadores',
    description: 'Belleza y calidez en cada detalle.',
    products: [
      {
        id: 'quemador-1',
        title: 'Quemador Cerámica Arena',
        price: '$5.190,00',
        slug: 'quemador-ceramica-arena',
        category: 'quemadores',
      },
      {
        id: 'quemador-2',
        title: 'Quemador Cerámica Rosa',
        price: '$5.190,00',
        slug: 'quemador-ceramica-rosa',
        category: 'quemadores',
      },
      {
        id: 'quemador-3',
        title: 'Quemador Cerámica Blanco',
        price: '$5.190,00',
        slug: 'quemador-ceramica-blanco',
        category: 'quemadores',
      },
      {
        id: 'quemador-4',
        title: 'Quemador Vidrio Ámbar',
        price: '$5.190,00',
        slug: 'quemador-vidrio-ambar',
        category: 'quemadores',
      },
    ],
  },
  {
    id: 'packs',
    title: 'PACKS',
    categorySlug: 'packs',
    description: 'Regalos listos para emocionar.',
    products: [
      {
        id: 'pack-1',
        title: 'Pack Relax',
        subtitle: 'Vela + Difusor',
        price: '$8.990,00',
        slug: 'pack-relax',
        category: 'packs',
      },
      {
        id: 'pack-2',
        title: 'Pack Home',
        subtitle: 'Bruma + Vela',
        price: '$7.990,00',
        slug: 'pack-home',
        category: 'packs',
      },
      {
        id: 'pack-3',
        title: 'Pack Completo',
        subtitle: 'Vela + Bruma + Wax Melts',
        price: '$10.990,00',
        slug: 'pack-completo',
        category: 'packs',
      },
      {
        id: 'pack-4',
        title: 'Pack Regalo',
        subtitle: 'Difusor + Vela',
        price: '$7.990,00',
        slug: 'pack-regalo',
        category: 'packs',
      },
    ],
  },
  {
    id: 'regalarte',
    title: 'REGALARTE',
    categorySlug: 'regalarte',
    description: 'Detalles que dicen todo.',
    products: [
      {
        id: 'regalarte-1',
        title: 'Caja Regalo Clásica',
        price: '$2.490,00',
        slug: 'caja-regalo-clasica',
        category: 'regalarte',
      },
      {
        id: 'regalarte-2',
        title: 'Tarjeta de Regalo',
        price: '$1.000,00',
        slug: 'tarjeta-de-regalo',
        category: 'regalarte',
      },
      {
        id: 'regalarte-3',
        title: 'Envoltorio Premium',
        price: '$1.290,00',
        slug: 'envoltorio-premium',
        category: 'regalarte',
      },
      {
        id: 'regalarte-4',
        title: 'Bolsa de Regalo',
        price: '$759,00',
        slug: 'bolsa-de-regalo',
        category: 'regalarte',
      },
    ],
  },
]

export function HomeBody() {
  return (
    <div className="w-full bg-[#F9F5F0] text-[#38271D]">
      {/* Intro Section below Hero */}
      <section className="py-12 sm:py-16 text-center px-4 max-w-4xl mx-auto">
        <div className="flex justify-center mb-3">
          <SunEmblem className="w-7 h-7 text-[#C45A37]" />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal text-[#38271D] leading-snug tracking-tight">
          Aromas que transforman lo cotidiano.
        </h2>
        <DecorativeDivider className="my-4 justify-center mx-auto" />
        <p className="text-sm sm:text-base text-[#7A6A5D] font-normal max-w-2xl mx-auto">
          Pequeños rituales para disfrutar, regalar y hacer de tu hogar un
          lugar especial.
        </p>
      </section>

      {/* Category 1: VELAS */}
      <HomeCategorySection data={CATEGORIES_DATA[0]} />

      {/* Editorial Separator 1 */}
      <EditorialSeparator title="Una luz encendida cambia el momento." />

      {/* Category 2: AROMAS */}
      <HomeCategorySection data={CATEGORIES_DATA[1]} />

      {/* Editorial Separator 2 */}
      <EditorialSeparator
        title="El perfume también cuenta historias."
        subtitle="Encontrá el aroma que querés que habite tus espacios."
      />

      {/* Category 3: WAX-MELTS */}
      <HomeCategorySection data={CATEGORIES_DATA[2]} />

      {/* Editorial Separator 3 */}
      <EditorialSeparator title="El ritual empieza cuando encendés." />

      {/* Category 4: QUEMADORES */}
      <HomeCategorySection data={CATEGORIES_DATA[3]} />

      {/* Editorial Separator 4 */}
      <EditorialSeparator
        title="Hay momentos que merecen algo más."
        subtitle="Combinaciones pensadas para regalar, compartir o disfrutar."
      />

      {/* Category 5: PACKS */}
      <HomeCategorySection data={CATEGORIES_DATA[4]} />

      {/* Editorial Separator 5 */}
      <EditorialSeparator title="Y cuando el aroma se convierte en regalo..." />

      {/* Category 6: REGALARTE */}
      <HomeCategorySection data={CATEGORIES_DATA[5]} />

      {/* Closing Ritual Banner */}
      <section className="py-16 sm:py-20 px-4 text-center bg-[#F4EDE4] border-t border-[#E5DDD1]">
        <div className="flex justify-center mb-3">
          <SunEmblem className="w-8 h-8 text-[#C45A37]" />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#38271D] tracking-tight">
          Hacé de lo cotidiano un ritual.
        </h2>
        <p className="text-sm sm:text-base text-[#7A6A5D] mt-2 font-normal">
          Solística · aromas, hogar y momentos para disfrutar.
        </p>
      </section>
    </div>
  )
}
