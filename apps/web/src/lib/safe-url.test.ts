import { describe, it, expect } from 'vitest'
import { safeImageSrc } from './safe-url'

describe('safeImageSrc', () => {
  it('acepta rutas relativas y http/https/blob', () => {
    expect(safeImageSrc('/assets/a.webp')).toBe('/assets/a.webp')
    expect(safeImageSrc('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(safeImageSrc('http://localhost:3000/a.png')).toBe('http://localhost:3000/a.png')
    expect(safeImageSrc('blob:http://localhost:3000/abc-123')).toBe('blob:http://localhost:3000/abc-123')
  })

  it('rechaza esquemas peligrosos, protocolo relativo y valores vacíos', () => {
    expect(safeImageSrc('javascript:alert(1)')).toBeUndefined()
    expect(safeImageSrc('data:text/html;base64,AAAA')).toBeUndefined()
    expect(safeImageSrc('//evil.example.com/a.png')).toBeUndefined()
    expect(safeImageSrc('/\\evil.example.com')).toBeUndefined()
    expect(safeImageSrc('no-es-url')).toBeUndefined()
    expect(safeImageSrc('')).toBeUndefined()
    expect(safeImageSrc(null)).toBeUndefined()
    expect(safeImageSrc(undefined)).toBeUndefined()
  })
})
