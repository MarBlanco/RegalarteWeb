import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { Header } from './header'

beforeEach(() => {
  useAuth.setState({ user: null, token: null })
})

describe('Header — Account Menu reemplaza la personita', () => {
  it('sin sesión muestra disparador Ingresar y sin personita', () => {
    const { container } = render(<Header />)
    expect(
      screen.getByRole('button', { name: 'Ingresar a tu cuenta' }),
    ).toBeInTheDocument()
    expect(container.querySelector('a[aria-label="Mi cuenta"]')).toBeNull()
  })

  it('con sesión muestra Hola + nombre', () => {
    useAuth.setState({
      user: {
        id: '2',
        email: 'guale@example.com',
        name: 'Guale',
        role: 'staff',
        customer_type: 'RETAIL',
      },
      token: 'tok',
    })
    render(<Header />)
    expect(
      screen.getByRole('button', { name: 'Cuenta de Guale' }),
    ).toBeInTheDocument()
  })
})
