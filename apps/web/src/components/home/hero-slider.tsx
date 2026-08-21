'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

const slides = [
  {
    id: 1,
    image: '/assets/hero/hero-solistica-1.jpeg',
    title: 'Aromas que transforman tu casa en tu lugar feliz.',
    description: 'Velas, home sprays, difusores y wax melts para rituales cotidianos, perfumar tus espacios y regalar bienestar.',
    ctaText: 'Ver colección',
    ctaHref: '/solistica',
  },
  {
    id: 2,
    image: '/assets/hero/hero-solistica-2.jpeg',
    title: 'Diseño y calidez para cada rincón del hogar.',
    description: 'Descubrí nuestra selección artesanal creada con ceras vegetales y fragancias de alta duración.',
    ctaText: 'Explorar catálogo',
    ctaHref: '/catalogo',
  },
  {
    id: 3,
    image: '/assets/hero/hero-solistica-3.jpeg',
    title: 'El regalo perfecto para momentos especiales.',
    description: 'Packs de regalaría únicos pensados para sorprender y emocionar a quienes más querés.',
    ctaText: 'Ver packs',
    ctaHref: '/catalogo?category=packs',
  },
]

export function HeroSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-[560px] w-full overflow-hidden sm:h-[600px] lg:h-[650px] bg-[#2C221E]">
      <AnimatePresence>
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${slides[current].image})` }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-10 flex items-center">
        <div className="w-full px-6 sm:px-10 lg:pl-[6.8vw] lg:pr-0">
          <div className="relative max-w-[500px] min-h-[320px] sm:min-h-[350px]">
            <AnimatePresence>
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col justify-center"
              >
                <span aria-hidden className="mb-6 block h-[2px] w-[48px] bg-primary" />
                <h1 className="font-serif text-[44px] font-normal leading-[1.05] tracking-tight text-white sm:text-[48px] lg:text-[54px]">
                  {slides[current].title}
                </h1>
                <p className="mt-6 max-w-[500px] text-[17px] leading-[1.5] text-white sm:text-[18px]">
                  {slides[current].description}
                </p>
                <Button
                  asChild
                  className="mt-8 h-[52px] w-[190px] uppercase tracking-wider"
                >
                  <Link href={slides[current].ctaHref}>{slides[current].ctaText}</Link>
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slider indicators */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              current === index ? 'w-8 bg-white' : 'w-2.5 bg-white/50'
            }`}
            aria-label={`Ir a diapositiva ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
