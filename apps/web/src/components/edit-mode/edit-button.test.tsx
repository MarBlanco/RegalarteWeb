import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'
import { EditButton } from './edit-button'
import { EditModeBar } from './edit-mode-bar'

const STAFF = {
  id: '2',
  email: 'guale@example.com',
  name: 'Guale',
  role: 'staff' as const,
  customer_type: 'RETAIL' as const,
}

function loginAs(role: typeof STAFF.role) {
  useAuth.setState({ user: { ...STAFF, role }, token: 'tok' })
}

beforeEach(() => {
  useAuth.setState({ user: null, token: null })
  useEditMode.setState({ viewAsClient: false })
})

describe('Selector de modos — dos botones juntos', () => {
  it('staff ve ambos modos con edición destacada', () => {
    loginAs('staff')
    render(<EditModeBar />)
    const edit = screen.getByRole('button', { name: 'Modo edición' })
    const client = screen.getByRole('button', { name: 'Modo cliente' })
    expect(edit).toHaveAttribute('aria-pressed', 'true')
    expect(client).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.getByRole('group', { name: 'Modo de visualización' }),
    ).toBeInTheDocument()
  })

  it('cambiar a cliente destaca ese botón y oculta controles', () => {
    loginAs('staff')
    render(
      <>
        <EditModeBar />
        <EditButton onClick={() => {}} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Modo cliente' }))
    expect(useEditMode.getState().viewAsClient).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Modo cliente' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'Modo edición' }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
  })

  it('volver a edición desde la barra', () => {
    loginAs('staff')
    useEditMode.setState({ viewAsClient: true })
    render(<EditModeBar />)
    fireEvent.click(screen.getByRole('button', { name: 'Modo edición' }))
    expect(useEditMode.getState().viewAsClient).toBe(false)
  })

  it('retail y anónimo no ven la barra', () => {
    loginAs('retail')
    const { container, rerender } = render(<EditModeBar />)
    expect(container.textContent).toBe('')
    useAuth.setState({ user: null, token: null })
    rerender(<EditModeBar />)
    expect(container.textContent).toBe('')
  })
})
