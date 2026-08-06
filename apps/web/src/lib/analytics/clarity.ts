/**
 * Microsoft Clarity — integration layer for TICKET-024.
 *
 * Contrato:
 *   - El snippet oficial de Clarity se carga una sola vez via <Clarity /> en
 *     el root layout, solo en production y solo si
 *     NEXT_PUBLIC_CLARITY_PROJECT_ID esta configurado (distinto de
 *     placeholder). En dev o sin ID, no emite nada.
 *   - Sin backend: Clarity es solo un script de grabacion de sesiones
 *     (heatmaps, recordings), no requiere llamadas a una API propia.
 *   - No agrega librerias ni dependencias: usa next/script (ya disponible).
 */

export const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? ''

export function isClarityEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    Boolean(CLARITY_PROJECT_ID) &&
    CLARITY_PROJECT_ID !== 'placeholder-clarity-project-id'
  )
}
