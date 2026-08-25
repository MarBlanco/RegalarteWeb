'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Arrow Right Icon for Newsletter
const ArrowRightIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 5 19" />
  </svg>
)

// Location Pin Icon
const LocationPinIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

// Social Media Icons
const InstagramIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const TikTokIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)

const FacebookIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-3V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

// Título de columna serif editorial (sin ornamentos)
function FooterColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-serif text-lg sm:text-xl font-normal uppercase tracking-[0.18em] text-white">
      {children}
    </h3>
  )
}

// Red social: icono en círculo + nombre debajo
function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group flex flex-col items-center gap-2.5"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C45A37]/50 text-[#F4EDE4] transition-colors duration-200 group-hover:border-[#C45A37] group-hover:text-[#C45A37]">
        {children}
      </span>
      <span className="text-sm text-[#C4B8A8] transition-colors duration-200 group-hover:text-white">
        {label}
      </span>
    </a>
  )
}

export function Footer() {
  return (
    <>
      {/* NEWSLETTER — compacto */}
      <section className="bg-[#F4EDE4] border-b border-[#E5DDD1] py-8 sm:py-10">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#38271D] tracking-tight">
              INSPIRACIÓN PARA TU HOGAR
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#7A6A5D] font-normal">
              Recibí novedades, nuevos aromas y lanzamientos exclusivos.
            </p>
            <form
              className="mt-5 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex-1">
                <label htmlFor="newsletter-email" className="sr-only">
                  Tu email
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="Ingresá tu email"
                  className="h-11 rounded-lg border bg-background px-4 text-sm"
                />
              </div>
              <Button
                type="submit"
                aria-label="Suscribirse"
                className="h-11 px-7 bg-primary text-primary-foreground font-medium text-sm whitespace-nowrap"
              >
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER OSCURO — compacto */}
      <footer className="bg-[#2C221E] text-[#F4EDE4]">
        <div className="container py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#4A3D31]">
            {/* COLUMN 1: MARCA */}
            <div className="flex flex-col items-center text-center lg:pr-10">
              <Link
                href="/"
                aria-label="Solística - Inicio"
                className="font-serif text-2xl sm:text-[26px] font-normal uppercase tracking-[0.2em] text-white"
              >
                SOLÍSTICA
              </Link>
              <p className="mt-3 text-sm sm:text-base text-[#C4B8A8] leading-relaxed max-w-[250px]">
                Aromas que transforman tu casa en tu lugar feliz.
              </p>
              <span aria-hidden="true" className="mt-4 block h-px w-40 bg-[#F4EDE4]/15" />
              <div className="mt-3 flex items-center gap-2 text-sm text-[#C4B8A8]">
                <LocationPinIcon className="w-4 h-4 flex-shrink-0" />
                <span>Colón, Entre Ríos · Argentina</span>
              </div>
            </div>

            {/* COLUMN 2: COMPRAR */}
            <div className="lg:px-10">
              <FooterColumnTitle>COMPRAR</FooterColumnTitle>
              <ul className="mt-4 space-y-2.5">
                {[
                  { href: '/catalogo?category=velas', label: 'Velas' },
                  { href: '/catalogo?category=aromas', label: 'Aromas' },
                  { href: '/catalogo?category=wax-melts', label: 'Wax-Melts' },
                  { href: '/catalogo?category=quemadores', label: 'Quemadores' },
                  { href: '/catalogo?category=packs', label: 'Packs' },
                  { href: '/catalogo?category=regalarte', label: 'Regalarte' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base text-[#C4B8A8] hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 3: AYUDA */}
            <div className="lg:px-10">
              <FooterColumnTitle>AYUDA</FooterColumnTitle>
              <ul className="mt-4 space-y-2.5">
                {[
                  { href: '/como-comprar', label: 'Cómo comprar' },
                  { href: '/envios', label: 'Envíos' },
                  { href: '/devoluciones', label: 'Cambios y devoluciones' },
                  { href: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
                  { href: '/contacto', label: 'Contacto' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base text-[#C4B8A8] hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 4: SEGUINOS */}
            <div className="lg:pl-10">
              <FooterColumnTitle>SEGUINOS</FooterColumnTitle>
              <div className="mt-4 flex items-start gap-6 sm:gap-8">
                <SocialLink href="https://instagram.com" label="Instagram">
                  <InstagramIcon />
                </SocialLink>
                <SocialLink href="https://tiktok.com" label="TikTok">
                  <TikTokIcon className="w-5 h-5" />
                </SocialLink>
                <SocialLink href="https://facebook.com" label="Facebook">
                  <FacebookIcon />
                </SocialLink>
              </div>
            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="mt-8 border-t border-[#3D3228] pt-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[#9A8A7A] text-center sm:text-left">
                &copy; 2026 Solística · Todos los derechos reservados
              </p>
              <div className="text-center sm:text-right">
                <p className="text-xs text-[#9A8A7A]">Diseño y desarrollo web</p>
                <p className="mt-0.5 text-sm font-bold uppercase tracking-wide text-[#F4EDE4]">
                  MARTIN BLANCO
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}