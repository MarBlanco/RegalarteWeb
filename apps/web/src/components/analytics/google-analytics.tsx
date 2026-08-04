import Script from 'next/script'
import { GA_MEASUREMENT_ID } from '@/lib/analytics/ga'

/**
 * <GoogleAnalytics /> — inyecta gtag.js en el root layout.
 *
 * - Solo renderiza en production y si NEXT_PUBLIC_GA_MEASUREMENT_ID esta
 *   configurado (distinto de placeholder). En dev o sin ID no emite nada.
 * - Usa next/script con strategy="afterInteractive" para no bloquear el FCP.
 * - Inyecta el config inicial, que dispara el page_view automatico.
 *
 * Los page_view en navegaciones client-side (App Router) los dispara gtag
 * automaticamente via el snippet de config en cada route change, porque el
 * script viven en el layout raiz.
 */
export function GoogleAnalytics() {
  if (
    process.env.NODE_ENV !== 'production' ||
    !GA_MEASUREMENT_ID ||
    GA_MEASUREMENT_ID === 'G-PLACEHOLDER'
  ) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  )
}
