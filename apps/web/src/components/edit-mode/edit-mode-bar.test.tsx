import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuth, type User, type UserRole } from '@/hooks/use-auth'
import { EditModeBar } from './edit-mode-bar'

function login(role: UserRole | null) {
  if (!role) {
    useAuth.setState({ user: null, token: null })
    return
  }
  useAuth.setState({
    user: { id: '1', email: 'u@x.com', name: 'U', role, customer_type: 'RETAIL' } as User,
    token: 'jwt',
  })
}

beforeEach(() => login(null))

describe('EditModeBar — botón Administrar solo para ADMIN', () => {
  it('admin ve el selector de modos y el botón Administrar hacia /admin', () => {
    login('admin')
    render(<EditModeBar />)
    expect(screen.getByRole('button', { name: /modo edición/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /administrar/i })).toHaveAttribute('href', '/admin')
  })

  it('staff ve el selector de modos pero NO el botón Administrar', () => {
    login('staff')
    render(<EditModeBar />)
    expect(screen.getByRole('button', { name: /modo edición/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /administrar/i })).toBeNull()
  })

  it.each<UserRole | null>(['retail', 'wholesale', 'visitor', null])(
    'rol %s no ve la barra ni el botón',
    (role) => {
      login(role)
      const { container } = render(<EditModeBar />)
      expect(container).toBeEmptyDOMElement()
    },
  )

  it('un rol admin sin token (sesión vencida) no ve el botón', () => {
    useAuth.setState({
      user: { id: '1', email: 'a@x.com', name: 'A', role: 'admin', customer_type: 'RETAIL' } as User,
      token: null,
    })
    render(<EditModeBar />)
    expect(screen.queryByRole('link', { name: /administrar/i })).toBeNull()
  })
})
