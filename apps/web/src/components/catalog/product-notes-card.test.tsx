import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductNotesCard } from './product-notes-card'

describe('ProductNotesCard', () => {
  it('sin atributos reales no se muestra (nunca notas inventadas)', () => {
    const { container } = render(<ProductNotesCard attributes={[]} />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText(/Vainilla, leche tibia/)).toBeNull()
  })

  it('muestra solo las notas que el producto tiene', () => {
    render(
      <ProductNotesCard
        attributes={[
          { name: 'Nota de salida', values: ['Cítricos'] },
          { name: 'Nota de fondo', values: ['Sándalo', 'Ámbar'] },
        ]}
      />,
    )
    expect(screen.getByText('Cítricos')).toBeInTheDocument()
    expect(screen.getByText('Sándalo, Ámbar')).toBeInTheDocument()
    expect(screen.queryByText('Corazón')).toBeNull()
  })

  it('con solo un ritual lo muestra sin inventar notas', () => {
    render(<ProductNotesCard attributes={[{ name: 'Ritual', values: ['Noche de calma'] }]} />)
    expect(screen.getByText('Noche de calma')).toBeInTheDocument()
    expect(screen.queryByText('Salida')).toBeNull()
  })
})
