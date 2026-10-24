import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './footer'

describe('Footer — íconos sociales', () => {
  it('el ícono de WhatsApp abre el chat oficial (wa.me) en pestaña nueva', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')))
    render(<Footer />)
    const wa = screen.getByRole('link', { name: 'WhatsApp' })
    expect(wa).toHaveAttribute('href', 'https://wa.me/5491158582146')
    expect(wa).toHaveAttribute('target', '_blank')
    expect(wa).toHaveAttribute('rel', 'noopener noreferrer')
    vi.unstubAllGlobals()
  })
})
