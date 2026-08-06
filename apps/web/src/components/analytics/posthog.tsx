import Script from 'next/script'
import { POSTHOG_KEY, POSTHOG_HOST } from '@/lib/analytics/posthog'

/**
 * <PostHog /> — inyecta el snippet nativo de PostHog en el root layout.
 *
 * - Solo renderiza en production y si NEXT_PUBLIC_POSTHOG_KEY esta
 *   configurado (distinto de placeholder). En dev o sin key no emite nada.
 * - Usa next/script con strategy="afterInteractive" para no bloquear el FCP.
 * - Reutiliza el mismo patron que <GoogleAnalytics /> (TICKET-022) y
 *   <Clarity /> (TICKET-024). Sin libreria posthog-js.
 */
export function PostHog() {
  if (
    process.env.NODE_ENV !== 'production' ||
    !POSTHOG_KEY ||
    POSTHOG_KEY === 'placeholder-posthog-key'
  ) {
    return null
  }

  return (
    <Script id="posthog-init" strategy="afterInteractive">
      {`
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=window.posthog||function(){(window.posthog.q=window.posthog.q||[]).push(arguments)},window.posthog._i=[],window.posthog.init=function(t,e,o){function i(t,e){var n=e.split(".");2==n.length&&(t=t[n[0]],e=n[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(window.posthog._i,"init capture identify people set set_once register unregister opt_out_capture has_opted_out_capture has_opted_in_capture loaded $import_identify")}),n=o.createElement("script"),n.async=!0,n.src=e.api_host+"/static/array.js",p=o.getElementsByTagName("script")[0],p.parentNode.insertBefore(n,p)}(window,document);
        posthog.init("${POSTHOG_KEY}", {
          api_host: "${POSTHOG_HOST}",
          person_profiles: "identified_only"
        });
      `}
    </Script>
  )
}
