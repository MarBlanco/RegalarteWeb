import { describe, it, expect } from 'vitest'
import {
  formatMpAmount,
  buildMpCreatePayload,
  MpOrderBuildError,
} from './orders'

const BACK = {
  successUrl: 'https://tienda.test/checkout/pago/success?order=1&sig=x',
  failureUrl: 'https://tienda.test/checkout/pago/failure?order=1&sig=x',
  pendingUrl: 'https://tienda.test/checkout/pago/pending?order=1&sig=x',
}

describe('MP amounts', () => {
  it('entero sin decimales, fracción con 2', () => {
    expect(formatMpAmount(38900)).toBe('389')
    expect(formatMpAmount(3890000)).toBe('38900')
    expect(formatMpAmount(1050)).toBe('10.50')
  })

  it('rechaza montos inválidos', () => {
    expect(() => formatMpAmount(-1)).toThrow(MpOrderBuildError)
    expect(() => formatMpAmount(10.5)).toThrow(MpOrderBuildError)
  })
})

describe('buildMpCreatePayload', () => {
  it('sin descuento: payload directo y suma exacta', () => {
    const payload = buildMpCreatePayload({
      orderNumber: 'RG-2026-ABCDEF',
      email: 'a@b.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      lines: [
        { name: 'Vela', quantity: 1, unitPrice: 38900 },
        { name: 'Box', quantity: 2, unitPrice: 4500 },
      ],
      total: 47900,
      backUrls: BACK,
    })
    expect(payload.type).toBe('online')
    expect(payload.processing_mode).toBe('manual')
    expect(payload.external_reference).toBe('RG-2026-ABCDEF')
    expect(payload.total_amount).toBe('47900')
    expect(payload.items).toHaveLength(2)
    const sum = payload.items.reduce(
      (acc, it) => acc + Number(it.unit_price) * it.quantity,
      0,
    )
    expect(sum).toBe(47900)
  })

  it('con cupón: distribuye el descuento y la suma cierra al centavo', () => {
    const payload = buildMpCreatePayload({
      orderNumber: 'RG-2026-00001',
      email: 'a@b.com',
      lines: [
        { name: 'Vela', quantity: 1, unitPrice: 38900 },
        { name: 'Box', quantity: 2, unitPrice: 4500 },
      ],
      total: 43110, // 10% off de 47900
      backUrls: BACK,
    })
    expect(payload.total_amount).toBe('43110')
    const sum = payload.items.reduce(
      (acc, it) => acc + Number(it.unit_price) * it.quantity,
      0,
    )
    expect(sum).toBe(43110)
  })

  it('caso indivisible: 3 unidades con descuento cierra exacto', () => {
    const payload = buildMpCreatePayload({
      orderNumber: 'RG-1',
      email: 'a@b.com',
      lines: [{ name: 'Vela', quantity: 3, unitPrice: 100 }],
      total: 270, // 10% off
      backUrls: BACK,
    })
    const sum = payload.items.reduce(
      (acc, it) => acc + Number(it.unit_price) * it.quantity,
      0,
    )
    expect(sum).toBe(270)
    expect(payload.total_amount).toBe('270')
  })

  it('rechaza total mayor al subtotal y líneas vacías', () => {
    expect(() =>
      buildMpCreatePayload({
        orderNumber: 'RG-1',
        email: 'a@b.com',
        lines: [{ name: 'V', quantity: 1, unitPrice: 100 }],
        total: 200,
        backUrls: BACK,
      }),
    ).toThrow(MpOrderBuildError)
    expect(() =>
      buildMpCreatePayload({
        orderNumber: 'RG-1',
        email: 'a@b.com',
        lines: [],
        total: 100,
        backUrls: BACK,
      }),
    ).toThrow(MpOrderBuildError)
  })
})
