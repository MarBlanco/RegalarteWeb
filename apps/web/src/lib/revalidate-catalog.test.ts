import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))

const { revalidatePath, revalidateTag } = await import('next/cache')
const { revalidateCatalog, revalidateStorefrontPages } = await import('./revalidate-catalog')

beforeEach(() => vi.clearAllMocks())

describe('revalidateCatalog', () => {
  it('expira cada tag al instante y purga todas las páginas de la tienda', () => {
    revalidateCatalog('products', 'categories')
    expect(revalidateTag).toHaveBeenCalledTimes(2)
    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('categories', { expire: 0 })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('revalidateStorefrontPages solo purga páginas (contenido sin tag)', () => {
    revalidateStorefrontPages()
    expect(revalidateTag).not.toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })
})
