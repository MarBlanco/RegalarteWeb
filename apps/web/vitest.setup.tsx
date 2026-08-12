import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll } from 'vitest'

// Mock localStorage for cart store
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Suppress console.error in tests for expected errors
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (args[0]?.includes?.('Warning:') || args[0]?.includes?.('act(')) return
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})
afterAll(() => {
  console.error = originalError
})