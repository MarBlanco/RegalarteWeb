'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CartTrigger } from '@/components/cart/cart-trigger'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo?category=velas', label: 'Velas' },
  { href: '/catalogo?category=aromas', label: 'Aromas' },
  { href: '/catalogo?category=wax-melts', label: 'Wax-Melts' },
  { href: '/catalogo?category=quemadores', label: 'Quemadores' },
  { href: '/catalogo?category=packs', label: 'Packs' },
  { href: '/catalogo?category=regalarte', label: 'Regalarte', accent: true },
]

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between gap-4 px-4 py-2 md:py-2.5 lg:py-3 min-h-[44px] md:min-h-[48px] lg:min-h-[52px]">
        <Link
          href="/"
          className="flex items-center flex-shrink-0 min-w-0"
          aria-label="Solística - Inicio"
        >
          <span className="font-serif font-medium tracking-wider uppercase text-foreground whitespace-nowrap text-center"
                style={{ fontSize: 'clamp(0.75rem, 2vw, 1.125rem)' }}>
            SOLÍSTICA
          </span>
        </Link>

        <nav className="hidden md:flex flex-1 items-center justify-center gap-3 md:gap-4 lg:gap-5 min-w-0" aria-label="Navegación principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs md:text-sm font-medium transition-colors hover:text-foreground whitespace-nowrap ${
                link.accent ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <Link href="/buscar" className="flex items-center justify-center" aria-label="Buscar">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4.5 md:h-4.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Button>
          </Link>
          <Link href="/wishlist" className="flex items-center justify-center" aria-label="Favoritos">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-4.5 md:h-4.5">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </Button>
          </Link>
          <CartTrigger />
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex h-8 px-2.5 md:px-3 text-xs md:text-sm">
              Ingresar
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
