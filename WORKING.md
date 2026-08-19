## Sprint 3 — Compra

| Ticket | Descripción | Responsable | Estado |
|---------|-------------|-------------|--------|
| TICKET-005 | Infraestructura del carrito | Martín | ✅ COMPLETADO |
| TICKET-006 | Drawer + Add to Cart | Martín | ✅ COMPLETADO |
| TICKET-007 | Página del carrito | Martín | ✅ COMPLETADO |
| TICKET-008 | Checkout | Martín | ✅ COMPLETADO |
| TICKET-009 | Orders | MANCHY | ✅ COMPLETADO |
| TICKET-010 | Mercado Pago | Martín | ✅ COMPLETADO |
| TICKET-011 | Sincronización del carrito | MANCHY | ✅ COMPLETADO |

## Sprint 4 — Administration

| Ticket | Descripción | Responsable | Estado |
|---------|-------------|-------------|--------|
| TICKET-012 | Dashboard administrativo | Martín | ✅ COMPLETADO |
| TICKET-013 | Gestión de Productos | Martín | ✅ COMPLETADO |
| TICKET-014 | Gestión de Pedidos | Martín | ✅ COMPLETADO |
| TICKET-015 | Gestión de Clientes | Martín | ✅ COMPLETADO |
| TICKET-016 | Gestión de Categorías | MANCHY | ✅ COMPLETADO |
| TICKET-017 | Gestión de Contenido | MANCHY | 🚫 BLOQUEADO |
| TICKET-018 | Configuración básica de la tienda | Martín | ✅ COMPLETADO |

## Sprint 5 — Marketing

| Ticket | Descripción | Responsable | Estado |
|---------|-------------|-------------|--------|
| TICKET-019 | SEO técnico | Martín | ✅ COMPLETADO |
| TICKET-020 | Open Graph | Martín | ✅ COMPLETADO |
| TICKET-021 | WhatsApp comercial | Martín | 🚫 BLOQUEADO |
| TICKET-022 | Google Analytics | MANCHY | ✅ COMPLETADO |
| TICKET-023 | PostHog | MANCHY | ✅ COMPLETADO |
| TICKET-024 | Microsoft Clarity | MANCHY | ✅ COMPLETADO |
| TICKET-025 | Resend / Leads | Martín | 🚫 BLOQUEADO |

## Sprint 6 — Hardening

| Ticket | Descripción | Responsable | Estado |
|---------|-------------|-------------|--------|
| TICKET-026 | Validaciones generales | Martín | ✅ COMPLETADO |
| TICKET-027 | Seguridad | Martín | ✅ COMPLETADO |
| TICKET-028 | Performance | MANCHY | ✅ COMPLETADO |
| TICKET-029 | Accesibilidad | MANCHY | ✅ COMPLETADO |
| TICKET-030 | Observabilidad | MANCHY | 🚫 BLOQUEADO |
| TICKET-031 | Backups y recuperación | Martín | 🚫 BLOQUEADO |

### Estado del Sprint

- Sprint preparado.
- No comenzar ningún ticket hasta finalizar oficialmente el Sprint 5.
- La asignación de responsables queda congelada.

# DEVEX — Developer Experience

Objetivo:

Profesionalizar el flujo de desarrollo antes del Go Live sin agregar funcionalidades nuevas al producto.

| Ticket | Descripción | Responsable | Estado |
|---------|-------------|-------------|--------|
| TICKET-032 | Continuous Integration | Martín | ✅ COMPLETADO |
| TICKET-033 | CodeRabbit | MANCHY | ⏳ PENDIENTE (requiere owner) |
| TICKET-034 | SonarCloud | MANCHY | ✅ COMPLETADO (requiere owner: deshabilitar Automatic Analysis) |
| TICKET-035 | Branch Protection | Martín | ✅ COMPLETADO |
| TICKET-036 | GitHub Templates | MANCHY | ⏳ PENDIENTE |
| TICKET-037 | Dependabot | Martín | ✅ COMPLETADO |

## Descripción de Tickets

### TICKET-032 — Continuous Integration

Configurar GitHub Actions para ejecutar automáticamente Build, Lint y Typecheck en cada Pull Request.

### TICKET-033 — CodeRabbit

Integrar CodeRabbit para obtener revisiones automáticas de código en todos los Pull Requests.

### TICKET-034 — SonarCloud

Integrar SonarCloud para análisis de calidad, vulnerabilidades, bugs y mantener un Quality Gate.

### TICKET-035 — Branch Protection

Configurar reglas de protección de la rama main para impedir cambios directos y exigir Pull Requests con verificaciones aprobadas.

