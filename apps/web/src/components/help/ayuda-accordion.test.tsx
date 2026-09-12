import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AyudaAccordion } from './ayuda-accordion'

beforeEach(() => {
  window.location.hash = ''
})

describe('AyudaAccordion', () => {
  it('inicia con las cinco secciones cerradas', () => {
    render(<AyudaAccordion />)
    const buttons = screen.getAllByRole('button', { expanded: false })
    expect(buttons).toHaveLength(5)
  })

  it('abre una sección, cambia el indicador y cierra las demás', () => {
    render(<AyudaAccordion />)
    const envios = screen.getByRole('button', { name: /Envíos/ })
    fireEvent.click(envios)
    expect(envios).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/todo el país/)).toBeInTheDocument()

    const comoComprar = screen.getByRole('button', { name: /Cómo comprar/ })
    fireEvent.click(comoComprar)
    expect(comoComprar).toHaveAttribute('aria-expanded', 'true')
    expect(envios).toHaveAttribute('aria-expanded', 'false')
  })

  it('abre la sección indicada por el hash', () => {
    window.location.hash = '#contacto'
    render(<AyudaAccordion />)
    expect(
      screen.getByRole('button', { name: /Contacto/ }),
    ).toHaveAttribute('aria-expanded', 'true')
  })
})
