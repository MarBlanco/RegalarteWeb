import { describe, it, expect } from 'vitest'
import {
  canEditHomeContent,
  sanitizeHomeContentPatch,
} from './home-content'

describe('Modo Edición — gate de rol (backend)', () => {
  it('permite admin y staff', () => {
    expect(canEditHomeContent({ role: 'admin' })).toBe(true)
    expect(canEditHomeContent({ role: 'staff' })).toBe(true)
  })

  it('niega clientes, visitantes y anónimos', () => {
    expect(canEditHomeContent({ role: 'retail' })).toBe(false)
    expect(canEditHomeContent({ role: 'wholesale' })).toBe(false)
    expect(canEditHomeContent({ role: 'visitor' })).toBe(false)
    expect(canEditHomeContent(null)).toBe(false)
    expect(canEditHomeContent(undefined)).toBe(false)
    expect(canEditHomeContent({})).toBe(false)
  })
})

describe('Modo Edición — sanitización del PUT', () => {
  it('acepta un patch válido de intro', () => {
    const patch = sanitizeHomeContentPatch({
      intro: { title: 'Hola', description: 'Mundo' },
    })
    expect(patch).toEqual({
      intro: { title: 'Hola', description: 'Mundo' },
    })
  })

  it('elimina claves desconocidas (no se puede escribir nada fuera del contenido)', () => {
    const patch = sanitizeHomeContentPatch({
      intro: { title: 'Hola', description: 'Mundo' },
      role: 'admin',
      secret: 'x',
    })
    expect(patch).toEqual({
      intro: { title: 'Hola', description: 'Mundo' },
    })
  })

  it('descarta slides con categoría inválida y exige al menos uno válido', () => {
    expect(
      sanitizeHomeContentPatch({
        heroSlides: [{ image: 'a', title: 't', category: 'inventada' }],
      }),
    ).toBeNull()
    const patch = sanitizeHomeContentPatch({
      heroSlides: [
        { image: 'a', title: 't', category: 'inventada' },
        {
          image: '/x.jpeg',
          title: 'T',
          description: 'D',
          ctaText: '',
          category: 'velas',
        },
      ],
    })
    expect(patch?.heroSlides).toHaveLength(1)
    expect(patch?.heroSlides?.[0].category).toBe('velas')
  })

  it('descarta beneficios con ícono inválido', () => {
    const patch = sanitizeHomeContentPatch({
      benefits: [
        { icon: 'otro', title: 'T', description: 'D' },
        { icon: 'leaf', title: 'T', description: 'D' },
      ],
    })
    expect(patch?.benefits).toHaveLength(1)
    expect(patch?.benefits?.[0].icon).toBe('leaf')
  })

  it('rechaza cuerpos vacíos o sin claves válidas', () => {
    expect(sanitizeHomeContentPatch(null)).toBeNull()
    expect(sanitizeHomeContentPatch({})).toBeNull()
    expect(sanitizeHomeContentPatch({ foo: 1 })).toBeNull()
  })

  it('acota strings largos', () => {
    const patch = sanitizeHomeContentPatch({
      intro: { title: 'x'.repeat(500), description: 'y' },
    })
    expect(patch?.intro?.title).toHaveLength(200)
  })
})
