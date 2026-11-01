import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EditModal } from './edit-modal'

describe('EditModal', () => {
  it('se monta en <body>: abierto desde dentro de un <form> no queda un <form> anidado', () => {
    const { container } = render(
      <form data-testid="outer">
        <EditModal
          title="Editar Ámbar"
          fields={[{ name: 'name', label: 'Nombre', type: 'text' }]}
          initialValues={{ name: 'Ámbar' }}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      </form>,
    )
    expect(screen.getByRole('dialog', { name: 'Editar Ámbar' })).toBeInTheDocument()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.querySelector('form form')).toBeNull()
  })
})
