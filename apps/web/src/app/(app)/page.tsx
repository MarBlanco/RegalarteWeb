import type { Metadata } from 'next'
import { HomeBody } from '@/components/home/home-body'
import { HeroSlider } from '@/components/home/hero-slider'
import { getHomeContent } from '@/lib/home-content'

export const metadata: Metadata = {
  title: 'Inicio',
  description:
    'Encontrá el regalo perfecto. Ideas únicas para cada persona, ocasión y presupuesto. Universo Solística y Regalarte.',
  alternates: {
    canonical: '/',
  },
}

/**
 * La Home se renderiza por pedido: sus datos (productos, categorías) ya salen
 * del caché de datos con tags, así que no pierde rendimiento, y el Modo
 * Edición puede refrescarla al instante. Prerenderizada, el refresco tras
 * guardar recibía la versión anterior del RSC hasta recargar (F5).
 */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const content = await getHomeContent()
  return (
    <>
      <HeroSlider slides={content.heroSlides} />
      <HomeBody content={content} />
    </>
  )
}
