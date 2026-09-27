import { describe, it, expect, vi } from 'vitest'
import {
  computePlan,
  applyPlan,
  type ExportData,
  type SyncClient,
} from './apply'
import type { Rec } from './plan'

const SRC: ExportData = {
  categories: [
    { id: 1, title: 'Velas', slug: 'velas', active: true, sortOrder: 0 },
    { id: 2, title: 'Hija', slug: 'hija', active: true, parent: 1 },
  ],
  tags: [
    { id: 11, name: 'Vainilla', slug: 'vainilla-nota', kind: 'aroma', active: true },
    { id: 12, name: 'Sucia', slug: 'sucia', active: false },
  ],
  attributes: [
    {
      id: 21,
      name: 'Salida',
      slug: 'nota-salida',
      active: true,
      values: [{ value: 'Vainilla', sortOrder: 0 }],
    },
  ],
  products: [
    {
      id: 31,
      title: 'Vela',
      slug: 'vela',
      active: true,
      price: 100,
      stock: 5,
      category: 1,
      tags: [11],
      attributes: [21],
    },
    { id: 32, title: 'Mala', slug: 'sdsdsdsdsdsd', active: true, price: 1, category: 1 },
    { id: 33, title: 'Off', slug: 'off', active: false, price: 1, category: 1 },
  ],
  globals: {
    'home-content': { id: 1, title: 'T', createdAt: 'x', updatedAt: 'y' },
    'pdp-content': { id: 2, faq: 'F', createdAt: 'x', updatedAt: 'y' },
  },
}

const EMPTY_DST: ExportData = {
  categories: [],
  tags: [],
  attributes: [],
  products: [],
  globals: { 'home-content': null, 'pdp-content': null },
}

interface FakeStore {
  seq: number
  byCollection: Record<string, Rec[]>
  globals: Record<string, Rec>
  calls: string[]
}

function newStore(): FakeStore {
  return { seq: 1000, byCollection: {}, globals: {}, calls: [] }
}

function fakeClient(store: FakeStore): SyncClient {
  return {
    create: async (collection, data) => {
      const doc = { ...data, id: store.seq++ }
      ;(store.byCollection[collection] ??= []).push(doc)
      store.calls.push(`create:${collection}:${data.slug}`)
      return doc
    },
    update: async (collection, id, data) => {
      store.calls.push(`update:${collection}:${id}`)
      const pool = store.byCollection[collection] ?? []
      const doc = pool.find((d) => d.id === id)
      if (doc) Object.assign(doc, data)
      return { ...(doc ?? {}), ...data, id }
    },
    updateGlobal: async (slug, data) => {
      store.calls.push(`global:${slug}`)
      store.globals[slug] = { ...data }
    },
  }
}

function dstFromStore(store: FakeStore): ExportData {
  return {
    categories: store.byCollection.categories ?? [],
    tags: store.byCollection['product-tags'] ?? [],
    attributes: store.byCollection['product-attributes'] ?? [],
    products: store.byCollection.products ?? [],
    globals: {
      'home-content': store.globals['home-content'] ?? null,
      'pdp-content': store.globals['pdp-content'] ?? null,
    },
  }
}

