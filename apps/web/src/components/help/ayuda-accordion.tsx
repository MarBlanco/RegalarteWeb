'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface AyudaSection {
  id: string
  title: string
  intro: string
  body: string[]
  cta?: { label: string; href: string }
}

/**
 * Contenido de ayuda. Textos generales basados en el flujo real de la app
 * (catálogo → carrito → checkout → Mercado Pago); sin precios, tiempos ni
 * políticas inventadas. Contenido provisional editable.
 */
export const AYUDA_SECTIONS: AyudaSection[] = [
  {
    id: 'como-comprar',
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
    title: 'Preguntas frecuentes',
    intro: 'Las dudas más comunes, resueltas.',
    body: [
      '¿Cómo pago mi pedido? A través de Mercado Pago al finalizar el checkout.',
      '¿Necesito una cuenta para comprar? Podés registrarte o continuar como visita según el flujo disponible.',
      '¿Dónde veo el estado de mi pedido? En tu perfil, sección de pedidos.',
      '¿Los precios incluyen impuestos? Los valores mostrados son finales salvo indicación en el checkout.',
    ],
  },
  {
    id: 'contacto',
    title: 'Contacto',
    intro: 'Estamos para ayudarte.',
    body: [
      'Escribinos por nuestras redes y te respondemos a la brevedad.',
    ],
  },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'TikTok', href: 'https://tiktok.com' },
  { label: 'Facebook', href: 'https://facebook.com' },
]

function sectionFromHash(): string | null {
  if (typeof window === 'undefined') return null
  const id = window.location.hash.replace('#', '')
  return AYUDA_SECTIONS.some((s) => s.id === id) ? id : null
}

/**
 * Acordeón de ayuda: una sola sección abierta a la vez, deep-link por hash,
 * transición suave y accesibilidad (button + aria-expanded/controls).
 */
export function AyudaAccordion() {
  const [openId, setOpenId] = useState<string | null>(null)

  const openSection = useCallback((id: string | null, scroll: boolean) => {
    setOpenId(id)
    if (id && scroll) {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
  }, [])

  useEffect(() => {
    openSection(sectionFromHash(), false)
    const onHashChange = () => {
      const id = sectionFromHash()
      openSection(id, false)
      if (id) {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [openSection])

  function toggle(id: string) {
    const next = openId === id ? null : id
    openSection(next, false)
    if (typeof window !== 'undefined') {
      const url = next ? `/ayuda#${next}` : '/ayuda'
      window.history.replaceState(null, '', url)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#EBDFD1] bg-[#FFFDF9]">
      {AYUDA_SECTIONS.map((section, index) => {
        const open = openId === section.id
        return (
          <div
            key={section.id}
            id={section.id}
            className={cn(index > 0 && 'border-t border-[#EBDFD1]')}
          >
            <h2 className="m-0">
              <button
                type="button"
                onClick={() => toggle(section.id)}
                aria-expanded={open}
                aria-controls={`ayuda-panel-${section.id}`}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[#F3EADB]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B85C33] sm:px-6"
              >
                <span className="font-serif text-lg font-normal text-[#38271D] sm:text-xl">
                  {section.title}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-colors',
                    open
                      ? 'border-[#B85C33] bg-[#B85C33] text-white'
                      : 'border-[#E5DDD1] text-[#B85C33]',
                  )}
                >
                  {open ? '−' : '+'}
                </span>
              </button>
            </h2>
            <div
              id={`ayuda-panel-${section.id}`}
              role="region"
              aria-label={section.title}
              className={cn(
                'grid transition-all duration-300 ease-in-out',
                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-2 px-4 pb-5 sm:px-6">
                  <p className="text-sm font-medium text-[#38271D]">{section.intro}</p>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#5C4A3D]">
                    {section.body.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                  {section.cta ? (
                    <Link
                      href={section.cta.href}
                      className="inline-flex items-center gap-1 pt-1 text-[13px] font-semibold text-[#B85C33] hover:text-[#9E4E2B]"
                    >
                      {section.cta.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                  {section.id === 'contacto' ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {SOCIAL_LINKS.map((s) => (
                        <Link
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center rounded-full border border-[#E5DDD1] px-4 text-xs font-medium text-[#5C4A3D] transition-colors hover:border-[#C45A37]/60 hover:text-[#C45A37]"
                        >
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
