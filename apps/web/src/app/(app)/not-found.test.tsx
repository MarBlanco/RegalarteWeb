import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppNotFound from './not-found'

describe('AppNotFound', () => {
  it('muestra el 404 del storefront en español con una única salida al inicio', () => {
    render(<AppNotFound />)
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.queryByRole('link', { name: /catálogo/i })).toBeNull()
  })
})
