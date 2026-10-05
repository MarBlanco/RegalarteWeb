import { describe, it, expect } from 'vitest'
import { DEFAULT_SOCIAL_LINKS, resolveSocialLinks } from './site-settings'

describe('resolveSocialLinks', () => {
  it('sin datos guardados devuelve los defaults actuales', () => {
    expect(resolveSocialLinks(null)).toEqual(DEFAULT_SOCIAL_LINKS)
    expect(resolveSocialLinks({})).toEqual(DEFAULT_SOCIAL_LINKS)
    expect(resolveSocialLinks({ instagramUrl: '' })).toEqual(DEFAULT_SOCIAL_LINKS)
  })

  it('usa los enlaces https guardados', () => {
    const links = resolveSocialLinks({
      instagramUrl: 'https://instagram.com/solistica',
      whatsappUrl: ' https://wa.me/5491100000000 ',
    })
    expect(links.instagram).toBe('https://instagram.com/solistica')
    expect(links.whatsapp).toBe('https://wa.me/5491100000000')
    expect(links.tiktok).toBe(DEFAULT_SOCIAL_LINKS.tiktok)
  })

  it('descarta esquemas no https (javascript:, http:, data:)', () => {
    const links = resolveSocialLinks({
      instagramUrl: 'javascript:alert(1)',
      tiktokUrl: 'http://tiktok.com/x',
      facebookUrl: 'data:text/html,hola',
      whatsappUrl: 'wa.me/549',
    })
    expect(links).toEqual(DEFAULT_SOCIAL_LINKS)
  })
})
