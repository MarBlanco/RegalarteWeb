import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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

describe('HeroSlider autoplay', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('avanza cada 3 segundos y recorre todos los slides', () => {
    vi.useFakeTimers()
    render(<HeroSlider />)
    expect(ctaByText('EXPLORAR VELAS')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(ctaByText('EXPLORAR VELAS')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(ctaByText('EXPLORAR AROMAS')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(3000 * 5)
    })
    expect(ctaByText('EXPLORAR VELAS')).toBeInTheDocument()
  })

  it('pausa y reanuda con el botón', () => {
    vi.useFakeTimers()
    render(<HeroSlider />)
    fireEvent.click(screen.getByLabelText('Pausar auto-desplazamiento'))
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(ctaByText('EXPLORAR VELAS')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Reanudar auto-desplazamiento'))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(ctaByText('EXPLORAR AROMAS')).toBeInTheDocument()
  })

  it('un cambio manual reinicia el contador de 3 segundos', () => {
    vi.useFakeTimers()
    render(<HeroSlider />)
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    fireEvent.click(screen.getByLabelText('Diapositiva siguiente'))
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(ctaByText('EXPLORAR AROMAS')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(ctaByText('EXPLORAR WAX-MELTS')).toBeInTheDocument()
  })

  it('se pausa mientras el foco está dentro del Hero y reanuda al salir', () => {
    vi.useFakeTimers()
    render(<HeroSlider />)
    const next = screen.getByLabelText('Diapositiva siguiente')
    act(() => {
      next.focus()
    })
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(ctaByText('EXPLORAR VELAS')).toBeInTheDocument()
    act(() => {
      next.blur()
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(ctaByText('EXPLORAR AROMAS')).toBeInTheDocument()
  })
})
