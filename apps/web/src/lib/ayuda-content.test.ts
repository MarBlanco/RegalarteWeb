import { describe, it, expect } from 'vitest'
import { normalizeAyudaSections } from './ayuda-content'
import { AYUDA_SECTIONS } from '@/components/help/ayuda-data'

describe('normalizeAyudaSections', () => {
  it('sin secciones guardadas devuelve el contenido por defecto', () => {
    expect(normalizeAyudaSections(null)).toBe(AYUDA_SECTIONS)
    expect(normalizeAyudaSections({})).toBe(AYUDA_SECTIONS)
    expect(normalizeAyudaSections({ sections: [] })).toBe(AYUDA_SECTIONS)
  })

  it('mapea secciones guardadas con numeración posicional y CTA interno', () => {
    const out = normalizeAyudaSections({
      sections: [
        {
          sectionId: 'envios',
          title: ' Envíos ',
          intro: 'Intro',
          body: [{ text: 'Uno' }, { text: '  ' }, { text: 'Dos' }],
          ctaLabel: 'Ir',
          ctaHref: '/catalogo',
        },
        { sectionId: 'contacto', title: 'Contacto', body: [] },
      ],
    })
    expect(out).toEqual([
      {
        id: 'envios',
        number: '01',
        title: 'Envíos',
        intro: 'Intro',
        body: ['Uno', 'Dos'],
        cta: { label: 'Ir', href: '/catalogo' },
      },
      { id: 'contacto', number: '02', title: 'Contacto', intro: '', body: [] },
    ])
  })

  it('descarta ids inválidos o repetidos y CTA externos', () => {
    const out = normalizeAyudaSections({
      sections: [
        { sectionId: 'Mal Id', title: 'x' },
        { sectionId: 'ok', title: 'Ok', ctaLabel: 'Ir', ctaHref: 'https://evil.com' },
        { sectionId: 'ok', title: 'Repetida' },
        { sectionId: 'otra', title: '' },
      ],
    })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 'ok', title: 'Ok' })
    expect(out[0].cta).toBeUndefined()
  })

  it('si ninguna sección es válida vuelve a los defaults', () => {
    expect(normalizeAyudaSections({ sections: [{ sectionId: '', title: '' }] })).toBe(
      AYUDA_SECTIONS,
    )
  })
})
