import Script from 'next/script'
import { CLARITY_PROJECT_ID } from '@/lib/analytics/clarity'

/**
 * <Clarity /> — inyecta el snippet oficial de Microsoft Clarity en el
 * root layout.
 *
 * - Solo renderiza en production y si NEXT_PUBLIC_CLARITY_PROJECT_ID esta
 *   configurado (distinto de placeholder). En dev o sin ID no emite nada.
 * - Usa next/script con strategy="afterInteractive" para no bloquear el FCP.
 * - Reutiliza el mismo patron que <GoogleAnalytics /> (TICKET-022).
 */
export function Clarity() {
  if (
    process.env.NODE_ENV !== 'production' ||
    !CLARITY_PROJECT_ID ||
    CLARITY_PROJECT_ID === 'placeholder-clarity-project-id'
  ) {
    return null
  }

  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
      `}
    </Script>
  )
}
