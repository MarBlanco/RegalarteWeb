import type { Metadata } from 'next'
import { HomeBody } from '@/components/home/home-body'
import { HeroSlider } from '@/components/home/hero-slider'

export const metadata: Metadata = {
  title: 'Inicio',
  description:
    'Encontrá el regalo perfecto. Ideas únicas para cada persona, ocasión y presupuesto. Universo Solística y Regalarte.',
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <HomeBody />
    </>
  )
}
