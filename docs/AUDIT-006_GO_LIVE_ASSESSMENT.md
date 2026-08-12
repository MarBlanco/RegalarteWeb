# AUDIT-006 — Go Live Assessment (Release & Production Readiness)

**Audit:** Release & Production Readiness
**Fecha:** 2026-08-12
**Estado:** ❌ OPEN — BLOCKERS externos / decisiones requeridas
**Alcance:** Determinar si REGALARTE V1 está preparada para producción.

---

## Motivo del resultado

AUDIT-006 **no puede cerrarse como CLOSED**: existen BLOCKERS de producción que requieren
configuración externa, credenciales reales o decisión de negocio/owner (no solucionables
desde el repo). Según la propia hoja de ruta del proyecto, el Sprint 8 "RELEASE READINESS"
está **PLANNED**: sus entregables (PWA, Testing E2E, Cloudflare R2 configurado, Tag RC,
Documentación final) dicen explícitamente "Resultado esperado: Go Live listo".

**Se detiene el flujo de cierre por regla de auditoría** (resolver lo automático posible;
detenerse ante configuración externa). No se ejecutó el tag RC, no se fabricó el cierre.

---

## Estado por área

| Área | Estado | Detalle |
|------|--------|---------|
| **Deploy** | 🚫 BLOCKER | Monorepo npm workspaces; app Next en `apps/web`. No hay `vercel.json`, ni proyecto Vercel, ni `rootSettings` de monorepo definidos (Vercel requiere `apps/web` como root). No hay Dockerfile/hosting alternativo. Procedimiento de deploy y rollback de app **no documentados**. |
| **Database** | 🚫 BLOCKER | PostgreSQL: conexión de producción **no definida** (solo URI local en `.env.example`). Esquema con `push:false` y **2 migraciones** versionadas (20260723, 20260730) — aplicables pero sin probar contra DB prod. No hay estrategia de backup (TICKET-031 BLOCKED sin spec). |
| **Storage (R2)** | 🚫 BLOCKER | `s3Storage` gated por placeholders → **inactivo**. `ProductImages`/`Media` usan `staticDir` local. Entregable Sprint 8 "Cloudflare R2 configurado" **pendiente**. URLs públicas privadas y variables requieren keys reales (owner). |
| **Pagos (Mercado Pago)** | 📦 DEFERRED (ACCEPTED) | Provider **mock estructural**; TICKET-010 real pendiente (preference vía backend, webhook server-validado, reconciliación). **NO bloquea V1 según docs aceptadas** (AUDIT-003 W-01: "NO bloquear la V1"; AUDIT-004/005: sin dinero real). Implicación comercial: orders quedan `pending` gestionadas por admin — decisión de producto para lanzamiento. |
| **Email (Resend)** | 🚫 BLOCKER | Adapter gated por placeholder; dominio/remitente de producción y `RESEND_API_KEY` real pendientes (owner). TICKET-025 (leads) BLOCKED. Emails críticos (forgot/reset password) dependen de Resend o quedan sin envío. |
| **Dominio / HTTPS** | 🚫 BLOCKER | No hay dominio de producción definido. `.env.example` usa `NEXT_PUBLIC_APP_URL=http://localhost:3000`. HSTS se emite solo en build prod (correcto). SSL/canonical/redirects = tarea del owner del dominio. |
| **Observabilidad** | 🚫 BLOCKER | Sin spec aprobada (TICKET-030 BLOCKED): solo `console.*`, sin logs estructurados, health checks, métricas ni alertas. Analytics de producto (GA/PostHog/Clarity) sí están cableados pero gated por keys placeholder. |
| **Seguridad operativa** | ✅ OK (repo) | `.env.local` y `.env*` gitignored (secrets fuera del repo). GitHub Secrets configurados (CI/SonarCloud/CodeQL pasan → SONAR_TOKEN presente). Acceso admin vía Payload restringido (AUDIT-003). Falta (externo): secrets de producción en el hosting. |
| **Backups / Recovery** | 🚫 BLOCKER | No existe ningún backup/restore (TICKET-031 BLOCKED, sin spec, sin DB prod). Rollback de app: posible vía deploy anterior (Vercel) pero sin procedimiento documentado. |
| **Release** | 🚫 BLOCKER | Versión `0.x` (root `0.0.0`, web `0.1.0`), sin tag RC, sin checklist Go Live. Entregables Sprint 8 pendientes: PWA, Testing E2E, R2, Tag RC, doc final. |

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

## Checklist GO LIVE requerido (para reabrir y cerrar AUDIT-006)

1. Definir hosting de producción: **Vercel project (root `apps/web`)** o equivalente + `NEXT_PUBLIC_APP_URL` real; probar build/start en prod.
2. Provisionar **PostgreSQL de producción** + aplicar las 2 migraciones + verificar esquema.
3. Configurar **Cloudflare R2** (keys reales, bucket, `R2_PUBLIC_URL`) y subir media.
4. Definir **dominio + SSL** y verificar canonical/redirects/HSTS.
5. Definir y aprobar **spec de backups/RPO/RTO** (TICKET-031) e implementar/reprobar restore.
6. Definir **spec de observabilidad mínima** (TICKET-030): logs/health + analytics con keys reales.
7. Configurar **Resend** con dominio verificado y probar emails críticos (forgot/reset).
8. Decisión de producto sobre **pagos**: mock con gestión manual vs TICKET-010 (dinero real).
9. **Versión 1.0.0 + tag RC** + checklist Go Live + procedimiento de rollback.

---

## Impacto

Documento sin cambios de código productivo. No se modifican funcionalidades ni arquitectura.