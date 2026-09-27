import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { CatalogSidebar } from './catalog-sidebar'
import type { FilterFacets } from '@/lib/catalog'

const pushMock = vi.fn()

vi.mock('next/navigation', () => {
  const stableParams = new URLSearchParams('category=velas')
  return {
    useRouter: () => ({
      push: pushMock,
      replace: vi.fn(),
      prefetch: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => '/catalogo',
    useSearchParams: () => stableParams,
  }
})

const FACETS: FilterFacets = {
  aromas: [
    { id: 11, slug: 'vainilla-nota', name: 'Vainilla', color: '#E9C893', count: 3 },
    { id: 12, slug: 'ambar-nota', name: 'Ámbar', color: null, count: 5 },
  ],
  rituales: [
    { id: 21, slug: 'relajacion', name: 'Relajación', color: null, count: 0 },
    { id: 22, slug: 'energia', name: 'Energía', color: null, count: 0 },
  ],
  bounds: { min: 0, max: 50000 },
}

beforeEach(() => {
  useAuth.setState({ user: null, token: null })
  pushMock.mockClear()
})

describe('Sidebar — opciones reales con contadores', () => {
  it('muestra 2 aromas + 2 rituales con sus conteos y bounds reales', () => {
    render(<CatalogSidebar facets={FACETS} />)
    expect(
      screen.getByRole('checkbox', { name: /Vainilla\(3\)/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /Ámbar\(5\)/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /Relajación\(0\)/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /Energía\(0\)/ }),
    ).toBeInTheDocument()
    const norm = (s: string | null) => (s ?? '').replace(/[\s ]+/g, ' ')
    expect(
      screen.getByText((_, el) => norm(el?.textContent ?? '') === '$ 0'),
    ).toBeInTheDocument()
    expect(
      screen.getByText((_, el) => norm(el?.textContent ?? '') === '$ 50.000'),
    ).toBeInTheDocument()
  })

  it('Vainilla + Relajación se aplican combinados en la URL', async () => {
    render(<CatalogSidebar facets={FACETS} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Vainilla\(3\)/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Relajación\(0\)/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        '/catalogo?category=velas&aroma=vainilla-nota&ritual=relajacion',
      )
    })
  })

  it('sin staff no hay controles de edición de opciones', () => {
    render(<CatalogSidebar facets={FACETS} />)
    expect(screen.queryByText('+ Agregar')).toBeNull()
    expect(screen.queryByRole('button', { name: /Editar/ })).toBeNull()
  })
})
