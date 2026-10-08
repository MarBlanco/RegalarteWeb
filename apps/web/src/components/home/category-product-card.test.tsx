import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryProductCard, type HomeShowcaseProduct } from './home-body'

const product = (overrides: Partial<HomeShowcaseProduct> = {}): HomeShowcaseProduct => ({
  id: 7,
  slug: 'vela-7',
  title: 'Vela Siete',
  subtitle: 'Ámbar',
  price: 4500,
  imageUrl: '/img/v.jpg',
  imageAlt: 'Vela Siete',
  ...overrides,
})

describe('Home — tarjeta de producto y estado Agotado', () => {
  it('Activo: sin insignia', () => {
    render(<CategoryProductCard product={product({ soldOut: false })} />)
    expect(screen.getByText('Vela Siete')).toBeInTheDocument()
    expect(screen.queryByText('Agotado')).toBeNull()
  })

  it('Agotado: sigue visible con precio e información y muestra la insignia', () => {
    render(<CategoryProductCard product={product({ soldOut: true })} />)
    expect(screen.getByText('Vela Siete')).toBeInTheDocument()
    expect(screen.getByText('Ámbar')).toBeInTheDocument()
    expect(screen.getByText(/4\.500/)).toBeInTheDocument()
    expect(screen.getByText('Agotado')).toBeInTheDocument()
  })
})
