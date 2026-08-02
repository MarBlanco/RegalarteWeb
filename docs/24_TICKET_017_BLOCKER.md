# TICKET-017 — Blocker Report

## Ticket

TICKET-017 — Gestión de Contenido.

Responsable: MANCHY.
Estado: ⏳ PENDIENTE — bloqueado por gap en documentación.

## Resumen

TICKET-017 no puede implementarse bajo las reglas del Sprint 4 sin introducir
arquitectura nueva ni inventar entidades no definidas en la documentación
congelada.

## Hallazgo

Al analizar los `Collections` y `Globals` registrados en `apps/web/src/payload.config.ts`
y los tipos generados en `apps/web/src/payload-types.ts`, **no existe ninguna
entidad de "contenido"** en el codebase:

- Collections registradas: `Users`, `Media`, `Categories`, `ProductTags`,
  `Products`, `ProductAttributes`, `ProductImages`, `Orders`.
- Globals registrados: ninguno (`globals: {}` en `Config.globals`).
- No existen `Pages`, `Banners`, `Homepage`, `Posts`, `SolisticaContent`,
  `LegalPages`, `News` ni ninguna entidad editorial análoga.

`Media` es la librería de assets (imágenes para productos), no contenido
editorial. `Categories` pertenece al grupo `Catálogo` (TICKET-016). El resto
son entidades comerciales o de identidad.

## Búsqueda en documentación congelada

Búsqueda exhaustiva en `docs/` (00–22, BUILD_STATUS, IMPLEMENTATION_ROADMAP,
PROJECT_CONTEXT, SPRINTS, knowledge/) para definir la entidad "Contenido":

- `TICKET-017`, `Content Admin`, `Pages Collection`, `Banners Admin`,
  `Homepage Collection`: 0 referencias.
- "contenido CMS" / "administrado desde CMS" / "configurado desde CMS":
  menciones genéricas que **no definen** ninguna entidad concreta, sus
  campos ni su cardinalidad.
- `SPRINTS.md` menciona "Solística Content" como item futuro (Sprint 5)
  y "Homepage" como entregable de Sprint 4 de Discovery Commerce
  (no de Administración). Ninguno asociado a TICKET-017.

## Por qué no se puede implementar

El ticket pide "implementar únicamente las mejoras faltantes" sobre
"todos los Globals y Collections utilizados para contenido". No hay tales
entidades, por lo tanto no hay mejoras faltantes que aplicar.

Las únicas salidas posibles violan al menos una regla del ticket:

| Salida | Regla violada |
|---|---|
| Inventar `Pages` / `Banners` / `SiteContent` | "No agregar arquitectura nueva", "Sin migraciones" |
| Reinterpretar `Media` como "contenido" | Alcance del ticket |
| Reinterpretar `Categories` como "contenido" | TICKET-016 (otro ticket), "No modificar otros tickets" |
| Solo `admin.description` etc. sin entidad objetivo | No hay objeto al que aplicarlo |

## Recomendación

Antes de reabrir TICKET-017:

1. Definir en la documentación fuente (PRD / System Architecture / Data Model)
   qué entidades componen "Gestión de Contenido" para Regalarte: candidato
   natural = `Pages` (Homepage + páginas legales) o `Banners` + `Pages`.
2. Confirmar si "Contenido" en realidad equivale a los items descritos
   en `SPRINTS.md` Sprint 4 Discovery Commerce (`Homepage`, `Gift Discovery`,
   `Gift Finder`, `Wishlist Emocional`), en cuyo caso TICKET-017 sería
   un duplicado y debería renumerarse o replanificarse.
3. Solo entonces reabrir TICKET-017 con spec de entidades, campos y
   permisos aprobada.

## Estado

Sin código modificado. Sin dependencias nuevas. Sin migraciones. Sin
cambios de arquitectura. Branch `feature/ticket-017-content-admin`
creado únicamente para alojar este reporte y permitir trazabilidad de
la decisión.
