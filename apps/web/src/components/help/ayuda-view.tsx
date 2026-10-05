'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { AyudaSection } from './ayuda-data'
import { useAyudaSections, useSocialLinks } from '@/lib/site-content-client'
import type { SocialLinks } from '@/lib/site-settings'

function sectionFromHash(sections: readonly AyudaSection[]): string | null {
  if (typeof window === 'undefined') return null
  const id = window.location.hash.replace('#', '')
  return sections.some((s) => s.id === id) ? id : null
}

function QueryView({
  section,
  social,
}: Readonly<{
  section: AyudaSection
  social: SocialLinks
}>) {
  return (
    <div>
      <Link
        href="/ayuda"
        onClick={() => {
          if (typeof window !== 'undefined') window.location.hash = ''
        }}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#B85C33] underline-offset-4 hover:underline"
      >
        <span aria-hidden="true">←</span> Volver a Ayuda
      </Link>

      <header className="mt-6 text-center">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-[#38271D] sm:text-5xl">
          {section.title}
        </h1>
        <span aria-hidden="true" className="mx-auto mt-4 flex items-center justify-center gap-2">
          <span className="block h-px w-16 bg-[#C45A37]/50" />
          <span className="block h-1.5 w-1.5 rotate-45 bg-[#C45A37]" />
          <span className="block h-px w-16 bg-[#C45A37]/50" />
        </span>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-[#5C4A3D]">
          {section.intro}
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-3xl">
        <ol className="space-y-4">
          {section.body.map((line, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="font-serif text-sm font-medium tabular-nums text-[#C9A24B]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-[15px] leading-relaxed text-[#5C4A3D]">
                {line}
              </p>
            </li>
          ))}
        </ol>

        {section.id === 'contacto' ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: 'Instagram', href: social.instagram },
              { label: 'TikTok', href: social.tiktok },
              { label: 'Facebook', href: social.facebook },
              { label: 'WhatsApp', href: social.whatsapp },
            ].map((s) => (
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

        {section.cta ? (
          <div className="mt-8 rounded-xl bg-[#F9EFE2] p-5 sm:p-6">
            <p className="font-serif text-xl font-normal text-[#38271D]">
              ¿Seguimos?
            </p>
            <Link
              href={section.cta.href}
              className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-[#B85C33] px-6 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#9E4E2B]"
            >
              {section.cta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function IndexView({
  sections,
  onSelect,
}: Readonly<{
  sections: readonly AyudaSection[]
  onSelect: (id: string) => void
}>) {
  return (
    <div>
      <header className="text-center">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-[#38271D] sm:text-4xl">
          Ayuda
        </h1>
        <span aria-hidden="true" className="mx-auto mt-3 flex items-center justify-center gap-2">
          <span className="block h-px w-10 bg-[#C45A37]/50" />
          <span className="block h-1.5 w-1.5 rotate-45 bg-[#C45A37]" />
          <span className="block h-px w-10 bg-[#C45A37]/50" />
        </span>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#7A6A5D]">
          ¿En qué podemos ayudarte?
        </p>
      </header>

      <nav aria-label="Temas de ayuda" className="mx-auto mt-8 max-w-2xl">
        <ul className="divide-y divide-[#EBDFD1] overflow-hidden rounded-xl border border-[#EBDFD1] bg-[#FFFDF9]">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onSelect(section.id)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#F9EFE2]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B85C33] sm:px-6"
              >
                <span
                  aria-hidden="true"
                  className="font-serif text-sm font-medium tabular-nums text-[#C9A24B]"
                >
                  {section.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg font-normal text-[#38271D]">
                    {section.title}
                  </span>
                  <span className="block truncate text-[13px] text-[#7A6A5D]">
                    {section.intro}
                  </span>
                </span>
                <span aria-hidden="true" className="shrink-0 text-[#C9A24B]">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

/**
 * Vista de Ayuda sin acordeones: índice con las 5 consultas o una única
 * consulta (vía hash). Un solo mecanismo: el hash es la fuente de verdad.
 */
export function AyudaView() {
  const sections = useAyudaSections()
  const social = useSocialLinks()
  const [activeId, setActiveId] = useState<string | null>(null)

  const showOnly = useCallback((id: string) => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    setActiveId(id)
  }, [])

  useEffect(() => {
    const sync = () => {
      const id = sectionFromHash(sections)
      if (id) {
        showOnly(id)
      } else {
        setActiveId(null)
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'auto' })
        }
      }
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [showOnly, sections])

  function handleSelect(id: string) {
    if (typeof window !== 'undefined') {
      window.location.hash = id
    }
    showOnly(id)
  }

  const active = activeId
    ? (sections.find((s) => s.id === activeId) ?? null)
    : null

  return active ? (
    <QueryView section={active} social={social} />
  ) : (
    <IndexView sections={sections} onSelect={handleSelect} />
  )
}
