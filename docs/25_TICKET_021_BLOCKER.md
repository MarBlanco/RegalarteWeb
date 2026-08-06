# TICKET-021 — Blocker Report

## Ticket

TICKET-021 — WhatsApp comercial.

Responsable: Martín.
Estado: 🚫 BLOQUEADO — falta configuración aprobada.

## Resumen

TICKET-021 no puede implementarse porque no existe una fuente aprobada
para el número de WhatsApp comercial de la tienda en la documentación
congelada ni en el codebase.

## Hallazgo

Al analizar el código existente, no hay ningún origen definido para el
número comercial de WhatsApp del storefront:

- `CommerceSettings` (Global registrado en `apps/web/src/payload.config.ts`)
  solo expone `wholesale_enabled` y `minimum_wholesale_order`. No existe
  ningún campo `whatsapp` / `whatsapp_number` / contacto.
- `Users.whatsapp` (Collection) es el número **por cliente**, no la línea
  comercial de la tienda.
- `.env.example` no define ninguna variable `WHATSAPP_*`. Únicamente existe
  `NEXT_PUBLIC_APP_URL` (usado para SEO/OG) y placeholders de analytics
  (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_*`).

## Por qué no se puede implementar

El ticket pide introducir el WhatsApp comercial en el storefront. Toda
alternativa razonable requiere decidir la fuente de la verdad, lo cual
debe definirse en el PRD / Arquitectura antes de implementar:

| Fuente candidata | Requiere | Regla a valorar |
|---|---|---|
| Campo nuevo en `CommerceSettings` (Global) | Nuevo campo + migración | "Sin cambios de arquitectura sin spec aprobada" |
| Variable de entorno `WHATSAPP_*` | Documentar variable en PRD/env | "Config definida en docs congelados" |
| Nueva entidad/recolección | Arquitectura nueva | Reglas del ticket |

Ninguna fuente está aprobada en `docs/` (00–22, BUILD_STATUS, SPRINTS,
knowledge/). Tampoco hay `avatar` de contacto comercial definido en el
backend actual.

## Recomendación

Antes de reabrir TICKET-021, definir y aprobar la fuente del número
comercial en la documentación fuente (PRD / System Architecture / Data
Model): campo en `CommerceSettings`, variable de entorno, o entidad
dedicada. Solo entonces reabrir con spec de campos, visibilidad y
formato (E.164) aprobada.

## Estado

Sin código modificado. Sin dependencias nuevas. Sin migraciones. Sin
cambios de arquitectura. Branch `feature/ticket-021-whatsapp` creado
únicamente para alojar este reporte y la actualización de `WORKING.md`,
permitir la trazabilidad de la decisión.