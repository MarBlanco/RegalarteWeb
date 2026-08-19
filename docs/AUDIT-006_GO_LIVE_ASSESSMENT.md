# AUDIT-006 — Go Live Assessment (Release & Production Readiness)

**Audit:** Release & Production Readiness
**Fecha:** 2026-08-12
**Estado:** ✅ CLOSED (2026-08-18) — BLOCKERS reales resueltos y verificados en Production
**Alcance:** Determinar si REGALARTE V1 está preparada para producción.

---

## Motivo del resultado

AUDIT-006 se abre como **OPEN** con **3 BLOCKERS reales de producción** que requerían
infraestructura/cuenta/credenciales externas (deploy/hosting, PostgreSQL de producción,
Cloudflare R2). El resto de ítems fue reevaluado contra la documentación aprobada y
reclasificado como **ACCEPTED / DEFERRED** (ver "Reevaluación 2026-08-13").

**Cierre 2026-08-18:** los 3 BLOCKERS quedaron resueltos y verificados en Production:
- **Deploy/hosting**: Vercel Production operativo (proyecto `regalarte-web-web`, root `apps/web`,
  dominio canónico `https://regalarte-web-web.vercel.app`); `/`, `/admin`, `/api/products` y
  `/api/globals/commerce-settings` responden 200. `PAYLOAD_SECRET` configurado.
- **PostgreSQL de producción**: Neon operativo; 3 migraciones aplicadas (20260723, 20260730,
  20260818) vía `migrate-on-build` en el build de Vercel; endpoints DB responden datos reales.
