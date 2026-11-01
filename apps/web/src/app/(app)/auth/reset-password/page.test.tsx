import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResetPasswordPage from './page'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('token=abc123'),
}))

afterEach(() => vi.unstubAllGlobals())

function submit(password = 'NuevaClave#2026y', confirm = password) {
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: confirm } })
  fireEvent.click(screen.getByRole('button', { name: /actualizar/i }))
}

describe('ResetPasswordPage', () => {
  it('contraseñas distintas: avisa y no llama a la API', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<ResetPasswordPage />)
    submit('NuevaClave#2026y', 'Distinta#2026z')
    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('token inválido o usado (403): mensaje en español, no el texto en inglés de Payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ errors: [{ message: 'Token is either invalid or has expired.' }] }),
      }),
    )
    render(<ResetPasswordPage />)
    submit()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/no es válido o ya fue usado/i)
    expect(alert).not.toHaveTextContent(/Token is either/)
  })

  it('éxito: muestra la confirmación', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }))
    render(<ResetPasswordPage />)
    submit()
    await waitFor(() => expect(screen.getByText('Contraseña actualizada')).toBeInTheDocument())
  })
})
