'use client'

import { useState } from 'react'
import { MOCK_FEATURES, MOCK_TABS } from './pdp-mock'
import { cn } from '@/lib/utils'

interface ProductTabsProps {
  description: React.ReactNode
  characteristics: { name: string; values: string }[]
}

/**
 * Bloque de información del PDP estilo mock: tabs + iconos de features.
 * Descripción y características con datos reales; resto MOCK visual.
 */
export function ProductTabs({ description, characteristics }: ProductTabsProps) {
  const tabs = [
    { id: 'descripcion', label: 'Descripción' },
    ...(characteristics.length > 0
      ? [{ id: 'caracteristicas', label: 'Características' }]
      : []),
    ...MOCK_TABS.map((t) => ({ id: t.id, label: t.label })),
  ]
  const [active, setActive] = useState('descripcion')
  const mockTab = MOCK_TABS.find((t) => t.id === active)

  const featureIcons = [
    <svg key="clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
    <svg key="leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d="M11 20A7 7 0 0 1 4 13c0-4 3-8 8-10 5-2 8-1 8-1s1 3-1 8c-2 5-6 8-8 10z" /><path d="M4 21c4-4 7-7 12-12" /></svg>,
    <svg key="flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d="M12 22c4 0 7-2.7 7-7 0-3-2-5.5-3.5-7C14 6.5 13 5 13 2c-3 2-5 4.5-5.5 7C6 10.5 5 12.5 5 15c0 4.3 3 7 7 7z" /></svg>,
    <svg key="heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
  ]

  return (
    <section id="detalles" aria-label="Información del producto" className="scroll-mt-32">
      <div
        role="tablist"
        aria-label="Secciones de información"
        className="flex gap-5 overflow-x-auto border-b border-[#EBDFD1] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
              active === tab.id
                ? 'border-[#B85C33] text-[#38271D]'
                : 'border-transparent text-[#9A8A7A] hover:text-[#38271D]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="py-5 text-sm leading-relaxed text-[#5C4A3D]">
        {active === 'descripcion' ? (
          description
        ) : active === 'caracteristicas' ? (
          <ul className="space-y-2">
            {characteristics.map((c) => (
              <li key={c.name} className="flex items-baseline justify-between gap-4 border-b border-[#EBDFD1]/60 pb-2">
                <span className="font-medium text-[#38271D]">{c.name}</span>
                <span className="text-right">{c.values}</span>
              </li>
            ))}
          </ul>
        ) : mockTab ? (
          <div className="space-y-3">
            {mockTab.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : null}
      </div>

      <ul className="grid grid-cols-2 gap-4 border-t border-[#EBDFD1] pt-5 sm:grid-cols-4">
        {MOCK_FEATURES.map((f, i) => (
          <li key={f.title} className="flex items-start gap-2.5">
            <span className="shrink-0 text-[#B85C33]">{featureIcons[i]}</span>
            <span>
              <span className="block text-xs font-semibold text-[#38271D]">{f.title}</span>
              <span className="mt-0.5 block text-[11px] text-[#7A6A5D]">{f.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
