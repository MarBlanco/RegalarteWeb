'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { CartTrigger } from '@/components/cart/cart-trigger'

export const navLinks: Array<{ href: string; label: string; category: string | null; accent?: boolean }> = [
  { href: '/', label: 'Inicio', category: null },
  { href: '/catalogo?category=velas', label: 'Velas', category: 'velas' },
  { href: '/catalogo?category=aromas', label: 'Aromas', category: 'aromas' },
  { href: '/catalogo?category=wax-melts', label: 'Wax-Melts', category: 'wax-melts' },
  { href: '/catalogo?category=quemadores', label: 'Quemadores', category: 'quemadores' },
  { href: '/catalogo?category=packs', label: 'Packs', category: 'packs' },
  { href: '/catalogo?category=regalarte', label: 'Regalarte', category: 'regalarte', accent: true },
]

const giftIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
    <rect x="3" y="8" width="18" height="4" />
    <path d="M5 12v9h14v-9" />
    <path d="M12 8v13" />
    <path d="M12 8c-4 0-5.5-1.5-5.5-3.5C6.5 3 8 2.5 9 3.5 10.5 5 12 8 12 8z" />
    <path d="M12 8c4 0 5.5-1.5 5.5-3.5 0-1.5-1.5-2-2.5-1C13.5 5 12 8 12 8z" />
  </svg>
)

const topBarItems = [
  {
    label: 'Envíos a todo el país',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M1 8h13v9H1z" />
        <path d="M14 11h4l3 3v3h-7z" />
        <circle cx="5.5" cy="17.5" r="1.8" />
        <circle cx="17.5" cy="17.5" r="1.8" />
      </svg>
    ),
  },
  {
    label: 'Packaging premium',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="3" y="8" width="18" height="4" />
        <path d="M5 12v9h14v-9" />
        <path d="M12 8v13" />
        <path d="M12 8c-4 0-5.5-1.5-5.5-3.5C6.5 3 8 2.5 9 3.5 10.5 5 12 8 12 8z" />
        <path d="M12 8c4 0 5.5-1.5 5.5-3.5 0-1.5-1.5-2-2.5-1C13.5 5 12 8 12 8z" />
      </svg>
    ),
  },
  {
    label: 'Pagos seguros',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="4" y="10" width="16" height="10" rx="1.5" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
]

const iconBtn =
  'flex h-8 w-8 items-center justify-center text-[#38271D] transition-colors hover:text-[#C45A37] sm:h-9 sm:w-9'

function HeaderIcons() {
  return (
    <div className="flex flex-shrink-0 items-center gap-0.5 md:gap-1">
      <Link href="/buscar" className={iconBtn} aria-label="Buscar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] sm:h-5 sm:w-5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </Link>
      <Link href="/wishlist" className={iconBtn} aria-label="Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] sm:h-5 sm:w-5">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </Link>
      <Link href="/profile" className={iconBtn} aria-label="Mi cuenta">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] sm:h-5 sm:w-5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
        </svg>
      </Link>
      <CartTrigger />
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') ?? ''
  const onCatalog = pathname.startsWith('/catalogo')

  return (
    <>
      {/* Barra superior */}
      <div className="w-full overflow-hidden bg-[#A15C38] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-1.5 sm:justify-between">
          {topBarItems.map((item, index) => (
            <span
              key={item.label}
              className={`items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wide sm:text-[11px] ${
                index === 0 ? 'flex' : 'hidden sm:flex'
              }`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Header principal */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E5DDD1] bg-[#FBF7F1]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FBF7F1]/80">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 md:h-[76px] md:px-6">
          <Link
            href="/"
            className="flex flex-shrink-0 items-center gap-2"
            aria-label="Solística - Inicio"
          >
            <span className="font-serif text-[28px] font-semibold leading-none text-[#A15C38] md:text-[32px]">
              S
            </span>
            <span className="font-serif text-[15px] font-medium uppercase leading-none tracking-[0.22em] text-[#38271D] md:text-[17px]">
              Solística
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex lg:gap-7" aria-label="Navegación principal">
            {navLinks.map((link) => {
              const active =
                link.category === null
                  ? pathname === '/'
                  : onCatalog && currentCategory === link.category
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#C45A37] ${
                    active
                      ? 'text-[#A15C38] underline decoration-[#C45A37] decoration-1 underline-offset-[6px]'
                      : link.accent
                        ? 'text-[#C45A37]'
                        : 'text-[#38271D]'
                  }`}
                >
                  {link.accent ? giftIcon : null}
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <HeaderIcons />
        </div>

        {/* Navegación mobile: scroll horizontal */}
        <nav className="flex items-center gap-5 overflow-x-auto border-t border-[#E5DDD1]/60 px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden" aria-label="Navegación principal móvil">
          {navLinks.map((link) => {
            const active =
              link.category === null
                ? pathname === '/'
                : onCatalog && currentCategory === link.category
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  active
                    ? 'text-[#A15C38] underline decoration-[#C45A37] decoration-1 underline-offset-4'
                    : link.accent
                      ? 'text-[#C45A37]'
                      : 'text-[#38271D]'
                }`}
              >
                {link.accent ? giftIcon : null}
                {link.label}
              </Link>
            )
          })}
          <span className="w-px shrink-0" aria-hidden="true" />
        </nav>
      </header>
    </>
  )
}
