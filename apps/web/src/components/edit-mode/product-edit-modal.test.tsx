import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { ProductEditButton } from './product-edit-modal'

const PRODUCT = {
  id: 99,
  title: 'Vela Test',
  slug: 'vela-test',
  price: 1000,
  compareAtPrice: null,
  stock: 5,
  active: true,
  featured: false,
  category: { id: 3, title: 'Velas' },
  tags: [],
  images: [],
  description: {
    root: {
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'Desc', format: 0 }],
        },
      ],
    },
  },
}

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (String(url).startsWith('/api/products/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(PRODUCT) })
      }
      if (String(url).startsWith('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ docs: [{ id: 3, title: 'Velas' }] }),
        })
      }
      if (String(url).startsWith('/api/product-tags')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ docs: [] }) })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    }),
  )
}

beforeEach(() => {
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
  vi.unstubAllGlobals()
  mockFetch()
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn().mockReturnValue('blob:preview'),
    revokeObjectURL: vi.fn(),
  })
})

describe('Editor comercial — producto real', () => {
  it('carga el producto y muestra sus datos comerciales', async () => {
    render(<ProductEditButton productId={99} slug="vela-test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))
    await waitFor(() => {
      expect(screen.getByLabelText('Nombre / título')).toHaveValue('Vela Test')
    })
    expect(screen.getByLabelText('Precio')).toHaveValue(1000)
    expect(screen.getByLabelText('Descripción')).toHaveValue('Desc')
  })

  it('seleccionar imagen muestra preview con confirmar/cancelar', async () => {
    render(<ProductEditButton productId={99} slug="vela-test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))
    await waitFor(() => {
      expect(screen.getByLabelText('Nombre / título')).toHaveValue('Vela Test')
    })
    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByAltText('Vista previa')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Confirmar subida' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Cancelar' }),
    ).toHaveLength(2)
  })

  it('rechaza archivo no imagen con error visible', async () => {
    render(<ProductEditButton productId={99} slug="vela-test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))
    await waitFor(() => {
      expect(screen.getByLabelText('Nombre / título')).toHaveValue('Vela Test')
    })
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo se permiten imágenes',
    )
  })

  it('mock muestra aviso sin pretender persistir', () => {
    render(<ProductEditButton productId={95001} slug="mock-velas-x-1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))
    expect(
      screen.getByRole('heading', { name: 'Producto provisional' }),
    ).toBeInTheDocument()
  })
})
