import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'
import { AccountMenu } from './account-menu'

const STAFF = {
  id: '2',
  email: 'guale@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
}
const CLIENT = { ...STAFF, id: '3', email: 'c@example.com', name: 'Cli', role: 'retail' as const }
const ADMIN = { ...STAFF, id: '1', email: 'a@example.com', name: 'Martin', role: 'admin' as const }

function loginAs(user: typeof STAFF) {
  useAuth.setState({ user, token: 'tok' })
}

beforeEach(() => {
  useAuth.setState({ user: null, token: null })
  useEditMode.setState({ viewAsClient: false })
})

function openMenu(name: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('AccountMenu — visitante', () => {
  it('solo login y registro', () => {
    render(<AccountMenu />)
    openMenu('Ingresar a tu cuenta')
    expect(screen.getByRole('menuitem', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/auth/login',
    )
    expect(screen.getByRole('menuitem', { name: 'Crear cuenta' })).toHaveAttribute(
      'href',
      '/auth/register',
    )
    expect(screen.queryByRole('menuitem', { name: 'Mi cuenta' })).toBeNull()
    expect(screen.queryByText('Modo edición')).toBeNull()
  })

  it('toggle, fuera y Escape', () => {
    render(<AccountMenu />)
    const trigger = screen.getByRole('button', { name: 'Ingresar a tu cuenta' })
    fireEvent.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('click fuera cierra', () => {
    render(
      <div>
        <span>fuera</span>
        <AccountMenu />
      </div>,
    )
    openMenu('Ingresar a tu cuenta')
    fireEvent.mouseDown(screen.getByText('fuera'))
    expect(screen.queryByRole('menu')).toBeNull()
  })
})

describe('AccountMenu — cliente', () => {
  it('datos sin edición ni admin', () => {
    loginAs(CLIENT)
    render(<AccountMenu />)
    openMenu('Cuenta de Cli')
    expect(screen.getByText('c@example.com')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Compras' })).toHaveAttribute(
      'href',
      '/orders',
    )
    expect(screen.getByRole('menuitem', { name: 'Información' })).toHaveAttribute(
      'href',
      '/profile',
    )
    expect(screen.getByRole('menuitem', { name: 'Favoritos' })).toHaveAttribute(
      'href',
      '/wishlist',
    )
    expect(screen.queryByText('Modo edición')).toBeNull()
    expect(screen.queryByText('Staff')).toBeNull()
    expect(screen.queryByText('Administración')).toBeNull()
  })

  it('entrar a Compras cierra el dropdown', () => {
    loginAs(CLIENT)
    render(<AccountMenu />)
    openMenu('Cuenta de Cli')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Compras' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })
})

describe('AccountMenu — staff', () => {
  it('sin opciones de modo: Compras, Favoritos, Información y salir', () => {
    loginAs(STAFF)
    render(<AccountMenu />)
    openMenu('Cuenta de Guale')
    expect(screen.getByText('Staff')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Compras' })).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Información' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Modo edición')).toBeNull()
    expect(screen.queryByText('Ver tienda como cliente')).toBeNull()
    expect(screen.queryByText('Administración')).toBeNull()
    expect(screen.queryByText('Administrador')).toBeNull()
  })

  it('logout limpia sesión y modo', () => {
    loginAs(STAFF)
    useEditMode.setState({ viewAsClient: true })
    render(<AccountMenu />)
    openMenu('Cuenta de Guale')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))
    expect(useAuth.getState().user).toBeNull()
    expect(useEditMode.getState().viewAsClient).toBe(false)
  })
})

describe('AccountMenu — admin', () => {
  it('incluye acceso administrativo', () => {
    loginAs(ADMIN)
    render(<AccountMenu />)
    openMenu('Cuenta de Martin')
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Administración' }),
    ).toHaveAttribute('href', '/admin')
    expect(screen.queryByText('Modo edición')).toBeNull()
    expect(screen.queryByText('Ver tienda como cliente')).toBeNull()
  })
})
