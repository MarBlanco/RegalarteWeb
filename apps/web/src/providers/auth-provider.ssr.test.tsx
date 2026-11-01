// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AuthProvider } from './auth-provider'

describe('AuthProvider — render en servidor', () => {
  it('no rompe sin localStorage (el store persistido no expone `persist` en SSR)', () => {
    const html = renderToString(
      <AuthProvider>
        <span>hijo</span>
      </AuthProvider>,
    )
    expect(html).toContain('hijo')
  })
})
