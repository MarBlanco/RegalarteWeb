import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardTitle } from './card'

describe('CardTitle', () => {
  it('renderiza h3 por defecto y permite elegir h1', () => {
    const { rerender } = render(<CardTitle>Título</CardTitle>)
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    rerender(<CardTitle as="h1">Título</CardTitle>)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