### TICKET-036 — GitHub Templates

Crear templates oficiales para Pull Requests, Issues, Bug Reports y Feature Requests.

### TICKET-037 — Dependabot

Configurar Dependabot para detectar y proponer automáticamente actualizaciones de dependencias.

# RELEASE READINESS

## Auditorías Completadas

| Auditoría | Estado | Observaciones |
|-----------|--------|---------------|
| AUDIT-001 | ✅ CLOSED | Repository Audit certificada y cerrada. Ver Final Closure Report. |
| AUDIT-002 | ✅ CLOSED | Build & Quality Audit certificada y cerrada. Ver Final Closure Report. |
| AUDIT-003 | ✅ CLOSED | Security & Production Config Audit certificada y cerrada. Ver Final Closure Report. |
| AUDIT-004 | ✅ CLOSED | Ecommerce Critical Flows & Data Integrity Audit certificada y cerrada. Ver Final Closure Report. |
| AUDIT-005 | ✅ CLOSED | Order, Stock & Payment Integrity Audit certificada y cerrada. Ver Final Closure Report. |
| AUDIT-006 | ✅ CLOSED | Release & Production Readiness certificada y cerrada. **3 BLOCKERS reales resueltos**: deploy (Vercel Production, dominio canónico operativo), PostgreSQL prod (Neon + 3 migraciones aplicadas, endpoints DB 200), Cloudflare R2 (vars configuradas en Vercel, endpoint corregido y verificado). Resto ACCEPTED/DEFERRED. Ver Go Live Assessment. |

## Estado General de la Fase

AUDIT-001 a AUDIT-005 se encuentran CLOSED, certificados por auditor independiente.

AUDIT-006 (Release & Production Readiness) se encuentra **CLOSED** (2026-08-18). Los **3 BLOCKERS
reales** del assessment quedaron resueltos y verificados en Production:
**deploy** (Vercel, proyecto `regalarte-web-web`, root `apps/web`, dominio canónico operativo),
**PostgreSQL de producción** (Neon, 3 migraciones aplicadas, `prodMigrations` bundleado, endpoints
de Payload respondiendo contra la DB prod) y **Cloudflare R2** (4 vars configuradas en Vercel,
`R2_ENDPOINT` corregido y validado como endpoint S3 R2 vivo; plugin `s3Storage` activo en prod).
Backups (TICKET-031), observabilidad (TICKET-030), dominio custom, Resend y pagos permanecen
**ACCEPTED/DEFERRED** (no impiden la operación de V1 según documentación aprobada).
Ver `docs/AUDIT-006_GO_LIVE_ASSESSMENT.md`.

Mercado Pago real (TICKET-010), idempotencia y stock quedan DEFERRED/ACCEPTED según la
documentación aceptada: la V1 puede operar sin pagos online reales (provider mock, órdenes
`pending` gestionadas por admin).

Los **3 BLOCKERS reales** del assessment (deploy, DB prod, R2) quedaron resueltos (2026-08-18):
AUDIT-006 CLOSED. El Release Candidate queda habilitado para su planificación posterior
(entregables Sprint 8: PWA, Testing E2E, dominio custom, tag RC, doc final) según la hoja de ruta.

---

## Estado de Tickets por Fase

### Sprint 1-5: COMPLETADOS
Todos los tickets de Foundation, Catalog, Commerce, Discovery Commerce, Experiencias Diferenciadoras y Marketing están COMPLETADOS o BLOQUEADOS por decisión de producto.

### Sprint 6 - Hardening: COMPLETADO
| Ticket | Estado |
|--------|--------|
| TICKET-026 Validaciones | ✅ COMPLETADO |
| TICKET-027 Seguridad | ✅ COMPLETADO |
| TICKET-028 Performance | ✅ COMPLETADO |
| TICKET-029 Accesibilidad | ✅ COMPLETADO |
| TICKET-030 Observabilidad | 🚫 BLOQUEADO |
| TICKET-031 Backups | 🚫 BLOQUEADO |

### DEVEX - Developer Experience: EN PROGRESO
| Ticket | Estado |
|--------|--------|
| TICKET-032 CI | ✅ COMPLETADO |
| TICKET-033 CodeRabbit | ⏳ PENDIENTE (requiere owner) |
| TICKET-034 SonarCloud | ✅ COMPLETADO (requiere owner: deshabilitar Automatic Analysis) |
| TICKET-035 Branch Protection | ✅ COMPLETADO |
| TICKET-036 GitHub Templates | ⏳ PENDIENTE |
| TICKET-037 Dependabot | ✅ COMPLETADO |