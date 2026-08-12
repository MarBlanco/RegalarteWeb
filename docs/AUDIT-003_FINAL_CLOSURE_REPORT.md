# AUDIT-003 — Final Closure Report

**Audit:** Security & Production Configuration
**Fecha:** 2026-08-12
**Estado:** ✅ CLOSED
**Alcance:** Configuración de seguridad y producción de REGALARTE V1. Sin funcionalidad nueva.

---

## Resumen

AUDIT-003 revisó la superficie de seguridad y configuración de producción del stack **Next.js 16.2.12 + Payload CMS 3.87.1 + PostgreSQL + Cloudflare R2 + Resend + Mercado Pago (mock)**. Se corrigieron los hallazgos claros y de bajo riesgo; los hallazgos que requieren diseño o funcionalidad se documentaron como WARNING para decisión humana antes del Go Live.

Validaciones finales: **lint 0 errores**, **type-check OK**, **51/51 tests OK**, **build de producción OK** (Next 16.2.12, Turbopack).

---

## Correcciones aplicadas

### 1. Escalada de privilegios en `role` (CRITICAL)

El campo `role` de `collections/Users.ts` tenía `access.create: () => true`. El registro público
(`POST /api/users`, self-registration) permitía enviar `role: 'admin'` y obtener acceso total al panel.

**Fix:** `access.create` del campo `role` ahora exige admin/staff. El registro público queda con el
`defaultValue` `retail`; el valor del campo solo lo asignan admin/staff.

### 2. Accesos de colección `users` (MAJOR)

`collections/Users.ts` dejaba abiertos por defecto los accesos restantes de Payload (leer/actualizar todos
los documentos, entrar al panel admin).

**Fix:**
- `access.admin`: solo admin/staff acceden al panel de administración.
- `access.read`: cada usuario lee su propio documento (`/api/users/:id`, `/me`); el resto admin/staff.
- `access.update`: cada usuario actualiza su propio perfil; el resto admin/staff.
- `access.delete`: admin únicamente (sin cambios — se preserva integridad de Orders).

El flujo de perfil (`PATCH /api/users/:id` con `name/phone/whatsapp/province/city/business_name/cuit`)
sigue funcionando porque edita solo el documento propio. El campo `role` no es modificable por el usuario
(update ya era admin/staff).

### 3. Colecciones de catálogo escribibles por el público (MAJOR)

`Media`, `Categories`, `Products`, `ProductTags`, `ProductAttributes` y `ProductImages` solo definían
`access.read`. En Payload el resto de operaciones (create/update/delete) quedan abiertas por defecto, por
lo que cualquier visitante podía crear/editar/borrar contenido y subir archivos al storage.

**Fix:** `create`, `update` y `delete` restringidos a admin/staff en las 6 colecciones. `read` sigue
público para la storefront.

---

## WARNING — Requieren decisión (no se corrigieron)

Estos hallazgos requieren funcionalidad nueva o diseño; quedan documentados para una decisión explícita.

| # | Hallazgo | Riesgo | Acción sugerida |
|---|----------|--------|-----------------|
| W-01 | **Precios confiados del cliente.** `lib/orders/service.ts` calcula el total desde `item.price` / `item.wholesalePrice` enviados por el cliente (`POST /api/orders`). Permite manipular montos. | Alto (fraude) al conectar el pago real | Recalcular precios server-side desde la DB (query por `productId`) antes de TICKET-010 real. NO bloquear la V1 (provider es mock). |
| W-02 | **Sin rate limiting.** `POST /api/orders` y `POST /api/users` no tienen límite de peticiones. | Medio (abuso/DoS/spam) | Middleware + límite por IP (a decidir libería/estrategia). |
| W-03 | **Token JWT en localStorage.** `hooks/use-auth.ts` persiste `token` en localStorage vía zustand persist. | Medio (exfiltración vía XSS) | Migrar a cookie httpOnly con middleware de sesión. |
| W-04 | **`verify: false` en Users.** Registro público sin verificación de email; sin embargo existe la página `/auth/verify` que apunta a `/api/users/verify` (endpoint inexistente con `verify: false`). | Medio (emails no verificados / email bombing) | Habilitar `verify: true` + flujo de verificación, o eliminar la página huérfana. |
| W-05 | **`customer_type` auto-declarado.** El registro público permite declararse WHOLESALE sin aprobación admin (flujo actual de la página de registro). | Bajo (impacto informativo; precios mayoristas no dependen del rol) | Si se exige aprobación manual, restringir assignment a admin/staff. |
| W-06 | **CodeRabbit inactivo** (`.coderabbit.yaml.disabled`, TICKET-033 pendiente) y Dependabot con majors postergados (Next 16, Tailwind 4, TS 6, GraphQL 17). | Bajo | Activar CodeRabbit con owner; gestionar majors fuera de auditorías. |

---

## Checklist de configuración verificada como OK

- **Security headers** en `next.config.mjs`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Permitted-Cross-Domain-Policies`, `Permissions-Policy` (camera/mic/geoloc off), `Strict-Transport-Security` en producción. `poweredByHeader: false`.
- **Imágenes**: `remotePatterns` restringido (`media.regalarte.com`, `*.r2.cloudflarestorage.com`, dev localhost/127.0.0.1).
- **Secretos**: no hay keys reales en el repo ni en `.env.example` (placeholders). `PAYLOAD_SECRET` requerido por entorno. Email Resend y storage R2 se activan solo si la key no es placeholder.
- **CORS**: sin cabeceras de CORS amplias; mismos orígenes por defecto.
- **API Orders**: solo una ruta custom (`POST /api/orders`) con validación manual, `Cache-Control: no-store` y sin leak de stack traces.
- **Payments**: `MercadoPagoProvider` es mock estructural, sin SDK/fetch/credenciales en el bundle cliente. El factory separa secretos del cliente.
- **CommerceSettings** (global): `read` público, `update` admin/staff. OK.
- **SonarCloud**: Quality Gate OK. **CodeQL**: PASS (1 alerta pre-existente `js/prototype-pollution-utility` del 2026-08-06, no introducida por este cambio).

---

## Impacto

- No se modificaron contratos públicos de UI ni de la API de Payments.
- La storefront mantiene `read` abierto en catálogo/media/orders-create.
- Ninguno de los 51 tests se modificó; todos pasan.
- Build de producción completo exitoso.