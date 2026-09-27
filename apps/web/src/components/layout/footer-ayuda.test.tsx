import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AyudaLink } from './footer'

beforeEach(() => {
  window.location.hash = ''
})

describe('AyudaLink — un solo mecanismo de hash', () => {
  it('los 5 hrefs apuntan a su sección', () => {
    const cases: Array<[string, string]> = [
      ['/ayuda#como-comprar', 'Cómo comprar'],
      ['/ayuda#envios', 'Envíos'],
      ['/ayuda#cambios-devoluciones', 'Cambios'],
      ['/ayuda#preguntas-frecuentes', 'FAQ'],
      ['/ayuda#contacto', 'Contacto'],
    ]
    for (const [href, label] of cases) {
      const { unmount } = render(<AyudaLink href={href}>{label}</AyudaLink>)
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href,
      )
      unmount()
    }
  })

  it('dentro de /ayuda actualiza el hash nativo sin navegar', () => {
    window.history.pushState({}, '', '/ayuda')
    render(
      <AyudaLink href="/ayuda#envios">Envíos</AyudaLink>,
    )
    const link = screen.getByRole('link', { name: 'Envíos' })
    fireEvent.click(link)
    expect(window.location.hash).toBe('#envios')
    window.history.pushState({}, '', '/')
  })
})
