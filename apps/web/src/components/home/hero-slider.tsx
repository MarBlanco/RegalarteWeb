'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  const [isPlaying, setIsPlaying] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
  }, [])

  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      startAutoSlide()
    } else {
      stopAutoSlide()
    }
    return () => stopAutoSlide()
  }, [isPlaying, startAutoSlide, stopAutoSlide])

  const handleIndicatorClick = (index: number) => {
    setCurrent(index)
  }

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }

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

      {/* Navigation arrows */}
      <div className="absolute inset-0 z-20 flex items-center justify-between px-4 sm:px-10 pointer-events-none">
        <button
          onClick={handlePrev}
          className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Diapositiva anterior"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Diapositiva siguiente"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Slider indicators and play/pause control */}
      <div className="absolute bottom-6 left-1/2 z-20 flex flex-col items-center gap-4 -translate-x-1/2">
        <div className="flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleIndicatorClick(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                current === index ? 'w-8 bg-white' : 'w-2.5 bg-white/50'
              }`}
              aria-label={`Ir a diapositiva ${index + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => setIsPlaying((prev) => !prev)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label={isPlaying ? 'Pausar auto-desplazamiento' : 'Reanudar auto-desplazamiento'}
          aria-pressed={!isPlaying}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  )
}