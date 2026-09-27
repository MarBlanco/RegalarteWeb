import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  parseSignature,
  buildManifest,
  verifyWebhookSignature,
  validateMpOrderForPaid,
  mapMpStatus,
} from './webhook'

const SECRET = 'test-secret'

function sign(dataId: string, requestId: string, ts: string): string {
  const manifest = buildManifest(dataId, requestId, ts)
  const v1 = createHmac('sha256', SECRET).update(manifest).digest('hex')
  return `ts=${ts},v1=${v1}`
}

describe('webhook signature (esquema oficial MP)', () => {
  it('firma válida pasa', () => {
    const xSignature = sign('ORD123', 'req-1', '1704908010')
    expect(
      verifyWebhookSignature(
        { xSignature, xRequestId: 'req-1', dataId: 'ORD123' },
        SECRET,
      ),
    ).toBe(true)
  })

  it('dataId adulterado no pasa', () => {
    const xSignature = sign('ORD123', 'req-1', '1704908010')
    expect(
      verifyWebhookSignature(
        { xSignature, xRequestId: 'req-1', dataId: 'ORD999' },
        SECRET,
      ),
    ).toBe(false)
  })

  it('secret distinto no pasa', () => {
    const xSignature = sign('ORD123', 'req-1', '1704908010')
    expect(
      verifyWebhookSignature(
        { xSignature, xRequestId: 'req-1', dataId: 'ORD123' },
        'otro',
      ),
    ).toBe(false)
  })

  it('faltantes no pasan', () => {
    expect(
      verifyWebhookSignature({ xSignature: null, xRequestId: 'r', dataId: 'd' }, SECRET),
    ).toBe(false)
    expect(
      verifyWebhookSignature({ xSignature: 'basura', xRequestId: 'r', dataId: 'd' }, SECRET),
    ).toBe(false)
    expect(
      verifyWebhookSignature(
        { xSignature: sign('d', 'r', '1'), xRequestId: null, dataId: 'd' },
        SECRET,
      ),
    ).toBe(false)
  })

  it('parseSignature tolera orden de partes', () => {
    expect(parseSignature('v1=abc,ts=123')).toEqual({ ts: '123', v1: 'abc' })
    expect(parseSignature('ts=123,v1=abc')).toEqual({ ts: '123', v1: 'abc' })
  })
})

const BASE_MP = {
  id: 'ORD123',
  status: 'processed',
  external_reference: 'RG-2026-ABCDEF',
  total_amount: '100',
  total_paid_amount: '100',
  currency: 'ARS',
}

describe('validateMpOrderForPaid', () => {
  const expected = { orderNumber: 'RG-2026-ABCDEF', total: 100 }

  it('orden correcta aprueba', () => {
    expect(validateMpOrderForPaid(BASE_MP, expected)).toEqual({
      ok: true,
      reason: 'ok',
    })
  })

  it('rechaza referencia, estado, moneda y montos', () => {
    expect(
      validateMpOrderForPaid(
        { ...BASE_MP, external_reference: 'RG-OTRA' },
        expected,
      ).ok,
    ).toBe(false)
    expect(
      validateMpOrderForPaid({ ...BASE_MP, status: 'created' }, expected).ok,
    ).toBe(false)
    expect(
      validateMpOrderForPaid({ ...BASE_MP, currency: 'USD' }, expected).ok,
    ).toBe(false)
    expect(
      validateMpOrderForPaid({ ...BASE_MP, total_amount: '200' }, expected).ok,
    ).toBe(false)
    expect(
      validateMpOrderForPaid(
        { ...BASE_MP, total_paid_amount: '50' },
        expected,
      ).ok,
    ).toBe(false)
    expect(validateMpOrderForPaid({} as never, expected).ok).toBe(false)
  })
})

describe('mapMpStatus', () => {
  it('mapea estados conocidos y defaultea a pending', () => {
    expect(mapMpStatus('processed')).toBe('approved')
    expect(mapMpStatus('action_required')).toBe('in_process')
    expect(mapMpStatus('cancelled')).toBe('cancelled')
    expect(mapMpStatus('created')).toBe('pending')
    expect(mapMpStatus(undefined)).toBe('pending')
  })
})