- **Cloudflare R2**: 4 vars (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
  `R2_ENDPOINT`) configuradas en Vercel; endpoint corregido a `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
  y validado (DNS + superficie S3 R2 viva); plugin `s3Storage` activo en prod (media +
  product-images) y componente cliente `S3ClientUploadHandler` en el importMap (admin OK).

---

## Estado por área

| Área | Estado | Detalle |
|------|--------|---------|
| **Deploy** | ✅ **RESUELTO** | Vercel Production operativo: proyecto `regalarte-web-web`, root `apps/web`, `vercel.json` con `buildCommand` (migración + build), dominio canónico `https://regalarte-web-web.vercel.app`. `/`, `/admin`, `/api/products`, `/api/globals/commerce-settings` responden 200. `PAYLOAD_SECRET` configurado (Production). |
| **Database** | ✅ **RESUELTO** | PostgreSQL de producción (Neon) operativo: **3 migraciones** versionadas aplicadas (20260723, 20260730, 20260818) en el build de Vercel (`scripts/migrate-on-build.mjs`), `prodMigrations` bundleado. Endpoints de Payload responden contra la DB prod (products, commerce-settings). |
| **Storage (R2)** | ✅ **RESUELTO** | 4 vars (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`) configuradas en Vercel (preview+production). `R2_ENDPOINT` corregido a `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` y validado (DNS + respuesta S3 API viva). `s3Storage` activo en prod (media + product-images, bucket `regalarte-media`); `S3ClientUploadHandler` presente en el importMap (admin renderiza). Test funcional de upload: requiere login admin (acción de owner, opcional). |
| **Pagos (Mercado Pago)** | ✅ **ACCEPTED** | Provider **mock estructural**; TICKET-010 real pendiente (preference vía backend, webhook server-validado, reconciliación). **No bloquea V1 según docs aceptadas** (AUDIT-003 W-01: "NO bloquear la V1"; AUDIT-004/005: sin dinero real). Implicación comercial: orders quedan `pending` gestionadas por admin — decisión de producto tomada y documentada. |
| **Email (Resend)** | 📦 **DEFERRED/ACCEPTED** | Adapter ya cableado en `payload.config.ts` (activado con key real, no placeholder). `Users.auth.verify: false` → el correo **no es requerido** para registro/login/compra. Solo forgot/reset-password dependen de Resend; sin key, esos envíos no llegan (degradación operativa, no bloqueo). Owner: agregar `RESEND_API_KEY` real + dominio verificado cuando se defina. TICKET-025 (leads) sigue BLOCKED sin spec. |
| **Dominio / HTTPS** | 📦 **DEFERRED (no bloquea V1)** | El hosting de producción provee URL provisional con HTTPS automático — V1 puede operar sin dominio custom. `NEXT_PUBLIC_APP_URL` real y dominio propio = paso de branding/owner posterior al deploy. `next.config.mjs` ya emite HSTS en prod y restringe remotePatterns (incluye `media.regalarte.com`). |
| **Observabilidad** | 📦 **DEFERRED (no bloquea V1)** | Sin spec aprobada (TICKET-030 BLOCKED): solo `console.*`, sin logs estructurados, health checks, métricas ni alertas. Es hardening post-lanzamiento. Analytics de producto (GA/PostHog/Clarity) ya cableados, gated por keys placeholder. V1 opera sin observabilidad completa. |
| **Seguridad operativa** | ✅ OK (repo) | `.env.local` y `.env*` gitignored (secrets fuera del repo). GitHub Secrets configurados (CI/SonarCloud/CodeQL pasan → SONAR_TOKEN presente). Acceso admin vía Payload restringido (AUDIT-003). Falta (externo): secrets de producción en el hosting. |
| **Backups / Recovery** | 📦 **DEFERRED (no bloquea V1)** | No existe backup/restore (TICKET-031 BLOCKED, sin spec, sin DB prod). Es operación post-lanzamiento: requiere definir spec RPO/RTO y respaldar la DB prod una vez exista. No impide la operación diaria de V1. |
| **Release** | 📦 **DEFERRED (gated por BLOCKERS reales)** | Versión `0.x` (root `0.0.0`, web `0.1.0`), sin tag RC, sin checklist Go Live. Regla vigente (WORKING.md): "El repositorio no debe declararse Release Candidate hasta resolver los BLOCKERS del assessment". Los entregables Sprint 8 (PWA, Testing E2E, R2, Tag RC, doc final) se completan tras provisionar deploy/DB/R2. |

---

## Qué está verificado como listo (técnicamente)

- **Build producción**: OK en CI y local (Next 16.2.12, Turbopack); type-check/lint/tests pasan (65 tests).
- **Integridad comercial**: precios server-side (AUDIT-004), guard de transiciones de estado (AUDIT-005), accesos hardening (AUDIT-003).
- **Milestones de calidad**: AUDIT-001..005 CLOSED; CI/CodeRabbit/SonarCloud/CodeQL PASS en cada PR.
- **Security headers / HSTS / remotePatterns / poweredByHeader**: OK.

---

## Dependencias pendientes formalizadas (de AUDIT-004/005)

| Ítem | Clasificación | Ventana |
|------|---------------|---------|
| Mercado Pago real (TICKET-010) | DEFERRED — no bloquea V1 (docs aceptadas) | Post-V1 / fase de dinero real |
| Idempotencia (`requestId` unique + migración) | DEFERRED | Juntar con ventana TICKET-010 |
| Stock (validación + descuento transaccional + reversión) | DEFERRED / BLOCKER pre-pagos reales | Decide producto + TICKET-010 |
| Webhook/confirmación + reconciliación pago↔orden | DEFERRED | TICKET-010 |

---

## Checklist GO LIVE

**BLOCKERS reales (resueltos 2026-08-18):**

1. ✅ Definir hosting de producción: **Vercel project (root `apps/web`)** operativo; probado en prod (`/`, `/admin`, APIs 200). `NEXT_PUBLIC_APP_URL` real = paso de branding/dominio posterior (DEFERRED).
2. ✅ Provisionar **PostgreSQL de producción** (Neon) + aplicar migraciones (`migrate-on-build` en build de Vercel) + esquema verificado (endpoints DB 200).
3. ✅ Configurar **Cloudflare R2**: 4 vars en Vercel, endpoint corregido y validado, plugin `s3Storage` activo en prod. *Pendiente opcional de owner: subir una media de prueba en `/admin` (requiere login).*

**ACCEPTED / DEFERRED (no bloquean V1 — pasos posteriores):**

4. Definir **dominio + SSL** (V1 opera con URL provisional + HTTPS del hosting; dominio = branding/owner).
5. Definir y aprobar **spec de backups/RPO/RTO** (TICKET-031) e implementar/reprobar restore — post-lanzamiento.
6. Definir **spec de observabilidad mínima** (TICKET-030): logs/health + analytics con keys reales — post-lanzamiento.
7. Configurar **Resend** con dominio verificado y probar emails críticos (forgot/reset).
8. (Ya decidido/ACCEPTED) Pagos: mock con gestión manual vs TICKET-010 (dinero real).
9. **Versión 1.0.0 + tag RC** + checklist Go Live + procedimiento de rollback — habilitado tras resolver ítems 1–3.

---

## Impacto

Documento sin cambios de código productivo. No se modifican funcionalidades ni arquitectura.

---

## Reevaluación 2026-08-13 — clasificación final de los puntos pendientes

Decisiones tomadas contra la documentación aprobada (AUDIT-003/004/005 CLOSED, PRD,
arquitectura, TICKET-025/030/031 BLOCKER reports). Criterio: un ítem es BLOCKER solo si
impide físicamente que V1 opere; no se deja BLOCKER por "producción aún no configurada"
si V1 puede funcionar sin ello.

| # | Punto | Clasificación | Motivo (referencia a la documentación) |
|---|-------|---------------|----------------------------------------|
| 1 | **Deploy / hosting (Vercel)** | 🚫 **BLOCKER REAL** | Sin hosting no hay URL pública → V1 inaccesible para clientes. Acción de owner (cuenta Vercel, root `apps/web`). No es codificable en el repo. |
| 2 | **PostgreSQL de producción** | 🚫 **BLOCKER REAL** | Sin DB prod no hay persistencia (catálogo/órdenes/usuarios) → la app no opera. Repo listo: `prodMigrations` + 2 migraciones (Ronda 1). Solo falta provisionar y `npm run migrate` (owner). |
| 3 | **Cloudflare R2** | 🚫 **BLOCKER REAL** | En hosting serverless, sin R2 la media del catálogo es efímera (no persiste entre redeploys). Config de repo corregida (Ronda 1: `media` + `product-images`); keys/bucket = owner. |
| 4 | **Dominio / HTTPS** | 📦 DEFERRED | El hosting provee HTTPS en URL provisional; V1 opera sin dominio custom. Dominio definitivo = branding/owner, post-deploy. |
| 5 | **Resend (email)** | 📦 DEFERRED / ACCEPTED | `Users.auth.verify: false` → el email no es requisito de registro/login/compra. Solo forgot/reset dependen de Resend. Adapter ya cableado; key real = owner. Ver `collections/Users.ts`. |
| 6 | **Backups / RPO-RTO** | 📦 DEFERRED | TICKET-031 BLOCKED sin spec y sin DB prod. Operación post-lanzamiento; no impide la operación diaria. |
| 7 | **Observabilidad** | 📦 DEFERRED | TICKET-030 BLOCKED sin spec. Analytics ya cableados; health/logs = hardening post-lanzamiento. |
| 8 | **Pagos (Mercado Pago)** | ✅ ACCEPTED | Decisión documentada: AUDIT-003 W-01 "NO bloquear la V1", AUDIT-004 W-02, AUDIT-005 D-01/D-02/D-03. Provider mock; órdenes `pending` gestionadas por admin. |
| 9 | **Release / tag RC** | 📦 DEFERRED (gated) | WORKING.md: "El repositorio no debe declararse Release Candidate hasta resolver los BLOCKERS del assessment". Sin los ítems 1–3 no se fabrica RC. |

**Conclusión (2026-08-18):** AUDIT-006 queda **CLOSED**. Los 3 BLOCKERS reales (deploy, DB prod,
R2) fueron resueltos y verificados en Production. Ningún otro punto impide Go Live según la
documentación aprobada; los ítems ACCEPTED/DEFERRED (dominio, backups, observabilidad, Resend,
pagos, tag RC) son pasos posteriores planificados en la hoja de ruta.