describe('computePlan', () => {
  it('destino vacío: todo create + globals update, basura excluida', () => {
    const plan = computePlan(SRC, EMPTY_DST)
    const ops = (c: string) =>
      plan.actions.filter((a) => a.collection === c).map((a) => `${a.slug}:${a.op}`)
    expect(ops('categories')).toEqual(['velas:create', 'hija:create'])
    expect(ops('product-tags')).toEqual(['vainilla-nota:create'])
    expect(ops('product-attributes')).toEqual(['nota-salida:create'])
    expect(ops('products')).toEqual(['vela:create'])
    expect(plan.globalActions).toEqual([
      { global: 'home-content', op: 'update' },
      { global: 'pdp-content', op: 'update' },
    ])
    expect(plan.warnings.join('\n')).toMatch(/sdsdsdsdsdsd/)
    expect(plan.warnings.join('\n')).toMatch(/off/)
  })

  it('destino igual: todo unchanged (idempotente)', () => {
    const dst: ExportData = {
      categories: [
        { id: 101, title: 'Velas', slug: 'velas', active: true, sortOrder: 0 },
        { id: 102, title: 'Hija', slug: 'hija', active: true, parent: 101 },
      ],
      tags: [
        { id: 111, name: 'Vainilla', slug: 'vainilla-nota', kind: 'aroma', active: true },
      ],
      attributes: [
        {
          id: 121,
          name: 'Salida',
          slug: 'nota-salida',
          active: true,
          values: [{ value: 'Vainilla', sortOrder: 0 }],
        },
      ],
      products: [
        {
          id: 131,
          title: 'Vela',
          slug: 'vela',
          active: true,
          price: 100,
          stock: 5,
          soldOut: false,
          featured: false,
          isSolistica: false,
          sortOrder: 0,
          category: 101,
          tags: [111],
          attributes: [121],
        },
      ],
      globals: {
        'home-content': { id: 201, title: 'T' },
        'pdp-content': { id: 202, faq: 'F' },
      },
    }
    const plan = computePlan(SRC, dst)
    expect(plan.actions.filter((a) => a.op !== 'unchanged')).toEqual([])
    expect(plan.globalActions.every((g) => g.op === 'unchanged')).toBe(true)
  })

  it('global ausente en origen se omite con aviso', () => {
    const plan = computePlan(
      { ...SRC, globals: { 'home-content': null, 'pdp-content': null } },
      EMPTY_DST,
    )
    expect(
      plan.globalActions.every((g) => g.op === 'unchanged'),
    ).toBe(true)
    expect(plan.warnings.join('\n')).toMatch(/ausente en origen/)
  })

  it('cambio en origen → update con destId, sin tocar active', () => {
    const dst: ExportData = {
      ...EMPTY_DST,
      products: [
        { id: 131, title: 'Vela VIEJA', slug: 'vela', active: true, price: 100, category: 101, tags: [], attributes: [] },
      ],
      categories: [{ id: 101, title: 'Velas', slug: 'velas', active: true, sortOrder: 0 }],
      globals: { 'home-content': null, 'pdp-content': null },
    }
    const plan = computePlan(SRC, dst)
    const upd = plan.actions.find(
      (a) => a.collection === 'products' && a.slug === 'vela',
    )
    expect(upd).toMatchObject({ op: 'update', destId: 131 })
  })
})

describe('applyPlan con cliente falso', () => {
  it('crea en orden con relaciones resueltas y active=true', async () => {
    const plan = computePlan(SRC, EMPTY_DST)
    const store = newStore()
    await applyPlan(fakeClient(store), plan, EMPTY_DST)

    const creates = store.calls.filter((c) => c.startsWith('create:'))
    expect(creates[0]).toBe('create:categories:velas')
    expect(creates).toContain('create:categories:hija')
    expect(creates).toContain('create:products:vela')
    // hija tiene parent resuelto al id creado de velas (1000)
    expect(store.calls).toContain('update:categories:1001')
    // producto con categoría/tags/attrs resueltos a ids destino
    const vela = store.byCollection.products.find((d) => d.slug === 'vela')
    expect(vela).toMatchObject({
      category: 1000,
      tags: [1002],
      attributes: [1003],
      active: true,
    })
    // globals actualizados y nada de basura
    expect(store.calls).toContain('global:home-content')
    expect(store.calls).toContain('global:pdp-content')
    expect(store.calls.join('\n')).not.toMatch(/sdsdsdsdsdsd/)
  })

  it('segunda corrida no escribe nada (idempotencia total)', async () => {
    const store = newStore()
    await applyPlan(fakeClient(store), computePlan(SRC, EMPTY_DST), EMPTY_DST)
    const firstCalls = store.calls.length
    expect(firstCalls).toBeGreaterThan(0)
    store.calls.length = 0

    const second = computePlan(SRC, dstFromStore(store))
    expect(second.actions.filter((a) => a.op !== 'unchanged')).toEqual([])
    expect(second.globalActions.every((g) => g.op === 'unchanged')).toBe(true)
    await applyPlan(fakeClient(store), second, dstFromStore(store))
    expect(store.calls).toEqual([])
  })

  it('nunca escribe active en updates', async () => {
    const dst: ExportData = {
      ...EMPTY_DST,
      categories: [{ id: 101, title: 'Velas', slug: 'velas', active: false, sortOrder: 9 }],
      globals: { 'home-content': null, 'pdp-content': null },
    }
    const store = newStore()
    const updateSpy = vi.fn()
    const client = fakeClient(store)
    const origUpdate = client.update
    client.update = async (...args) => {
      updateSpy(args[2])
      return origUpdate(...args)
    }
    await applyPlan(client, computePlan(SRC, dst), dst)
    for (const data of updateSpy.mock.calls.map((c) => c[0] as Rec)) {
      expect(data).not.toHaveProperty('active')
    }
  })
})

