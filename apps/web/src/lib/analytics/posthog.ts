/**
 * PostHog — integration layer for TICKET-023.
 *
 * Contrato:
 *   - El snippet nativo de PostHog se carga una sola vez via <PostHog /> en
 *     el root layout, solo en production y solo si NEXT_PUBLIC_POSTHOG_KEY
 *     esta configurado (distinto de placeholder). En dev o sin key, no emite
 *     nada.
 *   - Reutiliza el patron de <GoogleAnalytics /> (TICKET-022) y <Clarity />
 *     (TICKET-024): next/script con strategy="afterInteractive".
 *   - No agrega librerias ni dependencias: usa el snippet oficial de
 *     PostHog vía next/script (sin posthog-js).
 */

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'

export function isPostHogEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    Boolean(POSTHOG_KEY) &&
    POSTHOG_KEY !== 'placeholder-posthog-key' &&
    Boolean(POSTHOG_HOST)
  )
}
