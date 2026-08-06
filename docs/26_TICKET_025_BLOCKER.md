# TICKET-025 — Blocker Report

## Ticket

TICKET-025 — Resend / Leads.

Responsable: Martín.
Estado: 🚫 BLOQUEADO — falta spec aprobada de captura de leads.

## Resumen

TICKET-025 no puede implementarse porque no existe información aprobada
que defina la captura de leads. La integración de Resend en su forma
actual (adapter de email de Payload) ya existe; lo que falta es la
spec del producto "lead" en sí, que no está definida en la documentación
congelada.

## Qué existe hoy (integración Resend)

La integración con Resend **ya está preparada a nivel de infraestructura**
y no hay gap que completar en ese plano:

- Adapter configurado en `apps/web/src/payload.config.ts` vía
  `resendAdapter` de `@payloadcms/email-resend`, activo cuando
  `RESEND_API_KEY` existe y no es `placeholder`.
- Variables de entorno en `.env.example`: `RESEND_API_KEY`,
  `RESEND_FROM_EMAIL` (`noreply@regalarte.com`), `RESEND_FROM_NAME`
  (`REGALARTE`).
- Se usa hoy para emails transaccionales/auth (verify, forgot-password,
  reset-password) del flujo de `Users`.
- No existe el SDK standalone `resend` en `apps/web/package.json`; no se
  necesita para el adapter de Payload.

## Qué falta (spec de leads)

No hay ninguna definición aprobada de captura de leads en `docs/`
(00–22, BUILD_STATUS, IMPLEMENTATION_ROADMAP, PROJECT_CONTEXT, SPRINTS,
knowledge/):

- No existe colección `Lead`, `Contact`, `Newsletter` ni `Subscribers`.
  Collections registradas: `Users`, `Media`, `Categories`, `ProductTags`,
  `Products`, `ProductAttributes`, `ProductImages`, `Orders`. Globals:
  solo `CommerceSettings`.
- No existe formulario de newsletter ni de contacto en el frontend
  (el footer no tiene captura de email; no hay página `/contacto`).
- No existe endpoint de captura (`/api/leads`, server action, etc.).
- No existe template de email de lead aprobado.
- La única mención a "formularios" es la lista de componentes a revisar
  en `docs/09_UI_DESIGN_SYSTEM.md`, sin definir captura de leads.
- `SPRINTS.md` lista "Resend" como entregable de SPRINT 10 (MARKETING),
  pero no especifica qué es un lead, dónde se captura ni qué se hace con él.

## Por qué no se puede implementar

El ticket pide "dejar preparada la integración de captura de leads
utilizando Resend". Toda alternativa razonable requiere inventar
funcionalidad o arquitectura no aprobada:

| Opción | Problema |
|---|---|
| Crear colección `Lead`/`Contact`/`Newsletter` | Arquitectura nueva sin spec en docs congelados |
| Crear formulario de newsletter en footer/página | No definido en ninguna blueprint UI aprobada |
| Crear endpoint/server action de captura | Inventar API no aprobada |
| Crear template de email de lead | No definido (docs 20 solo menciona "Templates" sin detalle) |
| Reutilizar `Users` como "leads" | Confunde entidad comercial/identidad con marketing; cambia alcance |

Ninguna salida es implementable sin violar "No inventar funcionalidades"
ni "Utilizar únicamente capacidades aprobadas para la V1".

## Recomendación

Antes de reabrir TICKET-025, definir y aprobar en la documentación fuente
(PRD / System Architecture / Data Model / UI blueprints):

1. Qué es un "lead" para Regalarte (¿newsletter? ¿contacto? ¿ambos?).
2. Dónde se captura (footer, página `/contacto`, otra).
3. Qué colección/entidad lo almacena (¿nueva colección o solo envío de
   email con Resend?).
4. Qué template de email se envía y a qué destinatario.
5. Qué hace el flujo con el dato (V1: solo envío de email; sin CRM, sin
   automatizaciones, sin campañas).

Solo entonces reabrir TICKET-025 con spec aprobada.

## Estado

Sin código modificado. Sin dependencias nuevas. Sin migraciones. Sin
cambios de arquitectura. Typecheck en rama limpia: solo el baseline
invariante (2 TS2578 preexistentes en `(payload)/admin/[[...segments]]`).
Branch `feature/ticket-025-resend-leads` creado únicamente para alojar
este reporte y permitir trazabilidad de la decisión.