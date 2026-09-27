import { describe, it, expect } from 'vitest'
import {
  isSimpleLexical,
  lexicalToPlainText,
  plainTextToLexical,
  sanitizeAttributeValues,
  sanitizeProductPatch,
} from './product-edit'

const SIMPLE_DOC = {
  root: {
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Hola', format: 0 },
          { type: 'text', text: ' mundo', format: 0 },
        ],
      },
      { type: 'paragraph', children: [{ type: 'text', text: 'Chau' }] },
    ],
  },
}

const COMPLEX_DOC = {
  root: {
    children: [
      { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'T' }] },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'N', format: 1 }],
      },
    ],
  },
}

describe('Editor comercial — Lexical simple vs complejo', () => {
  it('detecta párrafos simples sin formato', () => {
    expect(isSimpleLexical(SIMPLE_DOC)).toBe(true)
    expect(isSimpleLexical({ root: { children: [] } })).toBe(true)
    expect(isSimpleLexical(null)).toBe(false)
    expect(isSimpleLexical(COMPLEX_DOC)).toBe(false)
  })

  it('extrae texto plano sin perder nada', () => {
    expect(lexicalToPlainText(SIMPLE_DOC)).toBe('Hola mundo\n\nChau')
  })

  it('round-trip simple preserva el texto', () => {
    const text = 'Línea uno\n\nLínea dos'
    const doc = plainTextToLexical(text)
    expect(isSimpleLexical(doc)).toBe(true)
    expect(lexicalToPlainText(doc)).toBe(text)
  })
})

describe('Editor comercial — sanitización del PUT', () => {
  it('acepta campos comerciales válidos', () => {
    const patch = sanitizeProductPatch(
      {
        title: 'Vela Nueva',
        price: 12500,
        compareAtPrice: null,
        stock: 10,
        active: true,
        featured: false,
        category: 3,
        tags: [1, 2, 2],
        images: [7],
      },
      SIMPLE_DOC,
    )
    expect(patch).toEqual({
      title: 'Vela Nueva',
      price: 12500,
      compareAtPrice: null,
      stock: 10,
      active: true,
      featured: false,
      category: 3,
      tags: [1, 2],
      images: [7],
    })
  })

  it('rechaza cuerpo vacío o inválido', () => {
    expect(sanitizeProductPatch(null, SIMPLE_DOC)).toBeNull()
    expect(sanitizeProductPatch({}, SIMPLE_DOC)).toBeNull()
    expect(sanitizeProductPatch({ price: -5 }, SIMPLE_DOC)).toBeNull()
    expect(sanitizeProductPatch({ title: '' }, SIMPLE_DOC)).toBeNull()
    expect(sanitizeProductPatch({ category: 'x' }, SIMPLE_DOC)).toBeNull()
    expect(sanitizeProductPatch({ tags: 'x' }, SIMPLE_DOC)).toBeNull()
    expect(sanitizeProductPatch({ soldOut: 'si' }, SIMPLE_DOC)).toBeNull()
  })

  it('acepta y valida el estado Agotado', () => {
    expect(sanitizeProductPatch({ soldOut: true }, SIMPLE_DOC)).toEqual({
      soldOut: true,
    })
    expect(sanitizeProductPatch({ soldOut: false }, SIMPLE_DOC)).toEqual({
      soldOut: false,
    })
  })

  it('nunca propaga campos técnicos prohibidos', () => {
    const patch = sanitizeProductPatch(
      {
        title: 'T',
        slug: 'otro-slug',
        wholesalePrice: 1,
        isWholesaleAvailable: true,
        role: 'admin',
        seoTitle: 'x',
      },
      SIMPLE_DOC,
    )
    expect(patch).toEqual({ title: 'T' })
  })

  it('descripción simple se convierte; compleja se rechaza', () => {
    const ok = sanitizeProductPatch(
      { descriptionText: 'Nueva descripción' },
      SIMPLE_DOC,
    )
    expect(ok?.description).toBeDefined()
    expect(
      lexicalToPlainText(ok?.description as Record<string, unknown>),
    ).toBe('Nueva descripción')

    expect(
      sanitizeProductPatch({ descriptionText: 'x' }, COMPLEX_DOC),
    ).toBeNull()
  })
})

describe('Editor comercial — notas aromáticas', () => {
  it('acepta lista de valores y ordena', () => {
    expect(
      sanitizeAttributeValues({ values: ['Vainilla', ' ámbar ', ''] }),
    ).toEqual([
      { value: 'Vainilla', sortOrder: 0 },
      { value: 'ámbar', sortOrder: 1 },
    ])
  })

  it('rechaza sin valores válidos o claves técnicas', () => {
    expect(sanitizeAttributeValues(null)).toBeNull()
    expect(sanitizeAttributeValues({})).toBeNull()
    expect(sanitizeAttributeValues({ values: [] })).toBeNull()
    expect(sanitizeAttributeValues({ values: ['', '  '] })).toBeNull()
    expect(sanitizeAttributeValues({ values: 'x' })).toBeNull()
    expect(sanitizeAttributeValues({ name: 'Hack' })).toBeNull()
  })
})
