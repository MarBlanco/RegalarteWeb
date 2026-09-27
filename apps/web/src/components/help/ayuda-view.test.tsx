import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AyudaView } from './ayuda-view'

beforeEach(() => {
  window.location.hash = ''
})

describe('AyudaView — índice y consultas individuales', () => {
  it('sin hash muestra el índice con las 5 opciones', () => {
    render(<AyudaView />)
    expect(
      screen.getByRole('heading', { name: 'Ayuda' }),
    ).toBeInTheDocument()
    for (const title of [
      'Cómo comprar',
      'Envíos',
      'Cambios y devoluciones',
      'Preguntas frecuentes',
      'Contacto',
    ]) {
      expect(
        screen.getByRole('button', { name: new RegExp(title) }),
      ).toBeInTheDocument()
    }
    expect(screen.queryByText('Volver a Ayuda')).toBeNull()
  })

  it('con hash muestra SOLO esa consulta', () => {
    window.location.hash = '#envios'
    render(<AyudaView />)
    expect(
      screen.getByRole('heading', { name: 'Envíos' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Cómo comprar')).toBeNull()
    expect(screen.queryByText('Contacto')).toBeNull()
    expect(
      screen.getByRole('link', { name: /Volver a Ayuda/ }),
    ).toHaveAttribute('href', '/ayuda')
  })

  it('elegir opción abre solo esa consulta y volver restaura el índice', async () => {
    render(<AyudaView />)
    fireEvent.click(screen.getByRole('button', { name: /Contacto/ }))
    expect(screen.getByRole('heading', { name: 'Contacto' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#contacto')
    expect(screen.queryByText('Envíos')).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: /Volver a Ayuda/ }))
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Ayuda' }),
      ).toBeInTheDocument()
    })
  })

  it('hash inválido muestra el índice', () => {
    window.location.hash = '#inexistente'
    render(<AyudaView />)
    expect(
      screen.getByRole('heading', { name: 'Ayuda' }),
    ).toBeInTheDocument()
  })

  it('contacto muestra los 4 botones en orden, WhatsApp con enlace real', () => {
    window.location.hash = '#contacto'
    render(<AyudaView />)
    const buttons = screen.getAllByRole('link', {
      name: /Instagram|TikTok|Facebook|WhatsApp/,
    })
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Instagram',
      'TikTok',
      'Facebook',
      'WhatsApp',
    ])
    const whatsapp = screen.getByRole('link', { name: 'WhatsApp' })
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/5491158582146')
    expect(whatsapp).toHaveAttribute('target', '_blank')
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
