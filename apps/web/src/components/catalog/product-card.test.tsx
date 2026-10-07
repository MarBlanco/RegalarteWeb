import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from './product-card'
import type { ProductWithImage } from '@/lib/catalog'

function makeProduct(
  overrides: Partial<ProductWithImage> = {},
): ProductWithImage {
  return {
    id: 77,
    title: 'Vela Aromática',
    slug: 'vela-aromatica',
    price: 4500,
    compareAtPrice: null,
    wholesalePrice: null,
    isWholesaleAvailable: false,
    stock: 10,
    active: true,
    featured: false,
    sortOrder: 0,
    category: 1,
    tags: [
      { id: 11, name: 'Vainilla', slug: 'vainilla-nota' },
      { id: 12, name: 'Ámbar', slug: 'ambar-nota' },
    ],
    attributes: [],
    images: [],
    seoTitle: null,
    seoDescription: null,
    updatedAt: new Date(0).toISOString(),
    createdAt: new Date(0).toISOString(),
    featuredImage: {
      id: 5,
      url: '/img/vela.jpg',
      alt: 'Vela Aromática',
      filename: null,
    },
    ...overrides,
  } as unknown as ProductWithImage
}

describe('ProductCard — estado Agotado', () => {
  it('agotado manual: visible con badge y botón bloqueado, sin compra', () => {
    render(<ProductCard product={makeProduct({ soldOut: true })} />)
    // Visible: imagen, nombre, aromas y precio.
    expect(screen.getByText('Vela Aromática')).toBeInTheDocument()
    expect(screen.getAllByText('$ 4.500').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Vainilla · Ámbar')).toBeInTheDocument()
    // Botón AGOTADO (único indicador; sin badge sobre la imagen).
    expect(screen.getAllByText('Agotado')).toHaveLength(1)
    const button = screen.getByRole('button', { name: 'Agotado' })
    expect(button).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: /Agregar al carrito/ }),
    ).toBeNull()
  })

  it('sin stock también muestra Agotado aunque no sea manual', () => {
    render(<ProductCard product={makeProduct({ stock: 0 })} />)
    expect(
      screen.getByRole('button', { name: 'Agotado' }),
    ).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: /Agregar al carrito/ }),
    ).toBeNull()
  })

  it('disponible: compra normal sin badge', () => {
    render(<ProductCard product={makeProduct()} />)
    expect(
      screen.getByRole('button', { name: /Agregar al carrito/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agotado' })).toBeNull()
  })
})

describe('ProductCard — compra por estado', () => {
  it('Activo: "Agregar al carrito" habilitado', () => {
    render(<ProductCard product={makeProduct({ active: true, soldOut: false })} />)
    expect(screen.getByRole('button', { name: 'Agregar al carrito' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agotado' })).toBeNull()
  })

  it('Agotado: sin botón de compra, con precio visible', () => {
    render(<ProductCard product={makeProduct({ soldOut: true })} />)
    expect(screen.queryByRole('button', { name: 'Agregar al carrito' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled()
    expect(screen.getByText(/4\.500/)).toBeInTheDocument()
  })
})
