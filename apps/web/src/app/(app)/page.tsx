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

export default async function HomePage() {
  const content = await getHomeContent()
  return (
    <>
      <HeroSlider slides={content.heroSlides} />
      <HomeBody content={content} />
    </>
  )
}
