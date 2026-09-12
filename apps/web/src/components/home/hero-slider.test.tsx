import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeroSlider } from './hero-slider'

function ctaByText(text: string) {
  return screen.getByRole('link', { name: text })
}

describe('HeroSlider CTA por categoría', () => {
  it('el CTA corresponde al slide visible y cambia con las flechas', () => {
    render(<HeroSlider />)
    expect(ctaByText('EXPLORAR VELAS')).toHaveAttribute(
      'href',
      '/catalogo?category=velas',
    )

    fireEvent.click(screen.getByLabelText('Diapositiva siguiente'))
    expect(ctaByText('EXPLORAR AROMAS')).toHaveAttribute(
      'href',
      '/catalogo?category=aromas',
    )
  })

  it('los dots navegan y el CTA acompaña', () => {
    render(<HeroSlider />)
    fireEvent.click(screen.getByLabelText('Ir a diapositiva 4'))
    expect(ctaByText('EXPLORAR QUEMADORES')).toHaveAttribute(
      'href',
      '/catalogo?category=quemadores',
    )

    fireEvent.click(screen.getByLabelText('Ir a diapositiva 6'))
    expect(ctaByText('EXPLORAR REGALARTE')).toHaveAttribute(
      'href',
      '/catalogo?category=regalarte',
    )
  })

  it('cubre las 6 categorías del Nav sin excepción', () => {
    const { unmount } = render(<HeroSlider />)
    const expected: Array<[string, string]> = [
      ['EXPLORAR VELAS', '/catalogo?category=velas'],
      ['EXPLORAR AROMAS', '/catalogo?category=aromas'],
      ['EXPLORAR WAX-MELTS', '/catalogo?category=wax-melts'],
      ['EXPLORAR QUEMADORES', '/catalogo?category=quemadores'],
      ['EXPLORAR PACKS', '/catalogo?category=packs'],
      ['EXPLORAR REGALARTE', '/catalogo?category=regalarte'],
    ]
    expected.forEach(([text, href], index) => {
      fireEvent.click(screen.getByLabelText(`Ir a diapositiva ${index + 1}`))
      expect(ctaByText(text)).toHaveAttribute('href', href)
    })
    unmount()
  })
})
